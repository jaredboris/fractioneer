import logoDark from "@/assets/fractioneer-logo-dark.svg";
import logoWhite from "@/assets/fractioneer-logo-white.svg";

export function PortalEmptyState({
  message = "Your Fractioneer team hasn't shared any data here yet.",
}: {
  message?: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border bg-white border-[#E5E9F1] px-8 py-24 dark:bg-[#040316] dark:border-[#1E2A3A]">
      <div className="relative h-20 w-20">
        <img
          src={logoDark}
          alt="Fractioneer"
          className="absolute inset-0 h-20 w-20 object-contain opacity-100 transition-opacity duration-500 dark:opacity-0"
        />
        <img
          src={logoWhite}
          alt=""
          aria-hidden
          className="absolute inset-0 h-20 w-20 object-contain opacity-0 transition-opacity duration-500 dark:opacity-100"
        />
      </div>
      <p className="mt-6 max-w-sm text-center text-sm text-slate-500 dark:text-[#9CA3AF]">
        {message}
      </p>
    </div>
  );
}
