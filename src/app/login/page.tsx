import type { Metadata } from "next";
import { AuthPage } from "@/components/auth/AuthPage";

export const metadata: Metadata = {
  title: "Log in — Galleriverse",
  description:
    "Pick up where you left off: sign in to your Galleriverse workspace.",
};

export default function LoginPage() {
  return <AuthPage mode="login" />;
}
