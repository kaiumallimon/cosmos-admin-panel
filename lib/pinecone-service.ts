import { Pinecone } from "@pinecone-database/pinecone";

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!
});

const INDEX_NAME = 'cosmos-previous-questions';

export interface UpsertResult {
  success: boolean;
  message: string;
  vectorId?: string;
  namespace?: string;
}

export interface NamespaceResult {
  index: any;
  namespace: string;
}

function sanitizeNameSpace(name: string): string {
  return name.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
}

export async function getCourseNameSpace(courseShort: string): Promise<NamespaceResult> {
  const index = pc.Index(INDEX_NAME);
  const namespace = sanitizeNameSpace(`course-${courseShort}`);
  return {
    index: index,
    namespace: namespace
  };
}

export async function upsertVector(
  index: any,
  namespace: string,
  vectorId: string,
  embedding: number[],
  metadata: Record<string, any>
): Promise<UpsertResult> {
  try {
    await index.namespace(namespace).upsert([
      {
        id: vectorId,
        values: embedding,
        metadata: metadata
      }
    ]);
    return {
      success: true,
      message: 'Vector upserted successfully',
      vectorId: vectorId,
      namespace: namespace,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || error.toString()
    };
  }
}

export async function deleteVector(
  index: any,
  namespace: string,
  vectorId: string
): Promise<UpsertResult> {
  try {
    await index.namespace(namespace).deleteOne(vectorId);
    return {
      success: true,
      message: 'Vector deleted successfully',
      vectorId: vectorId,
      namespace: namespace,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || error.toString()
    };
  }
}