"use client";

import { Suspense, useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { OAuthButtons } from "@/components/ui/oauth-buttons";

interface LoginFormProps {
  oauthProviders: {
    google: boolean;
    github: boolean;
  };
}

function LoginFormInner({ oauthProviders }: LoginFormProps) {
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    oauthError ? "Sign in failed. Please try again." : null
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
      } else {
        window.location.href = "/dashboard";
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card hover={false} className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-3xl font-semibold text-[#2D3A31] mb-2">
          Welcome back
        </h1>
        <p className="font-sans text-[#2D3A31]/60 text-base">
          Sign in to your account to continue
        </p>
      </div>

      <OAuthButtons providers={oauthProviders} />

      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-5 mt-5"
      >
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />

        {error && (
          <p
            role="alert"
            className="font-sans text-sm text-[#C27B66] text-center"
          >
            {error}
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={loading}
          className="w-full mt-2"
        >
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center font-sans text-sm text-[#2D3A31]/60">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-[#2D3A31] font-medium underline underline-offset-4 hover:text-[#3d5245] transition-colors duration-300"
        >
          Sign up
        </Link>
      </p>
    </Card>
  );
}

export function LoginForm(props: LoginFormProps) {
  return (
    <Suspense>
      <LoginFormInner {...props} />
    </Suspense>
  );
}
