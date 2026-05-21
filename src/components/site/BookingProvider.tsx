import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { BookingModal } from "./BookingModal";

export type BookingView = "calendar" | "form";

export type OpenBookingOpts = { view?: BookingView; intent?: string };

type BookingContextValue = {
  open: boolean;
  view: BookingView;
  intent?: string;
  openBooking: (opts?: OpenBookingOpts) => void;
  closeBooking: () => void;
};

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<BookingView>("calendar");
  const [intent, setIntent] = useState<string | undefined>(undefined);

  const openBooking = useCallback((opts?: OpenBookingOpts) => {
    setView(opts?.view ?? "calendar");
    setIntent(opts?.intent);
    setOpen(true);
  }, []);
  const closeBooking = useCallback(() => setOpen(false), []);

  return (
    <BookingContext.Provider value={{ open, view, intent, openBooking, closeBooking }}>
      {children}
      <BookingModal
        open={open}
        onOpenChange={setOpen}
        initialView={view}
        intent={intent}
      />
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used within <BookingProvider>");
  return ctx;
}
