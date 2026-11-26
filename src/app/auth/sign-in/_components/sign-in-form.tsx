"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  type SignInInput,
  safeNextPath,
  signInSchema,
} from "@/lib/validations/sign-in";
import { useTRPC } from "@/trpc/client";
import {
  AuthSwitchLink,
  authSwitchLinkClass,
} from "../../_components/auth-switch-link";
import { PasswordInput } from "../../_components/password-input";
import { ReviewPanel, ReviewStrip } from "../../_components/review-panel";

const defaultValues: SignInInput = { email: "", password: "" };

const fieldClass =
  "h-11 rounded-[10px] bg-field px-3.5 text-base md:text-base dark:bg-field";

const { shape } = signInSchema;

/**
 * Cada campo válido acende duas estrelas; a quinta só acende quando a pessoa entra.
 * Mesma metáfora do cadastro: a avaliação "se completa" conforme o formulário.
 */
function countStars(values: SignInInput, signedIn: boolean) {
  if (signedIn) return 5;
  const emailOk = shape.email.safeParse(values.email).success;
  const passwordOk = shape.password.safeParse(values.password).success;
  return (emailOk ? 2 : 0) + (passwordOk ? 2 : 0);
}

export function SignInForm() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues,
  });
  const {
    register,
    handleSubmit,
    setFocus,
    resetField,
    control,
    formState: { errors },
  } = form;

  useEffect(() => {
    setFocus("email");
  }, [setFocus]);

  const signIn = useMutation(
    trpc.auth.signIn.mutationOptions({
      onSuccess: async () => {
        // Dados em cache podiam ser da visão "deslogada".
        await queryClient.invalidateQueries();
        const next = new URLSearchParams(window.location.search).get("next");
        router.push(safeNextPath(next));
        router.refresh();
      },
      onError: (error) => {
        if (error.data?.code === "UNAUTHORIZED") {
          resetField("password");
          setFocus("password");
        }
      },
    }),
  );

  const values = useWatch({ control }) as SignInInput;
  const filled = countStars(values, signIn.isSuccess);
  const starsLabel = signIn.isSuccess
    ? "Login concluído"
    : `${filled} de 5 estrelas: preencha email e senha`;

  const onSubmit = handleSubmit((data) => {
    signIn.reset();
    signIn.mutate(data);
  });

  // Depois do sucesso o form continua travado até a navegação terminar.
  const isPending = signIn.isPending || signIn.isSuccess;

  let apiErrorMessage: string | null = null;
  if (signIn.isError) {
    const code = signIn.error.data?.code;
    if (!code) {
      apiErrorMessage =
        "Sem conexão com o servidor. Verifique sua internet e tente novamente.";
    } else if (code === "UNAUTHORIZED") {
      apiErrorMessage = "Email ou senha inválidos.";
    } else if (code === "BAD_REQUEST") {
      apiErrorMessage =
        "Alguns dados não foram aceitos. Revise os campos e tente novamente.";
    } else {
      apiErrorMessage =
        "O servidor não conseguiu concluir o login agora. Tente novamente em alguns instantes.";
    }
  }

  return (
    <div className="grid w-full items-stretch gap-10 lg:grid-cols-12 lg:gap-16">
      <div className="flex flex-col justify-center gap-8 lg:col-span-5">
        <ReviewStrip
          filled={filled}
          starsLabel={starsLabel}
          signature="Você"
          className="lg:hidden"
        />

        <div className="flex flex-col gap-3">
          <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.02em] sm:text-[2.5rem]">
            Entre na sua conta
          </h1>
          <p className="max-w-[44ch] text-base leading-relaxed text-muted-foreground">
            Use o email e a senha do seu cadastro para continuar avaliando.
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
                <AlertTitle>Não foi possível entrar</AlertTitle>
                <AlertDescription>{apiErrorMessage}</AlertDescription>
              </Alert>
            )}

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
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                disabled={isPending}
                className={fieldClass}
                {...register("password")}
              />
              <FieldError errors={[errors.password]} />
            </Field>

            <Button
              type="submit"
              disabled={isPending}
              className="mt-2 h-11 w-full rounded-[10px] text-base font-semibold"
            >
              {isPending && <LoaderCircle className="animate-spin" />}
              {isPending ? "Entrando..." : "Entrar"}
            </Button>
          </FieldGroup>
        </form>

        <p className="text-sm text-muted-foreground">
          Ainda não tem conta?{" "}
          <AuthSwitchLink href="/auth/sign-up" className={authSwitchLinkClass}>
            Criar conta
          </AuthSwitchLink>
        </p>
      </div>

      <ReviewPanel
        filled={filled}
        starsLabel={starsLabel}
        caption="A última estrela acende quando você entra"
        quote="Tem produto esperando a sua opinião."
        signature="Você"
        signatureNote="Membro da Avalia"
        className="hidden min-h-[34rem] lg:col-span-7 lg:flex"
      />
    </div>
  );
}
