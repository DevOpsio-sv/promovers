import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
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
  const setService = useCallback((service: ServiceType) => {
    setInput((current) => (current?.service === service ? current : defaultCalculatorInput(service)));
  }, []);
  const update = useCallback((patch: Partial<CalculatorInput>) => {
    setInput((current) => (current ? { ...current, ...patch, service: current.service } : current));
  }, []);
  const reset = useCallback(() => setInput(null), []);

  const value = useMemo<BookingDraft>(
    () => ({
      input,
      setService,
      update,
      reset,
    }),
    [input, reset, setService, update],
  );

  return <BookingDraftContext.Provider value={value}>{children}</BookingDraftContext.Provider>;
}

export function useBookingDraft(): BookingDraft {
  const value = useContext(BookingDraftContext);
  if (!value) throw new Error("Booking draft is unavailable.");
  return value;
}
