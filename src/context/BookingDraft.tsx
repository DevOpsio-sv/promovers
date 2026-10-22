import type { ReactNode } from "react";
import { createContext, useContext, useMemo, useState } from "react";
import { defaultCalculatorInput } from "../lib/pricing/defaults.ts";
import type { CalculatorInput, ServiceType } from "../lib/pricing/types.ts";

interface BookingDraft {
  input: CalculatorInput | null;
  setService: (service: ServiceType) => void;
  update: (patch: Partial<CalculatorInput>) => void;
  reset: () => void;
}

const BookingDraftContext = createContext<BookingDraft | null>(null);

export function BookingDraftProvider({ children }: { children: ReactNode }) {
  const [input, setInput] = useState<CalculatorInput | null>(null);

  const value = useMemo<BookingDraft>(
    () => ({
      input,
      setService: (service) => setInput(defaultCalculatorInput(service)),
      update: (patch) =>
        setInput((current) => (current ? { ...current, ...patch, service: current.service } : current)),
      reset: () => setInput(null),
    }),
    [input],
  );

  return <BookingDraftContext.Provider value={value}>{children}</BookingDraftContext.Provider>;
}

export function useBookingDraft(): BookingDraft {
  const value = useContext(BookingDraftContext);
  if (!value) throw new Error("Booking draft is unavailable.");
  return value;
}
