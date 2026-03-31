import { eq } from "drizzle-orm";
import { db } from "../client";
import { users, type User, type NewUser } from "../schema";
import { findAccountByProvider, linkAccount } from "./accounts";

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  return result[0] ?? null;
}

export async function getUserById(id: string): Promise<User | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function createUser(data: NewUser): Promise<User> {
  const result = await db.insert(users).values(data).returning();
  return result[0];
}

export async function getOrCreateOAuthUser(
  email: string,
  provider: string,
  providerAccountId: string
): Promise<User> {
  // Already linked account → return existing user
  const existingAccount = await findAccountByProvider(provider, providerAccountId);
  if (existingAccount) {
    const user = await getUserById(existingAccount.userId);
    if (user) return user;
  }

  // User with this email exists → link the new provider account
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    await linkAccount({ userId: existingUser.id, provider, providerAccountId });
    return existingUser;
  }

  // Brand-new user via OAuth → create user row + link account
  const newUser = await createUser({ email: email.toLowerCase(), passwordHash: null });
  await linkAccount({ userId: newUser.id, provider, providerAccountId });
  return newUser;
}
