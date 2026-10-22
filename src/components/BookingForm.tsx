import { useEffect, useRef, useState, type ReactNode } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { ArrowRight, Check, Lock } from "lucide-react";
import { useBookingDraft } from "../context/BookingDraft.tsx";
import { publicConfig } from "../lib/config/public.ts";
import { estimatePrimaryText } from "../lib/formatting/currency.ts";
import { calculateEstimate } from "../lib/pricing/calculate.ts";
import { defaultCalculatorInput } from "../lib/pricing/defaults.ts";
import { SERVICES } from "../lib/pricing/labels.ts";
import type { Estimate } from "../lib/pricing/types.ts";
import { isTestTurnstileSiteKey } from "../lib/security/turnstile.ts";
import { addIsoDays, sofiaToday } from "../lib/validation/dates.ts";
import {
  contactSchema,
  isServiceType,
  normalizedPhone,
  serviceRequestSchema,
  zodFieldErrors,
  zodFormResolver,
} from "../lib/validation/request.ts";
import { TurnstileWidget } from "./TurnstileWidget.tsx";

interface FormState {
  name: string;
  phone: string;
  email: string;
  service: string;
  address: string;
  addressSecondary: string;
  preferredDate: string;
  preferredTimeWindow: "morning" | "afternoon" | "evening" | "flexible";
  notes: string;
  privacyAccepted: boolean;
  companyWebsite: string;
}

const EMPTY: FormState = {
  name: "",
  phone: "",
  email: "",
  service: "",
  address: "",
  addressSecondary: "",
  preferredDate: "",
  preferredTimeWindow: "flexible",
  notes: "",
  privacyAccepted: false,
  companyWebsite: "",
};

const FIELD_ORDER = ["name", "phone", "service", "preferredDate", "address", "notes"] as const;
const RETRY_MESSAGE = "Не успяхме да изпратим заявката. Моля, опитайте отново.";
const resolveContact = zodFormResolver<FormState>(contactSchema);

function withContract(values: FormState): FormState {
  return {
    ...values,
    email: values.email ?? "",
    addressSecondary: values.addressSecondary ?? "",
    preferredTimeWindow: values.preferredTimeWindow || "flexible",
    privacyAccepted: true,
    companyWebsite: values.companyWebsite ?? "",
  };
}

