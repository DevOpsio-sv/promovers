import type { FieldErrors, FieldValues, Resolver } from "react-hook-form";
import { z } from "zod";
import { SERVICE_TYPES, type ServiceType } from "../pricing/types.ts";
import { calculatorInputSchema } from "../pricing/schema.ts";
import { isPreferredDateInRange } from "./dates.ts";
import { isBulgarianPhone, normalizeBulgarianPhone } from "./phone.ts";

const serviceSet = new Set<string>(SERVICE_TYPES);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const personName = /^[\p{L}][\p{L}\s'.-]{1,79}$/u;

export const bookingFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Въведете име.")
    .max(80, "Името е твърде дълго.")
    .regex(personName, "Въведете име с букви."),
  phone: z.string().trim().min(1, "Въведете телефон."),
  email: z.string().trim().max(120, "Имейлът е твърде дълъг."),
  service: z.string().min(1, "Изберете услуга."),
  address: z
    .string()
    .trim()
    .min(3, "Въведете адрес или район в София.")
    .max(200, "Адресът е твърде дълъг."),
  addressSecondary: z.string().trim().max(200, "Вторият адрес е твърде дълъг."),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Изберете дата."),
  preferredTimeWindow: z.enum(["morning", "afternoon", "evening", "flexible"]),
  notes: z.string().trim().max(2000, "Бележката е твърде дълга."),
  privacyAccepted: z.literal(true, "Нужно е съгласие за обработка на заявката."),
  companyWebsite: z.string().max(200).optional(),
});

export const serviceRequestSchema = bookingFormSchema
  .extend({
    calculator: calculatorInputSchema,
    idempotencyKey: z.uuid("Невалидна заявка. Опреснете страницата."),
    turnstileToken: z
      .string()
      .trim()
      .min(1, "Потвърдете, че не сте робот.")
      .max(2048, "Проверката е невалидна."),
  })
  .superRefine((value, ctx) => {
    refineContact(value, ctx);
    if (!serviceSet.has(value.calculator.service)) {
      ctx.addIssue({
        code: "custom",
        path: ["calculator"],
        message: "Изберете услуга.",
      });
    }
    if (value.service !== value.calculator.service) {
      ctx.addIssue({
        code: "custom",
        path: ["service"],
        message: "Услугата трябва да съвпада с калкулатора.",
      });
    }
    if (value.companyWebsite && value.companyWebsite.trim() !== "") {
      ctx.addIssue({
        code: "custom",
        path: ["companyWebsite"],
        message: "Заявката е отхвърлена.",
      });
    }
  });

export const contactSchema = bookingFormSchema.superRefine(refineContact);

function refineContact(
  value: {
    phone: string;
    email: string;
    service: string;
    preferredDate: string;
  },
  ctx: z.core.$RefinementCtx,
) {
  if (!isBulgarianPhone(value.phone)) {
    ctx.addIssue({
      code: "custom",
      path: ["phone"],
      message: "Въведете валиден български телефон.",
    });
  }
  if (value.email !== "" && !emailPattern.test(value.email)) {
    ctx.addIssue({
      code: "custom",
      path: ["email"],
      message: "Въведете валиден имейл или оставете полето празно.",
    });
  }
  if (!serviceSet.has(value.service)) {
    ctx.addIssue({
      code: "custom",
      path: ["service"],
      message: "Изберете услуга.",
    });
  }
  if (!isPreferredDateInRange(value.preferredDate)) {
    ctx.addIssue({
      code: "custom",
      path: ["preferredDate"],
      message: "Изберете дата от днес до 6 месеца напред.",
    });
  }
}

export type BookingFormValues = z.input<typeof bookingFormSchema>;
export type ServiceRequestPayload = z.infer<typeof serviceRequestSchema>;

export function isServiceType(value: string): value is ServiceType {
  return serviceSet.has(value);
}

export function normalizedPhone(value: string): string {
  return normalizeBulgarianPhone(value) ?? value.trim();
}

export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}

export function zodFormResolver<T extends FieldValues>(schema: z.ZodType): Resolver<T> {
  return async (values) => {
    const result = await schema.safeParseAsync(values);
    if (result.success) {
      return { values: result.data as T, errors: {} };
    }
    const errors: FieldErrors<T> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (typeof key !== "string") continue;
      if (key in errors) continue;
      (errors as Record<string, { type: string; message: string }>)[key] = {
        type: issue.code,
        message: issue.message,
      };
    }
    return { values: {}, errors };
  };
}
