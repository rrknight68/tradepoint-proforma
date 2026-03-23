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
    { key: "ph1_small_units", label: "Ph1 Small Units" },
    { key: "ph1_small_sf", label: "Ph1 Small SF", suffix: "SF" },
    { key: "ph1_mid_units", label: "Ph1 Mid Units" },
    { key: "ph1_mid_sf", label: "Ph1 Mid SF", suffix: "SF" },
    { key: "ph1_large_units", label: "Ph1 Large Units" },
    { key: "ph1_large_sf", label: "Ph1 Large SF", suffix: "SF" },
    { key: "ph2a_small_units", label: "Ph2A Small Units" },
    { key: "ph2a_small_sf", label: "Ph2A Small SF", suffix: "SF" },
    { key: "ph2a_mid_units", label: "Ph2A Mid Units" },
    { key: "ph2a_mid_sf", label: "Ph2A Mid SF", suffix: "SF" },
    { key: "ph2a_large_units", label: "Ph2A Large Units" },
    { key: "ph2a_large_sf", label: "Ph2A Large SF", suffix: "SF" },
    { key: "ph2b_premium_units", label: "Ph2B Premium Units" },
    { key: "ph2b_premium_sf", label: "Ph2B Premium SF", suffix: "SF" },
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
    { key: "arch_eng_ph1", label: "Arch/Eng Ph1", prefix: "$" },
    { key: "arch_eng_ph2a", label: "Arch/Eng Ph2A", prefix: "$" },
    { key: "arch_eng_ph2b", label: "Arch/Eng Ph2B", prefix: "$" },
    { key: "permits_ph1", label: "Permits Ph1", prefix: "$" },
    { key: "permits_ph2a", label: "Permits Ph2A", prefix: "$" },
    { key: "permits_ph2b", label: "Permits Ph2B", prefix: "$" },
    { key: "legal_ph1", label: "Legal Ph1", prefix: "$" },
    { key: "legal_ph2a", label: "Legal Ph2A", prefix: "$" },
    { key: "legal_ph2b", label: "Legal Ph2B", prefix: "$" },
    { key: "enviro_ph1", label: "Environmental Ph1", prefix: "$" },
    { key: "enviro_ph2a", label: "Environmental Ph2A", prefix: "$" },
    { key: "enviro_ph2b", label: "Environmental Ph2B", prefix: "$" },
    { key: "marketing_ph1", label: "Marketing Ph1", prefix: "$" },
    { key: "marketing_ph2a", label: "Marketing Ph2A", prefix: "$" },
    { key: "marketing_ph2b", label: "Marketing Ph2B", prefix: "$" },
  ],
};

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-navy-mid border border-navy-light rounded p-3">
      <div className="text-[9px] font-mono tracking-[2px] uppercase text-gold/60 mb-1">{label}</div>
      <div className="font-display text-xl text-cream">{value}</div>
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
        setStatus("Saved & published");
      }
    } catch (err) {
      setStatus("Network error");
    }
    setSaving(false);
  };

  // Live calculation
  const p = Object.keys(data).length > 0 ? calculateProforma(data) : null;

  if (!authed) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="bg-navy-mid border border-navy-light rounded-lg p-8 w-full max-w-sm">
          <h1 className="font-display text-2xl text-cream mb-6">Admin Access</h1>
          <input
            type="password"
            placeholder="Password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { setSavedPw(pw); setAuthed(true); } }}
            className="w-full mb-4"
          />
          <button
            onClick={() => { setSavedPw(pw); setAuthed(true); }}
            className="w-full bg-gold text-navy font-semibold py-2.5 rounded hover:bg-gold-light transition-colors"
          >
            Enter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy">
      <header className="border-b border-navy-light px-6 py-4 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono tracking-[3px] uppercase text-gold">Trade Point Admin</div>
          <h1 className="font-display text-2xl text-cream">Assumptions Editor</h1>
        </div>
        <div className="flex items-center gap-3">
          {status && <span className="text-xs font-mono text-gold">{status}</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-gold text-navy font-semibold px-6 py-2.5 rounded hover:bg-gold-light transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save & Publish"}
          </button>
          <a href="/" className="text-sand/50 text-sm hover:text-cream transition-colors">← Investor Page</a>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar — live returns */}
        <aside className="w-72 border-r border-navy-light p-4 space-y-3 shrink-0 sticky top-0 h-screen overflow-y-auto">
          <div className="text-[10px] font-mono tracking-[2px] uppercase text-gold/60 mb-2">Live Returns</div>
          {p && (
            <>
              <KPI label="Gross Revenue" value={fmtDollar(p.grossRevenue)} />
              <KPI label="Total Dev Cost" value={fmtDollar(p.totalTDC)} />
              <KPI label="Net Profit" value={fmtDollar(p.netProfit)} />
              <KPI label="Margin" value={fmtPct(p.profitMargin)} />
              <KPI label="Total Raise" value={fmtDollar(p.totalRaise)} />
              <div className="border-t border-navy-light pt-3 mt-3">
                <div className="text-[9px] font-mono tracking-[2px] uppercase text-gold/40 mb-2">Option A</div>
                <KPI label="EM / IRR" value={fmtMultiple(p.optionA.equityMultiple) + " / " + fmtPct(p.optionA.irr)} />
              </div>
              <div className="border-t border-navy-light pt-3 mt-3">
                <div className="text-[9px] font-mono tracking-[2px] uppercase text-gold/40 mb-2">Option B — Pref</div>
                <KPI label="EM / IRR" value={fmtMultiple(p.optionBPref.equityMultiple) + " / " + fmtPct(p.optionBPref.irr)} />
              </div>
              <div className="border-t border-navy-light pt-3">
                <div className="text-[9px] font-mono tracking-[2px] uppercase text-gold/40 mb-2">Option B — Equity</div>
                <KPI label="EM / IRR" value={fmtMultiple(p.optionBEquity.equityMultiple) + " / " + fmtPct(p.optionBEquity.irr)} />
              </div>
              <div className="border-t border-navy-light pt-3">
                <KPI label="Units / SF" value={p.totalUnits + " / " + fmtNum(p.totalSF)} />
                <div className="mt-2">
                  <KPI label="Hold" value={p.holdMonths + " months"} />
                </div>
              </div>
            </>
          )}
        </aside>

        {/* Main content */}
        <div className="flex-1 p-6">
          {/* Tabs */}
          <div className="flex gap-1 mb-6 flex-wrap">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 text-xs font-mono tracking-[1px] uppercase rounded transition-colors ${
                  tab === t.id
                    ? "bg-gold text-navy"
                    : "bg-navy-mid text-sand/60 hover:text-cream border border-navy-light"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FIELDS[tab].map((f) => (
              <div key={f.key}>
                <label className="block text-[11px] font-mono tracking-[1px] uppercase text-sand/60 mb-1.5">
                  {f.label}
                </label>
                <div className="relative">
                  {f.prefix && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gold/50 text-sm font-mono">{f.prefix}</span>
                  )}
                  <input
                    type="number"
                    step={f.step || "any"}
                    value={data[f.key] ?? ""}
                    onChange={(e) => handleChange(f.key, e.target.value)}
                    className={`w-full ${f.prefix ? "pl-7" : ""} ${f.suffix ? "pr-10" : ""}`}
                  />
                  {f.suffix && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sand/40 text-xs font-mono">{f.suffix}</span>
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