export function BookingForm({ onComplete }: { onComplete: (done: boolean) => void }) {
  const { input, setService, reset: resetDraft } = useBookingDraft();
  const [token, setToken] = useState("");
  const [minDate, setMinDate] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ reference: string; estimate: Estimate } | null>(null);
  const [turnstileBlocked, setTurnstileBlocked] = useState(false);
  const idempotencyKey = useRef<string | null>(null);
  const submittingRef = useRef(false);
  const formErrorRef = useRef<HTMLParagraphElement>(null);
  const pendingErrorFocus = useRef(false);
  const focusName = useRef(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    setFocus,
    setError,
    watch,
    reset,
    formState: { errors, isSubmitted },
  } = useForm<FormState>({
    defaultValues: EMPTY,
    shouldFocusError: false,
    resolver: (values, context, options) => resolveContact(withContract(values), context, options),
  });

  const service = watch("service");
  const serviceField = register("service");
  const linked = input && isServiceType(service) && input.service === service ? input : null;
  const estimate = linked ? calculateEstimate(linked) : null;
  const maxDate = minDate ? addIsoDays(minDate, 180) : "";

  useEffect(() => {
    setMinDate(sofiaToday());
    setTurnstileBlocked(import.meta.env.PROD && isTestTurnstileSiteKey(publicConfig.turnstileSiteKey));
  }, []);

  useEffect(() => {
    const next = input?.service ?? "";
    if (getValues("service") !== next) {
      setValue("service", next, {
        shouldValidate: isSubmitted,
        shouldDirty: false,
        shouldTouch: false,
      });
    }
  }, [getValues, input, isSubmitted, setValue]);

  useEffect(() => {
    if (!formError || !pendingErrorFocus.current) return;
    pendingErrorFocus.current = false;
    formErrorRef.current?.focus();
  }, [formError]);

  useEffect(() => {
    if (success || !focusName.current) return;
    focusName.current = false;
    setFocus("name");
  }, [setFocus, success]);

  function showFormError(message: string) {
    pendingErrorFocus.current = true;
    setFormError(message);
  }

  function onInvalid(fieldErrors: FieldErrors<FormState>) {
    const first = FIELD_ORDER.find((key) => fieldErrors[key]);
    if (first) setFocus(first);
  }

  async function onSubmit(values: FormState) {
    const calculator = isServiceType(values.service)
      ? input?.service === values.service
        ? input
        : defaultCalculatorInput(values.service)
      : null;
    if (submittingRef.current || !calculator) {
      if (!calculator) showFormError("Първо изберете услуга.");
      return;
    }
    if (turnstileBlocked) {
      showFormError("Формата временно не приема заявки, защото защитата не е конфигурирана.");
      return;
    }
    if (!token) {
      showFormError("Потвърдете проверката срещу злоупотреба и опитайте отново.");
      return;
    }
    if (!idempotencyKey.current) idempotencyKey.current = crypto.randomUUID();

    const parsed = serviceRequestSchema.safeParse({
      ...withContract(values),
      calculator,
      idempotencyKey: idempotencyKey.current,
      turnstileToken: token,
    });
    if (!parsed.success) {
      const fields = zodFieldErrors(parsed.error);
      const first = FIELD_ORDER.find((key) => fields[key]);
      if (first) {
        setError(first, { message: fields[first] });
        setFocus(first);
      }
      showFormError(fields.form ?? (first ? "" : Object.values(fields)[0]) ?? "Проверете полетата.");
      if (first) setFormError("");
      idempotencyKey.current = null;
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setFormError("");
    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...parsed.data,
          phone: normalizedPhone(parsed.data.phone),
        }),
        signal: AbortSignal.timeout(20000),
      });
      const body = (await response.json().catch(() => null)) as
        | { ok: true; reference?: string; estimate: Estimate }
        | { ok: false; error?: string; message?: string; fields?: Record<string, string> }
        | null;

      if (!response.ok || !body || body.ok !== true) {
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          idempotencyKey.current = null;
        }
        const fields = body && "fields" in body ? body.fields : undefined;
        const first = fields ? FIELD_ORDER.find((key) => fields[key]) : undefined;
        if (fields && first) {
          for (const key of FIELD_ORDER) {
            if (fields[key]) setError(key, { message: fields[key] });
          }
          setFocus(first);
        }
        const serverMessage = body && "message" in body ? body.message : undefined;
        const retryable = !response.ok && (response.status >= 500 || response.status === 0);
        showFormError(
          first
            ? ""
            : retryable
              ? RETRY_MESSAGE
              : serverMessage || RETRY_MESSAGE,
        );
        if (first) setFormError("");
        return;
      }

      setToken("");
      setSuccess({
        reference: typeof body.reference === "string" ? body.reference : "",
        estimate: body.estimate,
      });
      onComplete(true);
    } catch {
      showFormError(RETRY_MESSAGE);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  function startNewRequest() {
    focusName.current = true;
    idempotencyKey.current = null;
    setToken("");
    setFormError("");
    reset({
      ...EMPTY,
      service: input?.service ?? "",
    });
    setSuccess(null);
    onComplete(false);
  }

  return (
    <section id="request" className="book-card" aria-labelledby="request-title" tabIndex={-1}>
      {success ? (
        <SuccessNotice reference={success.reference} onNew={startNewRequest} />
      ) : (
        <>
          <header className="book-intro">
            <h2 id="request-title">Заяви услуга</h2>
            <p>Изпратете заявка за няколко секунди. Ще се свържем с вас, за да уточним детайлите.</p>
          </header>
          {estimate ? (
            <p className="book-estimate" data-testid="booking-estimate">
              {estimate.status === "needs_review" ? (
                estimatePrimaryText(estimate)
              ) : (
                <>
                  Ориентировъчно <strong>{estimatePrimaryText(estimate)}</strong>
                </>
              )}
            </p>
          ) : null}
          <form className="book-form" noValidate aria-busy={submitting} onSubmit={handleSubmit(onSubmit, onInvalid)}>
            <p className="sr-only" aria-live="polite">
              {submitting ? "Изпращане..." : ""}
            </p>
            <div className="book-row">
              <Field id="request-name" label="Име" required error={errors.name?.message}>
                {(aria) => (
                  <input
                    className="book-input"
                    autoComplete="name"
                    {...register("name")}
                    {...aria}
                  />
                )}
              </Field>
              <Field id="request-phone" label="Телефон" required error={errors.phone?.message}>
                {(aria) => (
                  <input
                    className="book-input"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="0888 123 456"
                    {...register("phone")}
                    {...aria}
                  />
                )}
              </Field>
            </div>
            <div className="book-row">
              <Field id="request-service" label="Услуга" required error={errors.service?.message}>
                {(aria) => (
                  <select
                    className="book-input book-select"
                    {...serviceField}
                    {...aria}
                    onChange={(event) => {
                      void serviceField.onChange(event);
                      const value = event.target.value;
                      if (isServiceType(value)) setService(value);
                      else resetDraft();
                    }}
                  >
                    <option value="">Изберете услуга</option>
                    {SERVICES.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <Field id="request-date" label="Желана дата" required error={errors.preferredDate?.message}>
                {(aria) => (
                  <input
                    className="book-input"
                    type="date"
                    min={minDate || undefined}
                    max={maxDate || undefined}
                    {...register("preferredDate")}
                    {...aria}
                  />
                )}
              </Field>
            </div>
            <Field id="request-address" label="Адрес или район" required error={errors.address?.message}>
              {(aria) => (
                <input
                  className="book-input"
                  autoComplete="street-address"
                  {...register("address")}
                  {...aria}
                />
              )}
            </Field>
            <Field
              id="request-notes"
              label="Допълнителна информация"
              hint="Кратко уточнение, ако има нещо важно."
              error={errors.notes?.message}
            >
              {(aria) => (
                <textarea
                  className="book-input book-textarea"
                  rows={2}
                  maxLength={2000}
                  {...register("notes")}
                  {...aria}
                />
              )}
            </Field>

            <div className="book-honeypot" aria-hidden="true">
              <label>
                Уебсайт
                <input tabIndex={-1} autoComplete="off" {...register("companyWebsite")} />
              </label>
            </div>

            {turnstileBlocked ? (
              <p className="book-error">Формата временно не приема заявки, защото защитата не е конфигурирана.</p>
            ) : (
              <TurnstileWidget className="book-turnstile" siteKey={publicConfig.turnstileSiteKey} onToken={setToken} size="flexible" />
            )}
            <p className="sr-only" data-testid="turnstile-status">
              {token ? "ready" : "pending"}
            </p>

            {formError ? (
              <p ref={formErrorRef} className="book-alert" role="alert" tabIndex={-1}>
                {formError}
              </p>
            ) : null}

            <button className="book-submit" type="submit" disabled={submitting || turnstileBlocked}>
              {submitting ? "Изпращане..." : "Изпрати заявка"}
              {submitting ? null : <ArrowRight aria-hidden="true" size={16} strokeWidth={2} />}
            </button>
            <p className="book-privacy">
              <Lock aria-hidden="true" size={14} strokeWidth={1.75} />
              <span>
                Данните ви се използват само за обработка на заявката и връзка с вас.{" "}
                <a href="/privacy">Политика за поверителност</a>
              </span>
            </p>
          </form>
        </>
      )}
    </section>
  );
}

function SuccessNotice({ reference, onNew }: { reference: string; onNew: () => void }) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    titleRef.current?.focus();
  }, []);
  return (
    <div className="book-success" role="status">
      <span className="book-success-icon" aria-hidden="true">
        <Check size={22} strokeWidth={2.25} />
      </span>
      <h2 id="request-title" tabIndex={-1} ref={titleRef}>
        Получихме заявката ви
      </h2>
      <p className="sr-only">Заявката е изпратена</p>
      <p>Благодарим ви! Ще се свържем с вас, за да уточним подробностите.</p>
      {reference ? (
        <p className="book-reference">
          Номер на заявката <strong data-testid="reference-number">{reference}</strong>
        </p>
      ) : null}
      <button type="button" className="book-secondary" onClick={onNew}>
        Нова заявка
      </button>
    </div>
  );
}

function Field({
  id,
  label,
  required,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: (props: {
    id: string;
    required?: boolean;
    "aria-invalid"?: true;
    "aria-describedby"?: string;
  }) => ReactNode;
}) {
  const errorId = `${id}-error`;
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = [hintId, error ? errorId : undefined].filter(Boolean).join(" ") || undefined;
  return (
    <div className="book-field">
      <div className="book-label">
        <label htmlFor={id}>{label}</label>
        {required ? (
          <span className="book-req" aria-hidden="true">
            *
          </span>
        ) : null}
      </div>
      {hint ? (
        <p id={hintId} className="book-hint">
          {hint}
        </p>
      ) : null}
      {children({
        id,
        required,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
      })}
      {error ? (
        <p id={errorId} className="book-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
