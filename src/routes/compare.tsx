import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Fractioneer | Industry comparison" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: IndustryTable,
});

type Score = { val: 1 | 2 | 3; note: string };
type Industry = {
  name: string;
  tag: string;
  tagColor: string;
  note: string;
  scores: Record<string, Score>;
};

const industries: Industry[] = [
  {
    name: "Franchising",
    tag: "BASELINE",
    tagColor: "#64748b",
    note: "What we already do",
    scores: {
      fragmented: { val: 2, note: "~900 franchisors, list runs out fast" },
      maActivity: { val: 3, note: "Active but maturing" },
      exitTrigger: { val: 3, note: "Strong — operators prep for sale regularly" },
      recurringRevenue: { val: 3, note: "Royalties, NAF, tech fees are predictable" },
      repeatableStructure: { val: 3, note: "Best in class — royalties, NAF, tech fee, FDD" },
      margins: { val: 3, note: "Strong enough to support us" },
      multiEntity: { val: 3, note: "Multiple franchisees, entities, locations" },
    },
  },
  {
    name: "Specialty trades + fire & life safety",
    tag: "LEAD",
    tagColor: "#0ea5e9",
    note: "Existing clients, fire safety consolidating fast",
    scores: {
      fragmented: { val: 3, note: "9,000+ fire safety companies alone, highly fragmented" },
      maActivity: { val: 3, note: "242 US deals in 2025, up 24.1% YoY (Capstone 2026)" },
      exitTrigger: { val: 3, note: "PE diligence exposes books — cleanup trigger fires constantly" },
      recurringRevenue: { val: 3, note: "Code-mandated annual inspections + monitoring MRR" },
      repeatableStructure: { val: 3, note: "Inspection cycles, service contracts, monitoring fees repeat across every operator" },
      margins: { val: 3, note: "High margin — recurring contracts with low marginal cost" },
      multiEntity: { val: 2, note: "Multi-location, multi-state but often single-entity" },
    },
  },
  {
    name: "Behavioral health + specialty healthcare",
    tag: "EXPAND",
    tagColor: "#8b5cf6",
    note: "Phoenix Recovery foothold, large PE exit cohort",
    scores: {
      fragmented: { val: 3, note: "Thousands of independent clinics, 95%+ not PE-owned" },
      maActivity: { val: 3, note: "Heavy PE roll-up past decade, large 2018–2022 cohort approaching exit" },
      exitTrigger: { val: 3, note: "PE comes calling, clinician-owners have no finance function" },
      recurringRevenue: { val: 2, note: "Recurring patient panels, but payer mix can be variable" },
      repeatableStructure: { val: 2, note: "Per-session billing repeats, but insurance reimbursement complexity varies" },
      margins: { val: 2, note: "Mixed — cash-pay practices strong, insurance-heavy can be thin" },
      multiEntity: { val: 2, note: "Multi-site licensing adds real complexity" },
    },
  },
  {
    name: "Law firms, PI focus",
    tag: "STRONG CANDIDATE",
    tagColor: "#10b981",
    note: "Repeatable structure, ABS/MSO consolidation accelerating",
    scores: {
      fragmented: { val: 3, note: "Tens of thousands of small PI firms nationally" },
      maActivity: { val: 2, note: "Early but accelerating — ABS model unlocking PE in AZ/UT, MSO nationwide" },
      exitTrigger: { val: 2, note: "Succession pressure and case portfolio sales, not as urgent as trades" },
      recurringRevenue: { val: 2, note: "Ongoing caseloads are recurring in practice, not subscription-based" },
      repeatableStructure: { val: 3, note: "Trust accounting, contingency fee recognition, partner distributions repeat across every PI firm" },
      margins: { val: 3, note: "PI firms on contingency can be very high margin" },
      multiEntity: { val: 1, note: "Mostly single-entity firms, less multi-entity complexity" },
    },
  },
  {
    name: "Property management",
    tag: "RESEARCH NEXT",
    tagColor: "#f59e0b",
    note: "Fragmented but exit urgency is weaker",
    scores: {
      fragmented: { val: 3, note: "Tens of thousands of independent operators, severe fragmentation" },
      maActivity: { val: 2, note: "PE platforms emerging but earlier stage than trades or healthcare" },
      exitTrigger: { val: 1, note: "Founders tend to hold — steady cash flow, low urgency to sell" },
      recurringRevenue: { val: 3, note: "Monthly management fees are pure recurring revenue" },
      repeatableStructure: { val: 3, note: "Management fee accounting, trust accounts, property P&L repeat across all operators" },
      margins: { val: 2, note: "Reasonable — management fees are a percentage of rent collected" },
      multiEntity: { val: 3, note: "Multiple properties, entities, states — real complexity" },
    },
  },
  {
    name: "Youth sports",
    tag: "WATCH ITEM",
    tagColor: "#ef4444",
    note: "Let Kids Play Act (May 2026) is a serious headwind",
    scores: {
      fragmented: { val: 3, note: "Thousands of independent leagues, facilities, clubs" },
      maActivity: { val: 2, note: "Real activity (IMG $1.25B, Unrivaled Sports) but federal bill could freeze PE" },
      exitTrigger: { val: 1, note: "Small league operators are often hobby businesses — too low-margin for us" },
      recurringRevenue: { val: 1, note: "Seasonal, registration-based — not predictable recurring revenue" },
      repeatableStructure: { val: 1, note: "Leagues, facilities, and tournaments all have different structures" },
      margins: { val: 1, note: "Often non-profit or break-even — can't support Fractioneer fees" },
      multiEntity: { val: 1, note: "Small operators are usually single-entity" },
    },
  },
];

