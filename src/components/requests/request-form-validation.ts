import {
  PRIORITIES,
  REQUEST_STATUSES,
  REQUEST_TYPES,
  type Priority,
  type RequestStatus,
  type RequestType,
} from "@/lib/domain/types";

export type RequestFormValues = {
  title: string;
  description: string;
  projectId: string;
  type: RequestType | "";
  priority: Priority;
  status: RequestStatus;
};

export type RequestFormField = keyof RequestFormValues;
export type RequestFormErrors = Partial<Record<RequestFormField, string>>;

export const TITLE_MIN = 5;
export const TITLE_MAX = 120;
export const DESCRIPTION_MIN = 10;
export const DESCRIPTION_MAX = 2000;

/** Hata mesajlarının ekranda/odakta sırası. */
export const FIELD_ORDER: RequestFormField[] = ["title", "description", "projectId", "type", "priority", "status"];

export function validateRequestForm(values: RequestFormValues, projectIds: string[]): RequestFormErrors {
  const errors: RequestFormErrors = {};
  const title = values.title.trim();
  const description = values.description.trim();

  if (!title) errors.title = "Başlık zorunludur.";
  else if (title.length < TITLE_MIN) errors.title = `Başlık en az ${TITLE_MIN} karakter olmalıdır.`;
  else if (title.length > TITLE_MAX) errors.title = `Başlık en fazla ${TITLE_MAX} karakter olabilir.`;

  if (!description) errors.description = "Açıklama zorunludur.";
  else if (description.length < DESCRIPTION_MIN)
    errors.description = `Açıklama en az ${DESCRIPTION_MIN} karakter olmalıdır.`;
  else if (description.length > DESCRIPTION_MAX)
    errors.description = `Açıklama en fazla ${DESCRIPTION_MAX} karakter olabilir.`;

  if (!values.projectId) errors.projectId = "Bir proje seçin.";
  else if (!projectIds.includes(values.projectId)) errors.projectId = "Seçilen proje bulunamadı.";

  if (!values.type) errors.type = "Talep türünü seçin.";
  else if (!REQUEST_TYPES.includes(values.type)) errors.type = "Geçersiz talep türü.";

  if (!PRIORITIES.includes(values.priority)) errors.priority = "Geçersiz öncelik.";
  if (!REQUEST_STATUSES.includes(values.status)) errors.status = "Geçersiz durum.";

  return errors;
}

export function firstErrorField(errors: RequestFormErrors): RequestFormField | undefined {
  return FIELD_ORDER.find((field) => errors[field]);
}
