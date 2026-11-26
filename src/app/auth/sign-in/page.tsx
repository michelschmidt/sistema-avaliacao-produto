import type { Metadata } from "next";
import { SignInForm } from "./_components/sign-in-form";

export const metadata: Metadata = {
  title: "Entrar · Avalia",
};

export default function SignInPage() {
  return <SignInForm />;
}
