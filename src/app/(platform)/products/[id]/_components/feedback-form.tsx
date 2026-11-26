"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  COMMENT_MAX_LENGTH,
  type FeedbackFormInput,
  feedbackFormSchema,
} from "@/lib/validations/feedbacks";
import { useTRPC } from "@/trpc/client";
import { StarInput } from "./star-input";

const defaultValues: FeedbackFormInput = { score: 0, comment: "" };

const SUCCESS_VISIBLE_MS = 5000;

/** Erro sobre o painel Tinta: o vermelho claro do modo escuro mantém o contraste. */
const panelErrorClass = "text-[#f97066]";

export function FeedbackForm({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [published, setPublished] = useState(false);

  const form = useForm({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues,
  });
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = form;

  const comment = useWatch({ control, name: "comment" }) ?? "";

  useEffect(() => {
    if (!published) return;
    const timeout = setTimeout(() => setPublished(false), SUCCESS_VISIBLE_MS);
    return () => clearTimeout(timeout);
  }, [published]);

  const createFeedback = useMutation(
    trpc.feedbacks.create.mutationOptions({
      onSuccess: async () => {
        form.reset(defaultValues);
        setPublished(true);
        await queryClient.invalidateQueries({
          queryKey: trpc.feedbacks.listByProduct.queryKey({ productId }),
        });
      },
    }),
  );

  const onSubmit = handleSubmit((data) => {
    setPublished(false);
    createFeedback.reset();
    createFeedback.mutate({ ...data, productId });
  });

  const isPending = createFeedback.isPending;

  let apiErrorMessage: string | null = null;
  if (createFeedback.isError) {
    const code = createFeedback.error.data?.code;
    if (!code) {
      apiErrorMessage =
        "Sem conexão com o servidor. Verifique sua internet e tente novamente.";
    } else if (code === "UNAUTHORIZED") {
      apiErrorMessage =
        "Sua sessão expirou. Entre de novo para publicar a avaliação.";
    } else if (code === "NOT_FOUND") {
      apiErrorMessage = "Este produto não existe mais.";
    } else if (code === "BAD_REQUEST") {
      apiErrorMessage =
        "Alguns dados não foram aceitos. Revise a nota e o comentário.";
    } else {
      apiErrorMessage =
        "O servidor não conseguiu salvar sua avaliação agora. Tente novamente em alguns instantes.";
    }
  }

  const remaining = COMMENT_MAX_LENGTH - comment.length;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl font-semibold tracking-[-0.01em]">
          Sua avaliação
        </h2>
        <p className="text-sm leading-relaxed text-panel-muted">
          Conte o que achou de {productName}. Ela aparece com seu nome e a
          inicial do sobrenome.
        </p>
      </div>

      {apiErrorMessage && (
        <Alert
          variant="destructive"
          className={cn(
            "rounded-[10px] border-[#f97066]/40 bg-[#f97066]/10 px-3.5 py-3 *:data-[slot=alert-description]:text-panel-foreground/85",
            panelErrorClass,
          )}
        >
          <CircleAlert />
          <AlertTitle>Sua avaliação não foi publicada</AlertTitle>
          <AlertDescription>{apiErrorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-2">
        <Controller
          control={control}
          name="score"
          render={({ field, fieldState }) => (
            <StarInput
              name={field.name}
              value={field.value ?? 0}
              onChange={field.onChange}
              onBlur={field.onBlur}
              disabled={isPending}
              invalid={fieldState.invalid}
              describedBy={fieldState.error ? "score-error" : undefined}
            />
          )}
        />
        {errors.score && (
          <p id="score-error" className={cn("text-sm", panelErrorClass)}>
            {errors.score.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="comment" className="text-sm font-medium">
          Comentário
        </label>
        <textarea
          id="comment"
          rows={5}
          maxLength={COMMENT_MAX_LENGTH}
          placeholder="O que mais pesou na sua nota?"
          aria-invalid={!!errors.comment}
          aria-describedby="comment-hint"
          disabled={isPending}
          className={cn(
            "min-h-32 w-full resize-y rounded-[10px] border border-panel-foreground/20 bg-panel-foreground/[0.06] px-3.5 py-3 font-serif text-lg leading-relaxed text-panel-foreground outline-none transition-colors placeholder:font-sans placeholder:text-base placeholder:text-panel-muted focus-visible:border-panel-foreground/60 focus-visible:ring-3 focus-visible:ring-panel-foreground/25 disabled:opacity-60",
            errors.comment && "border-[#f97066]/70",
          )}
          {...register("comment")}
        />
        <div
          id="comment-hint"
          className="flex items-start justify-between gap-4 text-sm"
        >
          <span className={panelErrorClass}>{errors.comment?.message}</span>
          <span
            className={cn(
              "shrink-0 tabular-nums",
              remaining < 50 ? "text-panel-foreground" : "text-panel-muted",
            )}
          >
            {comment.length}/{COMMENT_MAX_LENGTH}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          type="submit"
          disabled={isPending}
          className="h-11 w-full rounded-[10px] bg-panel-foreground text-base font-semibold text-panel hover:bg-panel-foreground/90 focus-visible:ring-panel-foreground/50"
        >
          {isPending && <LoaderCircle className="animate-spin" />}
          {isPending ? "Publicando..." : "Publicar avaliação"}
        </Button>
        <output
          aria-live="polite"
          className="flex min-h-5 items-center gap-2 text-sm text-panel-foreground"
        >
          {published && (
            <>
              <CircleCheck aria-hidden className="size-4" />
              Avaliação publicada. Obrigado por contar o que achou.
            </>
          )}
        </output>
      </div>
    </form>
  );
}