const criteria = [
  { key: "fragmented", label: "Fragmented" },
  { key: "maActivity", label: "M&A Activity" },
  { key: "exitTrigger", label: "Exit Trigger" },
  { key: "recurringRevenue", label: "Recurring Rev." },
  { key: "repeatableStructure", label: "Repeatable" },
  { key: "margins", label: "Margins" },
  { key: "multiEntity", label: "Multi-Entity" },
];

const DOT_COLORS: Record<number, string> = { 1: "#ef4444", 2: "#f59e0b", 3: "#22c55e" };
const DOT_LABELS: Record<number, string> = { 1: "Weak", 2: "Moderate", 3: "Strong" };

function ScoreCell({
  score,
  criteriaLabel,
  isActive,
  onClick,
  placement = "top",
}: {
  score: Score;
  criteriaLabel: string;
  isActive: boolean;
  onClick: () => void;
  placement?: "top" | "bottom";
}) {

  return (
    <td
      onClick={onClick}
      style={{
        background: isActive ? "#1e3a5f" : "#1a2540",
        border: isActive ? "1px solid #38bdf855" : "1px solid #0c1220",
        cursor: "pointer",
        textAlign: "center",
        verticalAlign: "middle",
        padding: "12px 6px",
        position: "relative",
        transition: "background 0.15s",
        minWidth: 60,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
        <div
          style={{
            width: 13,
            height: 13,
            borderRadius: "50%",
            background: DOT_COLORS[score.val],
            boxShadow: `0 0 7px ${DOT_COLORS[score.val]}88`,
            margin: "0 auto",
          }}
        />
        <span
          style={{
            fontSize: 8,
            color: DOT_COLORS[score.val],
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {DOT_LABELS[score.val]}
        </span>
      </div>
      {isActive && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#0f172a",
            border: "1px solid #334155",
            borderRadius: 8,
            padding: "10px 12px",
            width: 200,
            zIndex: 200,
            boxShadow: "0 12px 32px rgba(0,0,0,0.6)",
            textAlign: "left",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 800,
              color: "#38bdf8",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 5,
            }}
          >
            {criteriaLabel}
          </div>
          <div style={{ fontSize: 11, color: "#cbd5e1", lineHeight: 1.6 }}>{score.note}</div>
        </div>
      )}
    </td>
  );
}

function IndustryTable() {
  const [activeCell, setActiveCell] = useState<string | null>(null);

  const handleCell = (rowIdx: number, key: string) => {
    const id = `${rowIdx}-${key}`;
    setActiveCell((prev) => (prev === id ? null : id));
  };

  return (
    <div
      style={{
        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
        background: "#0c1220",
        minHeight: "100vh",
        padding: "28px 20px 40px",
        color: "#e2e8f0",
        overflowX: "auto",
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div
            style={{
              width: 5,
              height: 20,
              borderRadius: 3,
              background: "linear-gradient(180deg, #38bdf8, #6366f1)",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.14em",
              color: "#38bdf8",
              textTransform: "uppercase",
            }}
          >
            Internal · Industry Analysis
          </span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#f1f5f9", margin: "0 0 5px", lineHeight: 1.2 }}>
          Industry comparison
        </h1>
        <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
          Tap any score cell for context. Franchising is the baseline.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          flexWrap: "wrap",
          marginBottom: 18,
          padding: "9px 14px",
          background: "#1a2540",
          borderRadius: 8,
          border: "1px solid #1e293b",
        }}
      >
        {([["#22c55e", "Strong"], ["#f59e0b", "Moderate"], ["#ef4444", "Weak"]] as const).map(([c, l]) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 9, height: 9, borderRadius: "50%", background: c, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "#94a3b8" }}>{l}</span>
          </div>
        ))}
      </div>

      <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid #1e293b" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
            minWidth: 640,
          }}
        >
          <colgroup>
            <col style={{ width: "22%" }} />
            {criteria.map((c) => (
              <col key={c.key} style={{ width: `${78 / criteria.length}%` }} />
            ))}
          </colgroup>

          <thead>
            <tr>
              <th
                style={{
                  background: "#111827",
                  padding: "10px 14px",
                  textAlign: "left",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  color: "#475569",
                  textTransform: "uppercase",
                  border: "1px solid #0c1220",
                }}
              >
                Industry
              </th>
              {criteria.map((c) => (
                <th
                  key={c.key}
                  style={{
                    background: "#111827",
                    padding: "10px 4px",
                    textAlign: "center",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    color: "#475569",
                    textTransform: "uppercase",
                    border: "1px solid #0c1220",
                    lineHeight: 1.3,
                  }}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {industries.map((ind, i) => (
              <tr key={ind.name} style={{ transition: "opacity 0.1s" }}>
                <td
                  style={{
                    background: "#1a2540",
                    border: "1px solid #0c1220",
                    borderLeft: `3px solid ${ind.tagColor}`,
                    padding: "12px 12px",
                    verticalAlign: "middle",
                  }}
                >
                  <div
                    style={{
                      display: "inline-flex",
                      background: `${ind.tagColor}20`,
                      border: `1px solid ${ind.tagColor}40`,
                      borderRadius: 3,
                      padding: "1px 6px",
                      fontSize: 7.5,
                      fontWeight: 800,
                      letterSpacing: "0.09em",
                      color: ind.tagColor,
                      textTransform: "uppercase",
                      marginBottom: 5,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {ind.tag}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#e2e8f0",
                      lineHeight: 1.35,
                      marginBottom: 2,
                    }}
                  >
                    {ind.name}
                  </div>
                  <div style={{ fontSize: 9, color: "#475569", lineHeight: 1.4 }}>{ind.note}</div>
                </td>

                {criteria.map((c) => {
                  const cellId = `${i}-${c.key}`;
                  return (
                    <ScoreCell
                      key={c.key}
                      score={ind.scores[c.key]}
                      criteriaLabel={c.label}
                      isActive={activeCell === cellId}
                      onClick={() => handleCell(i, c.key)}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          marginTop: 16,
          background: "#1a2540",
          border: "1px solid #1e293b",
          borderLeft: "3px solid #334155",
          borderRadius: 8,
          padding: "11px 14px",
        }}
      >
        <p style={{ fontSize: 11, color: "#475569", margin: 0, lineHeight: 1.6 }}>
          Franchising remains the primary focus. All five industries above are outside franchising.
          The goal is finding one additional niche where Fractioneer can build a repeatable playbook.
        </p>
      </div>
    </div>
  );
}
