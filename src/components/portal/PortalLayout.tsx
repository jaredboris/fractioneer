import { BetaBanner } from "./BetaBanner";

interface PortalLayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export function PortalLayout({ sidebar, children }: PortalLayoutProps) {
  return (
    <>
      <div className="flex flex-col w-72 shrink-0 overflow-y-auto rounded-2xl bg-[#10111a]">
        {sidebar}
      </div>
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-[#10111a]">
        <BetaBanner />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
}
