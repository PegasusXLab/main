import type { Metadata } from "next";
import { AuthPage } from "@/components/auth/AuthPage";

export const metadata: Metadata = {
  title: "Create an account — Galleriverse",
  description:
    "Create a free Galleriverse workspace: draw a room, hang your work, open the doors.",
};

export default function RegisterPage() {
  return <AuthPage mode="register" />;
}
