import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserByEmail, createUser } from "@/lib/db/queries/users";
import { parseBody } from "@/lib/validation/parse";
import { registerSchema } from "@/lib/validation/schemas";
import { BCRYPT_ROUNDS } from "@/lib/config/constants";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parseBody(registerSchema, body);
  if (!parsed.ok) return parsed.response;

  const { email, password } = parsed.data;

  try {
    const existing = await getUserByEmail(email);
    if (existing) {
      const message = !existing.passwordHash
        ? "This email is linked to a Google or GitHub account. Please sign in with that provider."
        : "An account with this email already exists";
      return NextResponse.json({ error: message }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await createUser({
      email: email.toLowerCase().trim(),
      passwordHash,
    });

    return NextResponse.json({ success: true, userId: user.id }, { status: 201 });
  } catch (error) {
    console.error("[register] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
