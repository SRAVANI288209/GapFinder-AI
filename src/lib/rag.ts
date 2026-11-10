/**
 * GapFinder AI - RAG (Retrieval-Augmented Generation) Pipeline
 * Strictly separates retrieval from generation. Grounded citations only.
 */

import { DocumentChunk, RetrievalResult } from '@/types';
import { generateEmbedding, cosineSimilarity } from './embeddings';
import { getServerSupabase, isSupabaseConfigured } from './supabase/server';
import { StorageService } from './storage';
import { generateAIText } from './ai';

export interface RAGSearchOptions {
  limit?: number;
  threshold?: number;
  documentIds?: string[];
}

export class RAGPipeline {
  /**
   * STEP 6: RETRIEVAL
   * Converts student query into an embedding and retrieves the top-k most relevant chunks.
   * Completely independent of generation.
   */
  static async retrieveRelevantChunks(
    userId: string,
    query: string,
    options: RAGSearchOptions = {}
  ): Promise<RetrievalResult[]> {
    const limit = options.limit || 4;
    const threshold = options.threshold || 0.25;

    // 1. Generate query embedding vector
    const queryVector = await generateEmbedding(query);

    // 2. Try Supabase pgvector match_document_chunks RPC if configured
    if (isSupabaseConfigured()) {
      const supabase = getServerSupabase();
      if (supabase) {
        try {
          const { data, error } = await supabase.rpc('match_document_chunks', {
            query_embedding: queryVector,
            match_threshold: threshold,
            match_count: limit,
            filter_user_id: userId,
          });

          if (!error && data && data.length > 0) {
            return data.map((item: any) => ({
              content: item.content,
              pageNumber: item.page_number,
              documentName: item.metadata?.fileName || 'Uploaded Material',
              documentType: item.metadata?.documentType || 'textbook',
              similarity: item.similarity,
            }));
          }
        } catch (rpcErr) {
          console.warn('Supabase match_document_chunks RPC failed, falling back to vector scan:', rpcErr);
        }
      }
    }

    // 3. Fallback: In-memory cosine similarity calculation over user's chunks
    const allChunks = await StorageService.getChunks(userId);

    if (allChunks.length === 0) {
      return [];
    }

    const scored: RetrievalResult[] = [];

    for (const chunk of allChunks) {
      // Filter by selected document IDs if specified
      if (options.documentIds && options.documentIds.length > 0) {
        if (!options.documentIds.includes(chunk.documentId)) {
          continue;
        }
      }

      let similarity = 0;
      if (chunk.embedding && chunk.embedding.length > 0) {
        similarity = cosineSimilarity(queryVector, chunk.embedding);
      } else {
        // Compute on the fly if chunk had no stored embedding
        const chunkEmbedding = await generateEmbedding(chunk.content);
        chunk.embedding = chunkEmbedding;
        similarity = cosineSimilarity(queryVector, chunkEmbedding);
      }

      if (similarity >= threshold) {
        scored.push({
          content: chunk.content,
          pageNumber: chunk.pageNumber,
          documentName: chunk.metadata.fileName,
          documentType: chunk.metadata.documentType,
          similarity,
        });
      }
    }

    // Sort descending by cosine similarity score
    scored.sort((a, b) => b.similarity - a.similarity);

    return scored.slice(0, limit);
  }

  /**
   * STEP 7: GENERATION
   * Generates grounded answers using retrieved chunks and Groq LLM.
   * If insufficient information is available, explicitly returns:
   * "Insufficient information in the uploaded study material."
   */
  static async generateGroundedAnswer(
    query: string,
    retrievedChunks: RetrievalResult[]
  ): Promise<{
    answer: string;
    citations: { source: string; page: number; textExcerpt?: string }[];
  }> {
    // If no chunks were retrieved or highest similarity is too low
    if (!retrievedChunks || retrievedChunks.length === 0) {
      return {
        answer: 'Insufficient information in the uploaded study material. Please upload notes, textbooks, or syllabus containing this topic to get a grounded answer.',
        citations: [],
      };
    }

    // Build context with strict citation tagging
    const contextBlocks = retrievedChunks
      .map(
        (chunk, idx) =>
          `[Source ${idx + 1}]: "${chunk.documentName}" (Page ${chunk.pageNumber})\nContent: ${chunk.content}`
      )
      .join('\n\n---\n\n');

    const systemPrompt = `You are GapFinder AI, a rigorous academic study assistant.
CRITICAL RULES:
1. Answer the student's question ONLY using the factual information provided in the [CONTEXT] below.
2. Every major claim or statement MUST reference its citation in format: [Source: Document Name, Page: X].
3. If the [CONTEXT] does not contain enough direct information to answer the question, you MUST respond exactly:
   "Insufficient information in the uploaded study material."
4. Do NOT hallucinate, do NOT assume, and do NOT extrapolate outside the retrieved content.`;

    const userPrompt = `[CONTEXT]:
${contextBlocks}

[STUDENT QUESTION]:
${query}

Provide a well-structured, clear explanation with markdown headers and explicit page citations.`;

    const answer = await generateAIText(systemPrompt, userPrompt);

    // Build structured citations list
    const citations = retrievedChunks.map((chunk) => ({
      source: chunk.documentName,
      page: chunk.pageNumber,
      textExcerpt: chunk.content.slice(0, 150) + '...',
    }));

    return {
      answer,
      citations,
    };
  }
}
