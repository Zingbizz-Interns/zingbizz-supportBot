import { LoginForm } from "@/components/auth/login-form";
import { oauthProviders } from "@/lib/auth";

export default function LoginPage() {
  return <LoginForm oauthProviders={oauthProviders} />;
}
