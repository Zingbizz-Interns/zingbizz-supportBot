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

export async function getQueryStats(
  chatbotId: string
): Promise<{ total: number; answered: number; unanswered: number }> {
  const result = await db.execute(sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE answered = true)::int AS answered,
      COUNT(*) FILTER (WHERE answered = false)::int AS unanswered
    FROM queries
    WHERE chatbot_id = ${chatbotId}
  `);

  const row = result.rows[0] as { total: number; answered: number; unanswered: number } | undefined;
  return {
    total: Number(row?.total ?? 0),
    answered: Number(row?.answered ?? 0),
    unanswered: Number(row?.unanswered ?? 0),
  };
}

export async function getDailyQuestionCounts(
  chatbotId: string,
  days = 7
): Promise<Array<{ date: string; count: number; answered: number }>> {
  const result = await db.execute(sql`
    WITH date_series AS (
      SELECT generate_series(
        CURRENT_DATE - (${days} - 1) * INTERVAL '1 day',
        CURRENT_DATE,
        INTERVAL '1 day'
      )::date AS date
    ),
    counts AS (
      SELECT
        DATE(created_at) AS date,
        COUNT(*)::int AS count,
        COUNT(*) FILTER (WHERE answered = true)::int AS answered
      FROM queries
      WHERE
        chatbot_id = ${chatbotId}
        AND created_at >= CURRENT_DATE - (${days} - 1) * INTERVAL '1 day'
        AND created_at < CURRENT_DATE + INTERVAL '1 day'
      GROUP BY DATE(created_at)
    )
    SELECT
      date_series.date::text AS date,
      COALESCE(counts.count, 0)::int AS count,
      COALESCE(counts.answered, 0)::int AS answered
    FROM date_series
    LEFT JOIN counts ON counts.date = date_series.date
    ORDER BY date_series.date ASC
  `);

  return (result.rows as Array<{ date: string; count: number; answered: number }>).map((row) => ({
    date: row.date,
    count: Number(row.count),
    answered: Number(row.answered),
  }));
}
