"use client";

import { useEffect, useState, useCallback } from "react";
import { calculateProforma, DEFAULT_ASSUMPTIONS } from "@/lib/proforma";
import { fmtDollar, fmtPct, fmtMultiple, fmtNum } from "@/lib/fmt";

type Tab = "pricing" | "units" | "construction" | "financing" | "sales" | "sponsor" | "waterfall" | "softcosts" | "hold";

const TABS: { id: Tab; label: string }[] = [
  { id: "pricing", label: "Unit Pricing" },
  { id: "units", label: "Unit Mix" },
  { id: "construction", label: "Construction" },
  { id: "financing", label: "Financing" },
  { id: "sales", label: "Sales" },
  { id: "hold", label: "Hold Period" },
  { id: "sponsor", label: "Sponsor Fees" },
  { id: "waterfall", label: "Waterfall" },
  { id: "softcosts", label: "Soft Costs" },
];

interface FieldDef {
  key: string;
  label: string;
  step?: string;
  prefix?: string;
  suffix?: string;
}

const FIELDS: Record<Tab, FieldDef[]> = {
  pricing: [
    { key: "ph1_price_sf", label: "Phase 1 $/SF", prefix: "$" },
    { key: "ph2a_price_sf", label: "Phase 2A $/SF", prefix: "$" },
    { key: "ph2b_price_sf", label: "Phase 2B $/SF", prefix: "$" },
  ],
  units: [
    { key: "ph1_small_units", label: "Ph1 Small — Units" },
    { key: "ph1_small_sf", label: "Ph1 Small — SF", suffix: "SF" },
    { key: "ph1_mid_units", label: "Ph1 Mid — Units" },
    { key: "ph1_mid_sf", label: "Ph1 Mid — SF", suffix: "SF" },
    { key: "ph1_large_units", label: "Ph1 Large — Units" },
    { key: "ph1_large_sf", label: "Ph1 Large — SF", suffix: "SF" },
    { key: "ph2a_small_units", label: "Ph2A Small — Units" },
    { key: "ph2a_small_sf", label: "Ph2A Small — SF", suffix: "SF" },
    { key: "ph2a_mid_units", label: "Ph2A Mid — Units" },
    { key: "ph2a_mid_sf", label: "Ph2A Mid — SF", suffix: "SF" },
    { key: "ph2a_large_units", label: "Ph2A Large — Units" },
    { key: "ph2a_large_sf", label: "Ph2A Large — SF", suffix: "SF" },
    { key: "ph2b_premium_units", label: "Ph2B Premium — Units" },
    { key: "ph2b_premium_sf", label: "Ph2B Premium — SF", suffix: "SF" },
  ],
  construction: [
    { key: "hard_cost_sf", label: "Hard cost / SF", prefix: "$" },
    { key: "land_cost", label: "Land cost", prefix: "$" },
    { key: "land_appraised", label: "Land appraised value", prefix: "$" },
  ],
  financing: [
    { key: "ltc", label: "Loan-to-cost", step: "0.01" },
    { key: "loan_rate", label: "Interest rate", step: "0.005" },
    { key: "ph1_draw_months", label: "Ph1 draw months" },
    { key: "ph2a_draw_months", label: "Ph2A draw months" },
    { key: "ph2b_draw_months", label: "Ph2B draw months" },
  ],
  sales: [
    { key: "broker_pct", label: "Broker commission", step: "0.005" },
    { key: "closing_pct", label: "Closing cost %", step: "0.0025" },
    { key: "absorption_rate", label: "Units / month" },
  ],
  hold: [
    { key: "construction_months", label: "Construction months" },
    { key: "absorption_months", label: "Absorption months" },
  ],
  sponsor: [
    { key: "dev_fee_pct", label: "Development fee %", step: "0.005" },
    { key: "cm_fee_pct", label: "CM fee %", step: "0.005" },
    { key: "asset_mgmt_per_month", label: "Asset mgmt / month", prefix: "$" },
    { key: "placement_fee_pct", label: "Placement fee %", step: "0.005" },
    { key: "cogp_equity_raise", label: "Co-GP equity raise", prefix: "$" },
  ],
  waterfall: [
    { key: "gp_equity", label: "GP equity", prefix: "$" },
    { key: "land_equity_credit", label: "Land equity credit", prefix: "$" },
    { key: "pref_rate_senior", label: "Senior pref rate", step: "0.005" },
    { key: "pref_rate_equity", label: "Equity pref rate", step: "0.005" },
    { key: "profit_split_cogp", label: "Co-GP profit split", step: "0.05" },
    { key: "option_b_pref_tranche", label: "Option B pref tranche", prefix: "$" },
  ],
  softcosts: [
    { key: "arch_eng_ph1", label: "Arch/Eng — Ph1", prefix: "$" },
    { key: "arch_eng_ph2a", label: "Arch/Eng — Ph2A", prefix: "$" },
    { key: "arch_eng_ph2b", label: "Arch/Eng — Ph2B", prefix: "$" },
    { key: "permits_ph1", label: "Permits — Ph1", prefix: "$" },
    { key: "permits_ph2a", label: "Permits — Ph2A", prefix: "$" },
    { key: "permits_ph2b", label: "Permits — Ph2B", prefix: "$" },
    { key: "legal_ph1", label: "Legal — Ph1", prefix: "$" },
    { key: "legal_ph2a", label: "Legal — Ph2A", prefix: "$" },
    { key: "legal_ph2b", label: "Legal — Ph2B", prefix: "$" },
    { key: "enviro_ph1", label: "Environmental — Ph1", prefix: "$" },
    { key: "enviro_ph2a", label: "Environmental — Ph2A", prefix: "$" },
    { key: "enviro_ph2b", label: "Environmental — Ph2B", prefix: "$" },
    { key: "marketing_ph1", label: "Marketing — Ph1", prefix: "$" },
    { key: "marketing_ph2a", label: "Marketing — Ph2A", prefix: "$" },
    { key: "marketing_ph2b", label: "Marketing — Ph2B", prefix: "$" },
  ],
};

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "#151A24", border: "1px solid rgba(201,168,76,0.18)", padding: "14px 16px" }}>
      <div className="stat-label mb-1">{label}</div>
      <div className="stat-value text-[20px]">{value}</div>
    </div>
  );
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [tab, setTab] = useState<Tab>("pricing");
  const [data, setData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [savedPw, setSavedPw] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/assumptions")
      .then((r) => r.json())
      .then((d) => {
        const merged: Record<string, string> = {};
        for (const [k, v] of Object.entries(DEFAULT_ASSUMPTIONS)) {
          merged[k] = d[k] ?? String(v);
        }
        setData(merged);
      });
  }, []);

  const handleChange = useCallback((key: string, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setStatus("");
    try {
      const res = await fetch("/api/assumptions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": savedPw },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const e = await res.json();
        setStatus("Error: " + (e.error || res.statusText));
      } else {
        setStatus("Published");
        setTimeout(() => setStatus(""), 3000);
      }
    } catch {
      setStatus("Network error");
    }
    setSaving(false);
  };

  const p = Object.keys(data).length > 0 ? calculateProforma(data) : null;

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0F1E" }}>
        <div style={{ background: "#151A24", border: "1px solid rgba(201,168,76,0.18)", padding: "40px", width: "100%", maxWidth: "380px" }}>
          <div className="stat-label mb-3">Trade Point Industrial</div>
          <h1 className="heading-display text-[28px] mb-8">Assumptions Editor</h1>
          <div className="stat-label mb-2">Password</div>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { setSavedPw(pw); setAuthed(true); } }}
            className="mb-6"
          />
          <button
            onClick={() => { setSavedPw(pw); setAuthed(true); }}
            style={{ background: "#C9A84C", color: "#0A0F1E", width: "100%", padding: "12px", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: "13px", letterSpacing: "0.1em", textTransform: "uppercase" as const }}
          >
            Enter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#0A0F1E" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(201,168,76,0.18)" }}>
        <div>
          <div className="stat-label mb-1">Trade Point Industrial</div>
          <h1 className="heading-display text-[22px]">Assumptions Editor</h1>
        </div>
        <div className="flex items-center gap-4">
          {status && <span className="font-mono text-[12px] text-[#C9A84C]">{status}</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: "#C9A84C", color: "#0A0F1E", padding: "10px 24px", border: "none", cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: "12px", letterSpacing: "0.1em",
              textTransform: "uppercase" as const, opacity: saving ? 0.5 : 1,
            }}
          >
            {saving ? "Saving..." : "Save & Publish"}
          </button>
          <a href="/" className="text-[#8A95A8] text-[13px] hover:text-[#F0EDE5] transition-colors">← Investor Page</a>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar — live returns */}
        <aside className="w-[260px] shrink-0 p-5 space-y-3 sticky top-0 h-screen overflow-y-auto" style={{ borderRight: "1px solid rgba(201,168,76,0.18)" }}>
          <div className="stat-label mb-3">Live Returns</div>
          {p && (
            <>
              <KPI label="Gross Revenue" value={fmtDollar(p.grossRevenue)} />
              <KPI label="Total Dev Cost" value={fmtDollar(p.totalTDC)} />
              <KPI label="Net Profit" value={fmtDollar(p.netProfit)} />
              <KPI label="Margin" value={fmtPct(p.profitMargin)} />
              <KPI label="Total Raise" value={fmtDollar(p.totalRaise)} />
              <div className="pt-3 mt-3" style={{ borderTop: "1px solid rgba(201,168,76,0.18)" }}>
                <div className="stat-label mb-2">Option A</div>
                <KPI label="EM / IRR" value={fmtMultiple(p.optionA.equityMultiple) + " / " + fmtPct(p.optionA.irr)} />
              </div>
              <div className="pt-3 mt-3" style={{ borderTop: "1px solid rgba(201,168,76,0.18)" }}>
                <div className="stat-label mb-2">Option B — Pref</div>
                <KPI label="EM / IRR" value={fmtMultiple(p.optionBPref.equityMultiple) + " / " + fmtPct(p.optionBPref.irr)} />
              </div>
              <div className="pt-3 mt-3" style={{ borderTop: "1px solid rgba(201,168,76,0.18)" }}>
                <div className="stat-label mb-2">Option B — Equity</div>
                <KPI label="EM / IRR" value={fmtMultiple(p.optionBEquity.equityMultiple) + " / " + fmtPct(p.optionBEquity.irr)} />
              </div>
              <div className="pt-3 mt-3" style={{ borderTop: "1px solid rgba(201,168,76,0.18)" }}>
                <KPI label="Units / SF" value={p.totalUnits + " / " + fmtNum(p.totalSF)} />
                <div className="mt-2"><KPI label="Hold" value={p.holdMonths + " months"} /></div>
              </div>
            </>
          )}
        </aside>

        {/* Main content */}
        <div className="flex-1 p-6">
          {/* Tabs */}
          <div className="flex gap-[2px] mb-8 flex-wrap">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: "10px 18px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "11px",
                  fontWeight: 500,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase" as const,
                  cursor: "pointer",
                  border: tab === t.id ? "1px solid rgba(201,168,76,0.4)" : "1px solid rgba(201,168,76,0.12)",
                  background: tab === t.id ? "rgba(201,168,76,0.08)" : "#151A24",
                  color: tab === t.id ? "#C9A84C" : "#8A95A8",
                  transition: "all 0.15s",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FIELDS[tab].map((f) => (
              <div key={f.key}>
                <label className="stat-label block mb-2">{f.label}</label>
                <div className="relative">
                  {f.prefix && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C9A84C] text-[13px] font-mono" style={{ opacity: 0.5 }}>{f.prefix}</span>
                  )}
                  <input
                    type="number"
                    step={f.step || "any"}
                    value={data[f.key] ?? ""}
                    onChange={(e) => handleChange(f.key, e.target.value)}
                    style={{ paddingLeft: f.prefix ? "28px" : "14px", paddingRight: f.suffix ? "40px" : "14px" }}
                  />
                  {f.suffix && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A95A8] text-[11px] font-mono">{f.suffix}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
