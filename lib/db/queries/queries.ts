import { eq, desc, sql, and } from "drizzle-orm";
import { db } from "../client";
import { queries, type NewQuery } from "../schema";

export async function logQuery(data: NewQuery): Promise<void> {
  await db.insert(queries).values(data);
}

export async function getTopQuestions(
  chatbotId: string,
  limit = 20
): Promise<Array<{ question: string; count: number; answered: boolean }>> {
  const result = await db.execute(sql`
    SELECT
      question,
      COUNT(*) AS count,
      BOOL_AND(answered) AS answered
    FROM queries
    WHERE chatbot_id = ${chatbotId}
    GROUP BY question
    ORDER BY count DESC
    LIMIT ${limit}
  `);

  return (result.rows as Array<{ question: string; count: string; answered: boolean }>).map((row) => ({
    question: row.question,
    count: Number(row.count),
    answered: row.answered,
  }));
}

export async function getUnansweredQuestions(
  chatbotId: string,
  limit = 20
): Promise<Array<{ question: string; askedAt: Date }>> {
  const result = await db
    .select({ question: queries.question, askedAt: queries.createdAt })
    .from(queries)
    .where(and(eq(queries.chatbotId, chatbotId), eq(queries.answered, false)))
    .orderBy(desc(queries.createdAt))
    .limit(limit);

  return result.map((row) => ({
    question: row.question,
    askedAt: row.askedAt,
  }));
}
