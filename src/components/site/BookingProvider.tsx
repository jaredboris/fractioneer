import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { BookingModal } from "./BookingModal";

type BookingContextValue = {
  open: boolean;
  openBooking: () => void;
  openLeadForm: () => void;
  closeBooking: () => void;
};

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [initialShowForm, setInitialShowForm] = useState(false);
  const openBooking = useCallback(() => {
    setInitialShowForm(false);
    setOpen(true);
  }, []);
  const openLeadForm = useCallback(() => {
    setInitialShowForm(true);
    setOpen(true);
  }, []);
  const closeBooking = useCallback(() => setOpen(false), []);

  return (
    <BookingContext.Provider value={{ open, openBooking, openLeadForm, closeBooking }}>
      {children}
      <BookingModal open={open} onOpenChange={setOpen} initialShowForm={initialShowForm} />
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used within <BookingProvider>");
  return ctx;
}
