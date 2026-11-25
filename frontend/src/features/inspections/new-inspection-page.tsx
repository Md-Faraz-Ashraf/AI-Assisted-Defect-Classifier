import { useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Check,
  ImagePlus,
  RotateCcw,
  Sparkles,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useDemoUser } from "@/app/demo-user-context";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBatches } from "@/services/queries";
import { api, ApiError } from "@/services/api";
import { queryKeys } from "@/services/query-keys";
import { DEFECT_TYPES, type AIAnalysis, type DefectType } from "@/types/api";
import { useObjectUrl } from "@/hooks/use-object-url";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const analysisSchema = z
  .object({
    batch_id: z.string().min(1, "Select a manufacturing batch."),
    image: z
      .file()
      .max(MAX_IMAGE_SIZE, "Choose an image smaller than 5 MiB.")
      .mime([...IMAGE_MIME_TYPES], "Choose a JPEG, PNG, or WebP image.")
      .optional(),
  })
  .superRefine((values, context) => {
    if (!values.image) {
      context.addIssue({
        code: "custom",
        path: ["image"],
        message: "Choose a product image.",
      });
    }
  });

const decisionSchema = z
  .object({
    final_defect_type: z.enum(DEFECT_TYPES).optional(),
    comments: z
      .string()
      .max(2000, "Comments must be 2,000 characters or fewer."),
  })
  .superRefine((values, context) => {
    if (!values.final_defect_type) {
      context.addIssue({
        code: "custom",
        path: ["final_defect_type"],
        message:
          "Accept the AI suggestion or select the final defect category.",
      });
    }
  });

type AnalysisValues = z.infer<typeof analysisSchema>;
type DecisionValues = z.infer<typeof decisionSchema>;

