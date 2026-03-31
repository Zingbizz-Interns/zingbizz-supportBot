import { and, eq } from "drizzle-orm";
import { db } from "../client";
import { accounts, type Account, type NewAccount } from "../schema";

export async function findAccountByProvider(
  provider: string,
  providerAccountId: string
): Promise<Account | null> {
  const result = await db
    .select()
    .from(accounts)
    .where(
      and(
        eq(accounts.provider, provider),
        eq(accounts.providerAccountId, providerAccountId)
      )
    )
    .limit(1);
  return result[0] ?? null;
}

export async function linkAccount(data: NewAccount): Promise<Account> {
  const result = await db.insert(accounts).values(data).returning();
  return result[0];
}
