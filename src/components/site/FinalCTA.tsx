import { BookACallButton } from "./BookACallButton";
import { useBooking } from "./BookingProvider";

export function FinalCTA() {
  const { openBooking } = useBooking();
  return (
    <section id="contact" className="w-full py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div
          className="relative overflow-hidden rounded-2xl px-8 py-16 md:px-16 md:py-20 text-center"
          style={{ background: "var(--gradient-navy-blue)" }}
        >
          <div
            aria-hidden
            className="absolute -top-32 left-1/2 -translate-x-1/2 h-64 w-[640px] rounded-full bg-white/10 blur-3xl"
          />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight text-white max-w-3xl mx-auto">
              Ready to build a finance function for your franchise system?
            </h2>
            <p className="mt-5 text-base md:text-lg text-white/75 max-w-2xl mx-auto leading-relaxed">
              Get CFO-level guidance, clean reporting, and day-to-day finance execution
              without building a full in-house team.
            </p>
            <div className="mt-9 flex flex-col items-center gap-4">
              <BookACallButton variant="light" />
              <button
                type="button"
                onClick={openBooking}
                className="text-sm text-white/80 hover:text-white underline underline-offset-4 transition-colors"
              >
                Not ready to book? Send us your info.
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