export function NewInspectionPage() {
  const { demoUserId } = useDemoUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const batchesQuery = useBatches(demoUserId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [formError, setFormError] = useState<string>();
  const analysisForm = useForm<AnalysisValues>({
    resolver: zodResolver(analysisSchema),
    defaultValues: { batch_id: "", image: undefined },
  });
  const decisionForm = useForm<DecisionValues>({
    resolver: zodResolver(decisionSchema),
    defaultValues: { final_defect_type: undefined, comments: "" },
  });
  const selectedBatchId = useWatch({
    control: analysisForm.control,
    name: "batch_id",
  });
  const selectedImage = useWatch({
    control: analysisForm.control,
    name: "image",
  });
  const finalDefectType = useWatch({
    control: decisionForm.control,
    name: "final_defect_type",
  });
  const commentLength =
    useWatch({ control: decisionForm.control, name: "comments" })?.length ?? 0;
  const previewUrl = useObjectUrl(selectedImage);

  const analyzeMutation = useMutation({
    mutationFn: ({ batchId, image }: { batchId: string; image: File }) =>
      api.predict(demoUserId, batchId, image),
    onSuccess: (prediction) => {
      setAnalysis(prediction);
      setFormError(undefined);
      decisionForm.reset({ final_defect_type: undefined, comments: "" });
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "The image could not be analyzed. Try again.";
      setFormError(message);
      toast.error("AI analysis failed", { description: message });
    },
  });

  const submitMutation = useMutation({
    mutationFn: (values: DecisionValues) => {
      if (!analysis || !values.final_defect_type) {
        throw new Error("Choose a final defect category before submitting.");
      }
      return api.submitInspection(demoUserId, {
        analysis_id: analysis.analysis_id,
        final_defect_type: values.final_defect_type,
        ...(values.comments.trim() ? { comments: values.comments.trim() } : {}),
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboard(demoUserId),
        }),
        queryClient.invalidateQueries({
          queryKey: ["inspections", demoUserId],
        }),
      ]);
      toast.success("Inspection submitted", {
        description:
          "The human-confirmed decision is now in inspection history.",
      });
      navigate("/inspections");
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "The inspection could not be submitted. Please retry.";
      setFormError(message);
      toast.error("Submission failed", { description: message });
    },
  });

  const onAnalyze = async () => {
    setFormError(undefined);
    const valid = await analysisForm.trigger();
    if (!valid) return;
    const values = analysisForm.getValues();
    if (!values.image) return;
    setAnalysis(null);
    analyzeMutation.mutate({ batchId: values.batch_id, image: values.image });
  };

  const setFinalType = (value: DefectType, intent: "accept" | "override") => {
    decisionForm.setValue("final_defect_type", value, {
      shouldDirty: true,
      shouldValidate: true,
    });
    if (intent === "accept") {
      toast.success("AI suggestion accepted", {
        description: `Final classification: ${value}.`,
      });
    }
  };

  const resetAnalysis = () => {
    setAnalysis(null);
    setFormError(undefined);
    analyzeMutation.reset();
    submitMutation.reset();
    decisionForm.reset({ final_defect_type: undefined, comments: "" });
  };

  const selectedBatch = batchesQuery.data?.find(
    (batch) => batch.batch_id === selectedBatchId,
  );
  const isBusy = analyzeMutation.isPending || submitMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Quality Engineer workflow"
        title="New inspection"
        description="Analyze a product image, review the suggestion, and record your final decision."
        action={
          <Badge variant="outline" className="gap-1.5">
            <Sparkles className="size-3.5" aria-hidden="true" />
            AI recommends · you decide
          </Badge>
        }
      />

      {formError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"
        >
          <AlertCircle
            className="mt-0.5 size-4 shrink-0 text-destructive"
            aria-hidden="true"
          />
          <span>{formError}</span>
        </div>
      )}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.85fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                1
              </span>
              Product and image
            </CardTitle>
            <CardDescription>
              Choose the production batch and upload a clear product image.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {batchesQuery.isError ? (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 p-4 text-sm text-destructive"
              >
                Could not load batches: {batchesQuery.error.message}
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="batch-select">Manufacturing batch</Label>
                  <Controller
                    control={analysisForm.control}
                    name="batch_id"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          resetAnalysis();
                        }}
                        disabled={
                          batchesQuery.isPending || Boolean(analysis) || isBusy
                        }
                      >
                        <SelectTrigger
                          id="batch-select"
                          aria-label="Manufacturing batch"
                        >
                          <SelectValue placeholder="Select a batch" />
                        </SelectTrigger>
                        <SelectContent>
                          {batchesQuery.data?.map((batch) => (
                            <SelectItem
                              key={batch.batch_id}
                              value={batch.batch_id}
                            >
                              {batch.batch_number} · {batch.product_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {analysisForm.formState.errors.batch_id?.message && (
                    <p className="text-xs text-destructive" role="alert">
                      {analysisForm.formState.errors.batch_id.message}
                    </p>
                  )}
                </div>

                {selectedBatch && (
                  <div className="grid gap-3 rounded-lg bg-muted/60 p-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Product</p>
                      <p className="mt-1 text-sm font-medium">
                        {selectedBatch.product_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Production line
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {selectedBatch.production_line}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="product-image">Product image</Label>
                  <div className="rounded-xl border border-dashed bg-background p-4 sm:p-5">
                    <Input
                      ref={fileInputRef}
                      id="product-image"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={Boolean(analysis) || isBusy}
                      aria-describedby="image-help"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        analysisForm.setValue("image", file, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                        resetAnalysis();
                      }}
                      className="cursor-pointer file:mr-4 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-medium"
                    />
                    <p
                      id="image-help"
                      className="mt-2 text-xs text-muted-foreground"
                    >
                      JPEG, PNG, or WebP · up to 5 MiB. The filename is not sent
                      as an image reference.
                    </p>
                    {analysisForm.formState.errors.image?.message && (
                      <p className="mt-2 text-xs text-destructive" role="alert">
                        {analysisForm.formState.errors.image.message}
                      </p>
                    )}
                    {selectedImage && previewUrl && (
                      <div className="mt-4 flex items-center gap-4 rounded-lg border bg-card p-3">
                        <img
                          src={previewUrl}
                          alt="Selected product preview"
                          className="h-20 w-28 rounded-md object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {selectedImage.name}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {(selectedImage.size / (1024 * 1024)).toFixed(2)}{" "}
                            MiB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {!analysis ? (
                  <Button
                    onClick={() => void onAnalyze()}
                    disabled={analyzeMutation.isPending}
                  >
                    {analyzeMutation.isPending ? (
                      <>
                        <span
                          className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
                          aria-hidden="true"
                        />
                        Analyzing image…
                      </>
                    ) : (
                      <>
                        <Sparkles aria-hidden="true" /> Analyze image
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={resetAnalysis}
                    disabled={isBusy}
                  >
                    <RotateCcw aria-hidden="true" /> Analyze another image
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card aria-live="polite">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  2
                </span>
                AI suggestion
              </CardTitle>
              <CardDescription>
                The prediction appears before an inspection can be submitted.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyzeMutation.isPending ? (
                <div
                  role="status"
                  className="flex min-h-36 flex-col items-center justify-center gap-3 rounded-xl bg-muted/50 text-center"
                >
                  <span
                    className="size-8 animate-spin rounded-full border-2 border-primary border-r-transparent"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-medium">
                    Reviewing image and batch context…
                  </p>
                </div>
              ) : analysis ? (
                <div className="space-y-4">
                  <div className="rounded-xl border bg-card p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Suggested category
                        </p>
                        <p className="mt-2 text-2xl font-semibold">
                          {analysis.prediction.defect_type}
                        </p>
                      </div>
                      <Badge variant="secondary">AI suggestion</Badge>
                    </div>
                    <div className="mt-5 border-t pt-4">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium">Model confidence</span>
                        <span className="font-semibold tabular-nums">
                          {Math.round(analysis.prediction.confidence * 100)}%
                        </span>
                      </div>
                      <div
                        className="mt-2 h-2 rounded-full bg-muted"
                        aria-hidden="true"
                      >
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${analysis.prediction.confidence * 100}%`,
                          }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Indicative model score; it is not a calibrated
                        probability of accuracy.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
                    <ImagePlus
                      className="mt-0.5 size-4 shrink-0"
                      aria-hidden="true"
                    />
                    Original suggestion and your final decision will be saved
                    separately.
                  </div>
                </div>
              ) : (
                <div className="flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed px-5 text-center">
                  <Upload
                    className="size-7 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <p className="mt-3 text-sm font-medium">
                    Awaiting product image
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Choose a batch and image to request a suggestion.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  3
                </span>
                Your final decision
              </CardTitle>
              <CardDescription>
                Confirm the suggestion or choose the category you observed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!analysis ? (
                <p className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                  Run an image analysis before choosing and submitting the final
                  classification.
                </p>
              ) : (
                <form
                  className="space-y-4"
                  onSubmit={decisionForm.handleSubmit((values) =>
                    submitMutation.mutate(values),
                  )}
                >
                  <Button
                    type="button"
                    variant={
                      finalDefectType === analysis.prediction.defect_type
                        ? "default"
                        : "outline"
                    }
                    className="w-full justify-start"
                    onClick={() =>
                      setFinalType(analysis.prediction.defect_type, "accept")
                    }
                  >
                    <Check aria-hidden="true" /> Accept suggestion:{" "}
                    {analysis.prediction.defect_type}
                  </Button>
                  <div className="space-y-2">
                    <Label htmlFor="final-defect">
                      Override with another category
                    </Label>
                    <Controller
                      control={decisionForm.control}
                      name="final_defect_type"
                      render={({ field }) => (
                        <Select
                          value={field.value ?? ""}
                          onValueChange={(value) =>
                            setFinalType(value as DefectType, "override")
                          }
                        >
                          <SelectTrigger
                            id="final-defect"
                            aria-label="Final defect category"
                          >
                            <SelectValue placeholder="Choose final category" />
                          </SelectTrigger>
                          <SelectContent>
                            {DEFECT_TYPES.map((defect) => (
                              <SelectItem key={defect} value={defect}>
                                {defect}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {decisionForm.formState.errors.final_defect_type
                      ?.message && (
                      <p className="text-xs text-destructive" role="alert">
                        {
                          decisionForm.formState.errors.final_defect_type
                            .message
                        }
                      </p>
                    )}
                  </div>

                  {finalDefectType && (
                    <div
                      className="rounded-lg border p-3 text-sm"
                      aria-live="polite"
                    >
                      {finalDefectType === analysis.prediction.defect_type ? (
                        <p>
                          <Badge variant="secondary" className="mr-2">
                            AI accepted
                          </Badge>
                          Final decision: {finalDefectType}
                        </p>
                      ) : (
                        <p>
                          <Badge
                            variant="outline"
                            className="mr-2 border-amber-300 text-amber-800"
                          >
                            Overridden
                          </Badge>
                          AI: {analysis.prediction.defect_type}{" "}
                          <span aria-hidden="true">→</span> Final:{" "}
                          {finalDefectType}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="inspection-comments">
                      Comments{" "}
                      <span className="font-normal text-muted-foreground">
                        (optional)
                      </span>
                    </Label>
                    <textarea
                      id="inspection-comments"
                      maxLength={2000}
                      rows={3}
                      placeholder="Add a note about your inspection…"
                      {...decisionForm.register("comments")}
                      className="flex w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <p className="text-right text-xs text-muted-foreground">
                      {commentLength}/2000
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!finalDefectType || isBusy}
                  >
                    {submitMutation.isPending
                      ? "Submitting inspection…"
                      : "Submit inspection"}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Submission records the final classification and preserves
                    the AI suggestion.
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
