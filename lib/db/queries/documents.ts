import { sql } from "drizzle-orm";
import { db } from "../client";
import { documents, type NewDocument, type DocumentMetadata } from "../schema";

export async function insertDocuments(docs: NewDocument[]): Promise<void> {
  if (docs.length === 0) return;
  // Insert in batches of 50 to avoid query size limits
  const batchSize = 50;
  for (let i = 0; i < docs.length; i += batchSize) {
    await db.insert(documents).values(docs.slice(i, i + batchSize));
  }
}

export async function searchDocuments(
  chatbotId: string,
  queryEmbedding: number[],
  limit = 5
): Promise<Array<{ content: string; metadata: DocumentMetadata; similarity: number }>> {
  const embeddingStr = `[${queryEmbedding.join(",")}]`;

  const result = await db.execute(sql`
    SELECT
      content,
      metadata,
      1 - (embedding <=> ${embeddingStr}::vector) AS similarity
    FROM documents
    WHERE chatbot_id = ${chatbotId}
    ORDER BY embedding <=> ${embeddingStr}::vector
    LIMIT ${limit}
  `);

  return (result.rows as Array<{ content: string; metadata: unknown; similarity: number }>).map((row) => ({
    content: row.content,
    metadata: row.metadata as DocumentMetadata,
    similarity: Number(row.similarity),
  }));
}

export async function deleteDocumentsBySource(
  chatbotId: string,
  sourceKey: string
): Promise<void> {
  await db.execute(sql`
    DELETE FROM documents
    WHERE chatbot_id = ${chatbotId}
    AND (
      metadata->>'url' = ${sourceKey}
      OR metadata->>'file_name' = ${sourceKey}
    )
  `);
}

export async function getDocumentSources(
  chatbotId: string
): Promise<Array<{ url: string | null; title: string | null; source_type: string; file_name: string | null; chunk_count: number; created_at: string | null }>> {
  const result = await db.execute(sql`
    SELECT
      metadata->>'url' AS url,
      metadata->>'title' AS title,
      metadata->>'source_type' AS source_type,
      metadata->>'file_name' AS file_name,
      COUNT(*) AS chunk_count,
      MIN(created_at) AS created_at
    FROM documents
    WHERE chatbot_id = ${chatbotId}
    GROUP BY
      metadata->>'url',
      metadata->>'title',
      metadata->>'source_type',
      metadata->>'file_name'
    ORDER BY MIN(created_at) DESC
  `);

  return result.rows as Array<{
    url: string | null;
    title: string | null;
    source_type: string;
    file_name: string | null;
    chunk_count: number;
    created_at: string | null;
  }>;
}
