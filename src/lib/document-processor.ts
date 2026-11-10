/**
 * GapFinder AI - Document Processor
 * Handles text extraction from PDF & TXT, cleaning, and metadata-aware chunking.
 */

import { DocumentChunk, DocumentType } from '@/types';

export interface ChunkingOptions {
  chunkSize?: number; // target character length per chunk (default: 1200)
  chunkOverlap?: number; // character overlap between consecutive chunks (default: 150)
}

export interface ProcessedDocument {
  fullText: string;
  pageCount: number;
  snippet: string;
  chunks: DocumentChunk[];
}

export class DocumentProcessor {
  /**
   * Extract text from Buffer based on file mime or extension
   */
  static async extractText(
    fileBuffer: Buffer,
    fileName: string,
    fileType: string
  ): Promise<{ text: string; pageCount: number }> {
    const isPdf =
      fileName.toLowerCase().endsWith('.pdf') ||
      fileType === 'application/pdf';

    if (isPdf) {
      try {
        // Dynamic import of pdf-parse to be resilient in Next.js App Router / Edge runtimes
        const pdfParse = (await import('pdf-parse')).default;
        const pdfData = await pdfParse(fileBuffer);
        return {
          text: pdfData.text || '',
          pageCount: pdfData.numpages || 1,
        };
      } catch (err) {
        console.warn('pdf-parse failed, attempting text decode:', err);
        const text = fileBuffer.toString('utf-8');
        return {
          text: text.replace(/[^\x20-\x7E\n\r\t]/g, ' '),
          pageCount: 1,
        };
      }
    } else {
      // Plain text, markdown, or code
      const text = fileBuffer.toString('utf-8');
      const estimatedPages = Math.max(1, Math.ceil(text.length / 2500));
      return {
        text,
        pageCount: estimatedPages,
      };
    }
  }

  /**
   * Clean text: normalize whitespace, remove unprintable chars
   */
  static cleanText(rawText: string): string {
    return rawText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n\s*\n+/g, '\n\n')
      .trim();
  }

  /**
   * Chunk text into overlapping passages with page number tracking
   */
  static createChunks(
    cleanedText: string,
    metadata: {
      documentId: string;
      userId: string;
      fileName: string;
      documentType: DocumentType;
      subjectId: string;
      pageCount: number;
    },
    options: ChunkingOptions = {}
  ): DocumentChunk[] {
    const chunkSize = options.chunkSize || 1200;
    const overlap = options.chunkOverlap || 150;

    const chunks: DocumentChunk[] = [];
    const totalLength = cleanedText.length;

    if (totalLength === 0) {
      return chunks;
    }

    let start = 0;
    let chunkIndex = 0;
    const totalPages = Math.max(1, metadata.pageCount);
    const charsPerPage = Math.max(1, Math.floor(totalLength / totalPages));

    while (start < totalLength) {
      let end = start + chunkSize;

      // If not at the end of text, attempt to break at a natural sentence boundary (. or \n)
      if (end < totalLength) {
        const nextSentenceEnd = cleanedText.indexOf('. ', end - 100);
        const nextParagraphEnd = cleanedText.indexOf('\n\n', end - 150);

        if (nextParagraphEnd !== -1 && nextParagraphEnd <= end + 150) {
          end = nextParagraphEnd + 2;
        } else if (nextSentenceEnd !== -1 && nextSentenceEnd <= end + 100) {
          end = nextSentenceEnd + 2;
        }
      } else {
        end = totalLength;
      }

      const chunkContent = cleanedText.slice(start, end).trim();

      if (chunkContent.length > 50) {
        // Approximate page number for this chunk
        const pageNumber = Math.min(
          totalPages,
          Math.max(1, Math.floor(start / charsPerPage) + 1)
        );

        chunks.push({
          id: `chunk-${metadata.documentId}-${chunkIndex}`,
          documentId: metadata.documentId,
          userId: metadata.userId,
          content: chunkContent,
          pageNumber,
          chunkIndex,
          metadata: {
            fileName: metadata.fileName,
            documentType: metadata.documentType,
            subjectId: metadata.subjectId,
            tokenCount: Math.ceil(chunkContent.length / 4),
          },
        });
        chunkIndex++;
      }

      start = end - overlap;
      if (start >= totalLength || end >= totalLength) {
        break;
      }
    }

    return chunks;
  }

  /**
   * Complete end-to-end processing pipeline
   */
  static async process(
    fileBuffer: Buffer,
    fileName: string,
    fileType: string,
    metadata: {
      documentId: string;
      userId: string;
      documentType: DocumentType;
      subjectId: string;
    },
    options?: ChunkingOptions
  ): Promise<ProcessedDocument> {
    const { text, pageCount } = await this.extractText(fileBuffer, fileName, fileType);
    const cleaned = this.cleanText(text);
    const snippet = cleaned.slice(0, 300) + (cleaned.length > 300 ? '...' : '');

    const chunks = this.createChunks(
      cleaned,
      {
        ...metadata,
        fileName,
        pageCount,
      },
      options
    );

    return {
      fullText: cleaned,
      pageCount,
      snippet,
      chunks,
    };
  }
}
