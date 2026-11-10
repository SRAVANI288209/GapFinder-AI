import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/lib/storage';
import { DocumentProcessor } from '@/lib/document-processor';
import { DocumentType } from '@/types';
import { generateEmbedding } from '@/lib/embeddings';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'demo-student-uuid-101';

    const docs = await StorageService.getDocuments(userId);
    return NextResponse.json({ success: true, documents: docs });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const documentType = (formData.get('documentType') as DocumentType) || 'textbook';
    const userId = (formData.get('userId') as string) || 'demo-student-uuid-101';
    const subjectId = (formData.get('subjectId') as string) || 'subj-cs301';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided in upload request.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const docId = `doc-${Date.now()}`;

    // 1. Process document: extract text, clean, chunk
    const processed = await DocumentProcessor.process(
      buffer,
      file.name,
      file.type,
      {
        documentId: docId,
        userId,
        documentType,
        subjectId,
      }
    );

    // 2. Generate vector embeddings for chunks
    for (const chunk of processed.chunks) {
      chunk.embedding = await generateEmbedding(chunk.content);
    }

    // 3. Save chunks in vector storage
    await StorageService.saveChunks(userId, processed.chunks);

    // 4. Save document record
    const docRecord = {
      id: docId,
      userId,
      subjectId,
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
      fileSize: file.size,
      documentType,
      pageCount: processed.pageCount,
      extractedTextSnippet: processed.snippet,
      status: 'ready' as const,
      createdAt: new Date().toISOString(),
    };

    await StorageService.saveDocument(docRecord);

    return NextResponse.json({
      success: true,
      document: docRecord,
      chunkCount: processed.chunks.length,
    });
  } catch (err: any) {
    console.error('Document upload error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to process document' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'demo-student-uuid-101';

    await StorageService.deleteAllDocuments(userId);
    return NextResponse.json({ success: true, message: 'All documents deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
