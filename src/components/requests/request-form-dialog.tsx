"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { AlertCircle, FileText, Lightbulb, Wrench } from "lucide-react";
import { analysisHref } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EMPTY_CHANGE_DETAILS, EMPTY_NEW_WORK_DETAILS } from "@/lib/demo/reducer";
import { demoActions, useDemoState } from "@/lib/demo/store";
import {
  PRIORITIES,
  REQUEST_STATUSES,
  REQUEST_TYPE_LABELS,
  type RequestType,
  type WorkRequest,
} from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import {
  DESCRIPTION_MAX,
  TITLE_MAX,
  firstErrorField,
  validateRequestForm,
  type RequestFormErrors,
  type RequestFormField,
  type RequestFormValues,
} from "./request-form-validation";

/** Formdan oluşturulan taleplerde talep sahibi (kişi adı yerine sabit demo rolü). */
const DEMO_REQUESTER = "Demo Kullanıcı";

const selectClass =
  "h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30";

export type RequestFormResult = { mode: "create" | "edit"; id: string; code: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Verilirse düzenleme modu. */
  request?: WorkRequest | null;
  /** Oluşturma modunda önceden seçili proje. */
  defaultProjectId?: string;
  onSaved: (result: RequestFormResult) => void;
};

export function RequestFormDialog({ open, onOpenChange, request, defaultProjectId, onSaved }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
        {open && (
          <RequestForm
            // Her açılışta form durumunu sıfırlamak için anahtar.
            key={request?.id ?? "yeni"}
            request={request ?? null}
            defaultProjectId={defaultProjectId}
            onCancel={() => onOpenChange(false)}
            onSaved={onSaved}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function RequestForm({
  request,
  defaultProjectId,
  onCancel,
  onSaved,
}: {
  request: WorkRequest | null;
  defaultProjectId?: string;
  onCancel: () => void;
  onSaved: (result: RequestFormResult) => void;
}) {
  const state = useDemoState();
  const formId = useId();
  const isEdit = request !== null;

  const [values, setValues] = useState<RequestFormValues>(() =>
    request
      ? {
          title: request.title,
          description: request.description,
          projectId: request.projectId,
          type: request.type,
          priority: request.priority,
          status: request.status,
        }
      : {
          title: "",
          description: "",
          projectId: defaultProjectId ?? "",
          type: "",
          priority: "Orta",
          status: "Taslak",
        }
  );
  const [errors, setErrors] = useState<RequestFormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const projectIds = state.projects.map((p) => p.id);
  const fieldId = (field: RequestFormField) => `${formId}-${field}`;
  const errorId = (field: RequestFormField) => `${formId}-${field}-hata`;

  const update = <K extends RequestFormField>(field: K, value: RequestFormValues[K]) => {
    const next = { ...values, [field]: value };
    setValues(next);
    setSaveError(null);
    // İlk gönderimden sonra hatalar yazdıkça güncellenir.
    if (submitted) setErrors(validateRequestForm(next, projectIds));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    const nextErrors = validateRequestForm(values, projectIds);
    setErrors(nextErrors);
    const first = firstErrorField(nextErrors);
    if (first) {
      document.getElementById(fieldId(first))?.focus();
      return;
    }
    const type = values.type as RequestType;

    if (isEdit) {
      const ok = demoActions.updateRequest(request.id, {
        title: values.title,
        description: values.description,
        projectId: values.projectId,
        type,
        priority: values.priority,
        status: values.status,
      });
      if (!ok) {
        setSaveError("Talep güncellenemedi. Talep veya proje demo verisinde bulunamadı.");
        return;
      }
      onSaved({ mode: "edit", id: request.id, code: request.code });
      return;
    }

    const common = {
      projectId: values.projectId,
      title: values.title,
      description: values.description,
      requester: DEMO_REQUESTER,
      priority: values.priority,
      status: values.status,
    };
    const created = demoActions.createRequest(
      type === "new"
        ? { ...common, type: "new", details: { ...EMPTY_NEW_WORK_DETAILS } }
        : { ...common, type: "change", details: { ...EMPTY_CHANGE_DETAILS } }
    );
    if (!created) {
      setSaveError("Talep oluşturulamadı. Lütfen alanları kontrol edip tekrar deneyin.");
      return;
    }
    onSaved({ mode: "create", ...created });
  };

  const errorCount = Object.keys(errors).length;
  const typeChanged = isEdit && values.type !== "" && values.type !== request.type;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <DialogHeader>
        <DialogTitle>{isEdit ? `Talebi düzenle · ${request.code}` : "Yeni talep"}</DialogTitle>
        <DialogDescription>
          {isEdit
            ? "Talep bilgilerini güncelleyin. Değişiklikler yalnızca bu tarayıcıdaki demo verisine kaydedilir."
            : "Projeye bağlı yeni bir talep oluşturun. Yalnızca sentetik demo verisi girin."}
        </DialogDescription>
      </DialogHeader>

      {(saveError || (submitted && errorCount > 0)) && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{saveError ?? `Lütfen işaretli ${errorCount} alanı düzeltin.`}</span>
        </div>
      )}

      <Field id={fieldId("title")} errorId={errorId("title")} label="Başlık" error={errors.title}
        hint={`${values.title.trim().length}/${TITLE_MAX}`}>
        <Input
          id={fieldId("title")}
          value={values.title}
          maxLength={TITLE_MAX + 20}
          placeholder="Örn. Sipariş listesine tarih filtresi"
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? errorId("title") : undefined}
          onChange={(e) => update("title", e.target.value)}
        />
      </Field>

      <Field id={fieldId("description")} errorId={errorId("description")} label="Açıklama" error={errors.description}
        hint={`${values.description.trim().length}/${DESCRIPTION_MAX}`}>
        <Textarea
          id={fieldId("description")}
          value={values.description}
          rows={4}
          placeholder="Talebin amacını ve beklenen sonucu kısaca açıklayın."
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? errorId("description") : undefined}
          onChange={(e) => update("description", e.target.value)}
        />
      </Field>

      <Field id={fieldId("projectId")} errorId={errorId("projectId")} label="Proje" error={errors.projectId}>
        <select
          id={fieldId("projectId")}
          className={selectClass}
          value={values.projectId}
          aria-invalid={!!errors.projectId}
          aria-describedby={errors.projectId ? errorId("projectId") : undefined}
          onChange={(e) => update("projectId", e.target.value)}
        >
          <option value="">Proje seçin…</option>
          {state.projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} · {p.name}
            </option>
          ))}
        </select>
      </Field>

      <fieldset
        className="flex flex-col gap-2"
        aria-invalid={!!errors.type}
        aria-describedby={errors.type ? errorId("type") : undefined}
      >
        <legend className="mb-2 text-sm font-medium">Talep türü</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {(["new", "change"] as const).map((type, index) => {
            const Icon = type === "new" ? Lightbulb : Wrench;
            const checked = values.type === type;
            return (
              <label
                key={type}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                  checked ? "border-primary bg-primary/5" : "hover:bg-muted/60",
                  errors.type && "border-destructive"
                )}
              >
                <input
                  type="radio"
                  name={`${formId}-type`}
                  id={index === 0 ? fieldId("type") : undefined}
                  value={type}
                  checked={checked}
                  onChange={() => update("type", type)}
                  className="sr-only"
                />
                <Icon className={cn("mt-0.5 size-4 shrink-0", type === "new" ? "text-indigo-500" : "text-amber-600")} aria-hidden="true" />
                <span className="flex flex-col gap-0.5">
                  <span className="font-medium">{type === "new" ? "Yeni iş ihtiyacı" : REQUEST_TYPE_LABELS.change}</span>
                  <span className="text-xs text-muted-foreground">
                    {type === "new" ? "Henüz var olmayan bir yetenek veya süreç" : "Çalışan bir sistemde davranış değişikliği"}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        {errors.type && (
          <p id={errorId("type")} className="text-xs text-destructive">
            {errors.type}
          </p>
        )}
        {typeChanged && (
          <p className="text-xs text-muted-foreground">
            Tür değiştiğinde türe özel analiz ayrıntıları (iş hedefi, mevcut/istenen davranış vb.) sıfırlanır.
          </p>
        )}
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={fieldId("priority")} errorId={errorId("priority")} label="Öncelik" error={errors.priority}>
          <select
            id={fieldId("priority")}
            className={selectClass}
            value={values.priority}
            aria-invalid={!!errors.priority}
            onChange={(e) => update("priority", e.target.value as RequestFormValues["priority"])}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
        <Field id={fieldId("status")} errorId={errorId("status")} label="Durum" error={errors.status}>
          <select
            id={fieldId("status")}
            className={selectClass}
            value={values.status}
            aria-invalid={!!errors.status}
            onChange={(e) => update("status", e.target.value as RequestFormValues["status"])}
          >
            {REQUEST_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <DialogFooter>
        {isEdit && (
          <Button asChild variant="ghost" className="sm:mr-auto">
            <Link href={analysisHref(request.id)} onClick={onCancel}>
              <FileText data-icon="inline-start" aria-hidden="true" />
              Analizleri aç
            </Link>
          </Button>
        )}
        <Button type="button" variant="outline" onClick={onCancel}>
          Vazgeç
        </Button>
        <Button type="submit">{isEdit ? "Değişiklikleri kaydet" : "Talebi oluştur"}</Button>
      </DialogFooter>
    </form>
  );
}

function Field({
  id,
  errorId,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  errorId: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {hint && <span className="text-xs text-muted-foreground tabular-nums">{hint}</span>}
      </div>
      {children}
      {error && (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
