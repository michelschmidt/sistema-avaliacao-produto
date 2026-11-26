import type { Metadata } from "next";
import { SignUpForm } from "./_components/sign-up-form";

export const metadata: Metadata = {
  title: "Criar conta · Avalia",
};

export default function SignUpPage() {
  return <SignUpForm />;
}
