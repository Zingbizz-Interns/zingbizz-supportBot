import { SignupForm } from "@/components/auth/signup-form";
import { oauthProviders } from "@/lib/auth";

export default function SignupPage() {
  return <SignupForm oauthProviders={oauthProviders} />;
}
