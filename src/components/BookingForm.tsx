import { useEffect, useRef, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { useBookingDraft } from "../context/BookingDraft.tsx";
import { publicConfig } from "../lib/config/public.ts";
import { calculateEstimate } from "../lib/pricing/calculate.ts";
import { defaultCalculatorInput } from "../lib/pricing/defaults.ts";
import { SERVICES, TIME_WINDOW_LABELS, serviceTitle } from "../lib/pricing/labels.ts";
import type { TimeWindow } from "../lib/pricing/types.ts";
import { isTestTurnstileSiteKey } from "../lib/security/turnstile.ts";
import { estimatePrimaryText } from "../lib/formatting/currency.ts";
import {
  contactSchema,
  isServiceType,
  normalizedPhone,
  serviceRequestSchema,
  zodFieldErrors,
  zodFormResolver,
} from "../lib/validation/request.ts";
import type { Estimate } from "../lib/pricing/types.ts";
import { Section } from "./SiteChrome.tsx";
import { TurnstileWidget } from "./TurnstileWidget.tsx";

interface FormState {
  name: string;
  phone: string;
  email: string;
  service: string;
  address: string;
  addressSecondary: string;
  preferredDate: string;
  preferredTimeWindow: TimeWindow;
  notes: string;
  privacyAccepted: boolean;
  companyWebsite: string;
}

interface SuccessState {
  reference: string;
  estimate: Estimate;
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

export function BookingForm({ onComplete }: { onComplete: (done: boolean) => void }) {
  const { input, setService } = useBookingDraft();
  const [token, setToken] = useState("");
  const [minDate, setMinDate] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [turnstileBlocked, setTurnstileBlocked] = useState(false);
  const idempotencyKey = useRef<string | null>(null);
  const submittingRef = useRef(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormState>({
    defaultValues: EMPTY,
    resolver: zodFormResolver<FormState>(contactSchema),
  });

  const service = watch("service");

  useEffect(() => {
    setMinDate(
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Sofia",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date()),
    );
    setTurnstileBlocked(import.meta.env.PROD && isTestTurnstileSiteKey(publicConfig.turnstileSiteKey));
  }, []);

  useEffect(() => {
    if (!input) return;
    if (getValues("service") !== input.service) {
      setValue("service", input.service);
    }
  }, [getValues, input, setValue]);

  useEffect(() => {
    if (!isServiceType(service)) return;
    setService(service);
  }, [service, setService]);

  const estimate = input ? calculateEstimate(input) : null;
  const needsSecondAddress = input?.service === "van" || input?.service === "moving";

  async function onSubmit(values: FormState) {
    const calculator = isServiceType(values.service)
      ? input?.service === values.service
        ? input
        : defaultCalculatorInput(values.service)
      : null;
    if (submittingRef.current || !calculator) {
      if (!calculator) setFormError("Първо изберете услуга.");
      return;
    }
    if (turnstileBlocked) {
      setFormError("Формата временно не приема заявки, защото защитата не е конфигурирана.");
      return;
    }
    if (!token) {
      setFormError("Потвърдете проверката срещу злоупотреба и опитайте отново.");
      return;
    }
    if (!idempotencyKey.current) idempotencyKey.current = crypto.randomUUID();

    const payload = {
      ...values,
      phone: values.phone,
      privacyAccepted: true,
      calculator,
      idempotencyKey: idempotencyKey.current,
      turnstileToken: token,
    };
    const parsed = serviceRequestSchema.safeParse(payload);
    if (!parsed.success) {
      const fields = zodFieldErrors(parsed.error);
      setFormError(fields.form ?? Object.values(fields)[0] ?? "Проверете полетата.");
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
        | { ok: true; reference: string; estimate: Estimate }
        | { ok: false; error?: string; message?: string; fields?: Record<string, string> }
        | null;

      if (!response.ok || !body || body.ok !== true) {
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          idempotencyKey.current = null;
        }
        const fields = body && "fields" in body ? body.fields : undefined;
        setFormError(
          fields?.phone ??
            fields?.service ??
            (body && "message" in body ? body.message : undefined) ??
            "Заявката не беше записана. Опитайте отново.",
        );
        return;
      }

      setSuccess({ reference: body.reference, estimate: body.estimate });
      reset(EMPTY);
      onComplete(true);
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === "TimeoutError";
      setFormError(
        timedOut
          ? "Връзката се забави. Ако не видите номер, опитайте още веднъж."
          : "Няма връзка. Проверете интернет и опитайте отново.",
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <Section id="request" title="Получихме заявката ви!" intro="Ще се свържем с вас за потвърждение на детайлите и крайната цена.">
        <div className="max-w-xl rounded-2xl border border-line bg-white p-5" role="status">
          <p className="text-sm font-semibold text-muted">Номер на заявката</p>
          <p className="mt-1 text-3xl font-bold tracking-tight" data-testid="reference-number">
            {success.reference}
          </p>
          <p className="mt-3 text-muted">
            Ориентировъчна цена по нашата сметка: {estimatePrimaryText(success.estimate)}. Това не е потвърден час.
          </p>
          <button
            type="button"
            className="btn btn-secondary mt-5"
            onClick={() => {
              setSuccess(null);
              idempotencyKey.current = null;
              setToken("");
              onComplete(false);
            }}
          >
            Нова заявка
          </button>
        </div>
      </Section>
    );
  }

  return (
    <Section
      id="request"
      title="Заявка за цена и час"
      intro="Заявката е запитване, не потвърдена резервация. Полетата от калкулатора се пренасят тук."
    >
      <form className="max-w-3xl space-y-4" noValidate onSubmit={handleSubmit(onSubmit)}>
        {estimate ? (
          <p className="rounded-2xl bg-accent-soft px-4 py-3 font-semibold text-accent-dark">
            {serviceTitle(input?.service ?? "movers")}: {estimatePrimaryText(estimate)}
          </p>
        ) : (
          <p className="rounded-2xl bg-white px-4 py-3 text-muted">Първо изберете услуга в калкулатора.</p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Име" error={errors.name?.message}>
            <input className="field" autoComplete="name" aria-invalid={Boolean(errors.name)} {...register("name")} />
          </Field>
          <Field label="Телефон" error={errors.phone?.message}>
            <input
              className="field"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="0888 123 456"
              aria-invalid={Boolean(errors.phone)}
              {...register("phone")}
            />
          </Field>
        </div>

        <Field label="Имейл" hint="По избор" error={errors.email?.message}>
          <input className="field" type="email" inputMode="email" autoComplete="email" {...register("email")} />
        </Field>

        <Field label="Услуга" error={errors.service?.message}>
          <select className="field" aria-invalid={Boolean(errors.service)} {...register("service")}>
            <option value="">Изберете услуга</option>
            {SERVICES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Адрес / район в София" error={errors.address?.message}>
          <input className="field" autoComplete="street-address" aria-invalid={Boolean(errors.address)} {...register("address")} />
        </Field>
        {needsSecondAddress ? (
          <Field label="Втори адрес" hint="По избор" error={errors.addressSecondary?.message}>
            <input className="field" autoComplete="street-address" {...register("addressSecondary")} />
          </Field>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Предпочитана дата" error={errors.preferredDate?.message}>
            <input className="field" type="date" min={minDate || undefined} {...register("preferredDate")} />
          </Field>
          <Field label="Час" hint="По избор" error={errors.preferredTimeWindow?.message}>
            <select className="field" {...register("preferredTimeWindow")}>
              {(Object.keys(TIME_WINDOW_LABELS) as TimeWindow[]).map((key) => (
                <option key={key} value={key}>
                  {TIME_WINDOW_LABELS[key]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Допълнителна информация" hint="По избор" error={errors.notes?.message}>
          <textarea className="field" {...register("notes")} />
        </Field>

        <div className="absolute -left-[9999px]" aria-hidden="true">
          <label>
            Уебсайт
            <input tabIndex={-1} autoComplete="off" {...register("companyWebsite")} />
          </label>
        </div>

        <label className="flex items-start gap-3 text-sm">
          <input className="mt-1 h-5 w-5" type="checkbox" {...register("privacyAccepted")} />
          <span>
            Съгласен/на съм данните да се използват за обработка на тази заявка.{" "}
            <a className="font-semibold text-accent-dark" href="/privacy">
              Политика за поверителност
            </a>
            .
          </span>
        </label>
        {errors.privacyAccepted ? <p className="text-sm text-danger">{errors.privacyAccepted.message}</p> : null}

        {turnstileBlocked ? (
          <p className="text-sm text-danger">Формата временно не приема заявки, защото защитата не е конфигурирана.</p>
        ) : (
          <TurnstileWidget siteKey={publicConfig.turnstileSiteKey} onToken={setToken} />
        )}
        <p className="sr-only" data-testid="turnstile-status">
          {token ? "ready" : "pending"}
        </p>

        {formError ? (
          <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
            {formError}
          </p>
        ) : null}

        <button className="btn btn-primary" type="submit" disabled={submitting || turnstileBlocked}>
          {submitting ? "Изпращане..." : "Изпрати заявка"}
        </button>
        <p className="text-sm text-muted">Не пазим заявката, ако сървърът не я запише успешно.</p>
      </form>
    </Section>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-baseline justify-between gap-3 text-sm font-semibold">
        {label}
        {hint ? <span className="font-medium text-muted">{hint}</span> : null}
      </span>
      {children}
      {error ? <span className="mt-1 block text-sm text-danger">{error}</span> : null}
    </label>
  );
}
