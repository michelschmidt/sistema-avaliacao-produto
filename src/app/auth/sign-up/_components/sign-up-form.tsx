"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { safeNextPath } from "@/lib/validations/sign-in";
import { type SignUpInput, signUpSchema } from "@/lib/validations/sign-up";
import { useTRPC } from "@/trpc/client";
import {
  AuthSwitchLink,
  authSwitchLinkClass,
} from "../../_components/auth-switch-link";
import { PasswordInput } from "../../_components/password-input";
import { ReviewPanel, ReviewStrip } from "../../_components/review-panel";

const defaultValues: SignUpInput = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const fieldClass =
  "h-11 rounded-[10px] bg-field px-3.5 text-base md:text-base dark:bg-field";

const { shape } = signUpSchema;

/** Quantos dos 5 campos já estão válidos: cada um acende uma estrela. */
function countValidFields(values: SignUpInput) {
  const passwordOk = shape.password.safeParse(values.password).success;
  return [
    shape.firstName.safeParse(values.firstName).success,
    shape.lastName.safeParse(values.lastName).success,
    shape.email.safeParse(values.email).success,
    passwordOk,
    passwordOk && values.confirmPassword === values.password,
  ].filter(Boolean).length;
}

/** "Maria S." a partir do que já foi digitado; "Você" enquanto não há nome. */
function formatSignature(firstName = "", lastName = "") {
  const first = firstName.trim().split(/\s+/)[0] ?? "";
  if (!first) return "Você";
  const initial = lastName.trim().charAt(0).toUpperCase();
  const name = first.charAt(0).toUpperCase() + first.slice(1);
  return initial ? `${name} ${initial}.` : name;
}

export function SignUpForm() {
  const router = useRouter();
  const trpc = useTRPC();

  const form = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues,
  });
  const {
    register,
    handleSubmit,
    setFocus,
    control,
    formState: { errors },
  } = form;

  const values = useWatch({ control }) as SignUpInput;
  const filled = countValidFields(values);
  const signature = formatSignature(values.firstName, values.lastName);
  const starsLabel = `${filled} de 5 campos preenchidos`;

  useEffect(() => {
    setFocus("firstName");
  }, [setFocus]);

  const signUp = useMutation(
    trpc.auth.signUp.mutationOptions({
      onSuccess: () => {
        form.reset(defaultValues);
        // Mantém o `?next=` até o login, para voltar à página de origem.
        const next = safeNextPath(
          new URLSearchParams(window.location.search).get("next"),
        );
        router.push(
          next === "/"
            ? "/auth/sign-up/success"
            : `/auth/sign-up/success?next=${encodeURIComponent(next)}`,
        );
      },
    }),
  );

  const onSubmit = handleSubmit((data) => {
    signUp.reset();
    signUp.mutate(data);
  });

  const isPending = signUp.isPending;

  let apiErrorMessage: string | null = null;
  if (signUp.isError) {
    const code = signUp.error.data?.code;
    if (!code) {
      apiErrorMessage =
        "Sem conexão com o servidor. Verifique sua internet e tente novamente.";
    } else if (code === "BAD_REQUEST") {
      apiErrorMessage =
        "Alguns dados não foram aceitos. Revise os campos e tente novamente.";
    } else {
      apiErrorMessage =
        "O servidor não conseguiu salvar sua conta agora. Tente novamente em alguns instantes.";
    }
  }

  return (
    <div className="grid w-full items-stretch gap-10 lg:grid-cols-12 lg:gap-16">
      <div className="flex flex-col justify-center gap-8 lg:col-span-5">
        <ReviewStrip
          filled={filled}
          starsLabel={starsLabel}
          signature={signature}
          className="lg:hidden"
        />

        <div className="flex flex-col gap-3">
          <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.02em] sm:text-[2.5rem]">
            Crie sua conta
          </h1>
          <p className="max-w-[44ch] text-base leading-relaxed text-muted-foreground">
            Leva menos de um minuto. Depois, é só contar o que você achou dos
            produtos que usa.
          </p>
        </div>

        <form onSubmit={onSubmit} noValidate>
          <FieldGroup className="gap-5">
            {apiErrorMessage && (
              <Alert
                variant="destructive"
                className="rounded-[10px] border-destructive/30 bg-destructive/5 px-3.5 py-3"
              >
                <CircleAlert />
                <AlertTitle>Sua conta não foi criada</AlertTitle>
                <AlertDescription>{apiErrorMessage}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <Field data-invalid={!!errors.firstName}>
                <FieldLabel htmlFor="firstName">Nome</FieldLabel>
                <Input
                  id="firstName"
                  autoComplete="given-name"
                  aria-invalid={!!errors.firstName}
                  disabled={isPending}
                  className={fieldClass}
                  {...register("firstName")}
                />
                <FieldError errors={[errors.firstName]} />
              </Field>

              <Field data-invalid={!!errors.lastName}>
                <FieldLabel htmlFor="lastName">Sobrenome</FieldLabel>
                <Input
                  id="lastName"
                  autoComplete="family-name"
                  aria-invalid={!!errors.lastName}
                  disabled={isPending}
                  className={fieldClass}
                  {...register("lastName")}
                />
                <FieldError errors={[errors.lastName]} />
              </Field>
            </div>

            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="voce@exemplo.com"
                aria-invalid={!!errors.email}
                disabled={isPending}
                className={fieldClass}
                {...register("email")}
              />
              <FieldError errors={[errors.email]} />
            </Field>

            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="password">Senha</FieldLabel>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                aria-describedby="password-hint"
                disabled={isPending}
                className={fieldClass}
                {...register("password")}
              />
              {errors.password ? (
                <FieldError errors={[errors.password]} />
              ) : (
                <FieldDescription id="password-hint">
                  Use pelo menos 8 caracteres.
                </FieldDescription>
              )}
            </Field>

            <Field data-invalid={!!errors.confirmPassword}>
              <FieldLabel htmlFor="confirmPassword">Confirmar senha</FieldLabel>
              <PasswordInput
                id="confirmPassword"
                autoComplete="new-password"
                aria-invalid={!!errors.confirmPassword}
                disabled={isPending}
                className={fieldClass}
                {...register("confirmPassword")}
              />
              <FieldError errors={[errors.confirmPassword]} />
            </Field>

            <Button
              type="submit"
              disabled={isPending}
              className="mt-2 h-11 w-full rounded-[10px] text-base font-semibold"
            >
              {isPending && <LoaderCircle className="animate-spin" />}
              {isPending ? "Criando conta..." : "Criar conta"}
            </Button>
          </FieldGroup>
        </form>

        <p className="text-sm text-muted-foreground">
          Já tem conta?{" "}
          <AuthSwitchLink href="/auth/sign-in" className={authSwitchLinkClass}>
            Entrar
          </AuthSwitchLink>
        </p>
      </div>

      <ReviewPanel
        filled={filled}
        starsLabel={starsLabel}
        caption="Assim suas avaliações vão aparecer para outras pessoas"
        quote="Sua opinião ajuda outra pessoa a escolher melhor."
        signature={signature}
        signatureNote="Membro da Avalia"
        className="hidden min-h-[34rem] lg:col-span-7 lg:flex"
      />
    </div>
  );
}
