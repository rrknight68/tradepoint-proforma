import { calculateProforma, DEFAULT_ASSUMPTIONS } from "@/lib/proforma";
import { getAssumptions } from "@/lib/supabase";
import { fmtDollar, fmtDollarFull, fmtPct, fmtSF, fmtMultiple, fmtNum } from "@/lib/fmt";

export const dynamic = "force-dynamic";

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="metric-card">
      <div className="stat-label mb-3">{label}</div>
      <div className="heading-display text-[28px]">{value}</div>
      {sub && <div className="text-[12px] text-[#8A95A8] mt-2 font-body">{sub}</div>}
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between items-baseline py-3" style={{ borderBottom: "1px solid rgba(201,168,76,0.08)" }}>
      <span className="text-[14px] text-[#8A95A8]">{label}</span>
      <span className={`font-mono text-[14px] ${accent ? "text-[#C9A84C] font-medium" : "text-[#F0EDE5]"}`}>{value}</span>
    </div>
  );
}

function WaterfallCard({ title, tag, w }: {
  title: string; tag: string;
  w: { capital: number; pref: number; split: number; totalReturn: number; equityMultiple: number; irr: number };
}) {
  return (
    <div className="metric-card">
      <div className="flex items-center gap-3 mb-6">
        <h3 className="heading-gold text-[20px]">{title}</h3>
        <span className="text-[9px] font-mono tracking-[0.15em] uppercase text-[#C9A84C] px-2 py-1" style={{ border: "1px solid rgba(201,168,76,0.25)" }}>{tag}</span>
      </div>
      <Row label="Capital invested" value={fmtDollar(w.capital)} />
      <Row label="Preferred return" value={fmtDollar(w.pref)} />
      {w.split > 0 && <Row label="Profit participation" value={fmtDollar(w.split)} />}
      <Row label="Total return" value={fmtDollarFull(w.totalReturn)} accent />
      <div className="grid grid-cols-2 gap-6 mt-6 pt-6" style={{ borderTop: "1px solid rgba(201,168,76,0.18)" }}>
        <div>
          <div className="stat-label mb-2">Equity Multiple</div>
          <div className="stat-value text-[26px]">{fmtMultiple(w.equityMultiple)}</div>
        </div>
        <div>
          <div className="stat-label mb-2">IRR</div>
          <div className="stat-value text-[26px]">{fmtPct(w.irr)}</div>
        </div>
      </div>
    </div>
  );
}

export default async function InvestorPage() {
  let assumptions: Record<string, string> = {};
  try {
    assumptions = await getAssumptions();
  } catch {
    // Fall back to defaults if Supabase unavailable
  }

  const merged: Record<string, string> = {};
  for (const [k, v] of Object.entries(DEFAULT_ASSUMPTIONS)) {
    merged[k] = assumptions[k] ?? String(v);
  }

  const p = calculateProforma(merged);

  return (
    <main className="min-h-screen" style={{ background: "#0A0F1E" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid rgba(201,168,76,0.18)" }}>
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="stat-label mb-4">Vantage Point Investments</div>
          <h1 className="heading-display text-[42px] mb-2">Trade Point Industrial</h1>
          <p className="text-[#8A95A8] text-[16px]">
            {fmtNum(p.totalSF)} SF · {p.totalUnits} Units · 3 Buildings · Cape Coral, Florida
          </p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-14 space-y-20">

        {/* ── Key Metrics ── */}
        <section>
          <div className="section-label">Project Overview</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <Stat label="Gross Revenue" value={fmtDollar(p.grossRevenue)} sub={fmtDollarFull(Math.round(p.weightedAvgPSF)) + " / SF weighted avg"} />
            <Stat label="Total Dev Cost" value={fmtDollar(p.totalTDC)} sub={fmtDollarFull(Math.round(p.totalTDC / p.totalSF)) + " / SF all-in"} />
            <Stat label="Net Profit" value={fmtDollar(p.netProfit)} sub={fmtPct(p.profitMargin) + " margin"} />
            <Stat label="Total Equity Raise" value={fmtDollar(p.totalRaise)} sub={fmtPct(p.ltc) + " loan-to-cost"} />
          </div>
        </section>

        <hr className="gold-rule" />

        {/* ── Unit Mix ── */}
        <section>
          <div className="section-label">Unit Mix by Phase</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { name: "Phase 1", ph: p.ph1 },
              { name: "Phase 2A", ph: p.ph2a },
              { name: "Phase 2B", ph: p.ph2b },
            ].map(({ name, ph }) => (
              <div key={name} className="metric-card">
                <h3 className="heading-gold text-[20px] mb-5">{name}</h3>
                <Row label="Units" value={String(ph.units)} />
                <Row label="Total SF" value={fmtSF(ph.sf)} />
                <Row label="Sale price / SF" value={fmtDollarFull(ph.priceSF)} />
                <Row label="Gross Revenue" value={fmtDollar(ph.revenue)} accent />
              </div>
            ))}
          </div>
        </section>

        <hr className="gold-rule" />

        {/* ── Project Budget ── */}
        <section>
          <div className="section-label">Development Budget</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="metric-card">
              <h3 className="heading-gold text-[20px] mb-5">Cost Summary</h3>
              <Row label="Land" value={fmtDollar(p.totalLand)} />
              <Row label={"Hard costs (" + fmtDollarFull(p.hardCostSF) + " / SF)"} value={fmtDollar(p.totalHard)} />
              <Row label="Soft costs" value={fmtDollar(p.totalSoft)} />
              <Row label="Sponsor fees" value={fmtDollar(p.totalSponsor)} />
              <Row label="Total development cost" value={fmtDollar(p.totalTDC)} accent />
            </div>
            <div className="metric-card">
              <h3 className="heading-gold text-[20px] mb-5">Capital Stack</h3>
              <Row label={"Senior debt (" + fmtPct(p.ltc) + " LTC)"} value={fmtDollar(p.totalDebt)} />
              <Row label="Total equity required" value={fmtDollar(p.totalEquity)} />
              <Row label="Total development cost" value={fmtDollar(p.totalTDC)} accent />
              <div className="mt-5 pt-5" style={{ borderTop: "1px solid rgba(201,168,76,0.18)" }}>
                <Row label="Phase 1 net sale proceeds" value={fmtDollar(p.ph1NetProceeds)} />
                <Row label="Phase 2A equity need" value={fmtDollar(p.ph2aEquityReq)} />
                <Row label="Phase 2B equity need" value={fmtDollar(p.ph2bEquityReq)} />
                <Row label="Phase 2 surplus / (gap)" value={fmtDollar(p.ph2Surplus)} accent />
              </div>
            </div>
          </div>
        </section>

        <hr className="gold-rule" />

        {/* ── Sales ── */}
        <section>
          <div className="section-label">Sales &amp; Net Proceeds</div>
          <div className="metric-card max-w-2xl">
            <Row label="Gross revenue" value={fmtDollar(p.grossRevenue)} />
            <Row label={"Broker commission (" + fmtPct(p.brokerCost / p.grossRevenue) + ")"} value={"(" + fmtDollar(p.brokerCost) + ")"} />
            <Row label={"Closing costs (" + fmtPct(p.closingCost / p.grossRevenue) + ")"} value={"(" + fmtDollar(p.closingCost) + ")"} />
            <Row label="Net sale proceeds" value={fmtDollar(p.netProceeds)} accent />
            <Row label="Less: total development cost" value={"(" + fmtDollar(p.totalTDC) + ")"} />
            <Row label="Net profit" value={fmtDollar(p.netProfit)} accent />
            <Row label="Profit margin" value={fmtPct(p.profitMargin)} accent />
          </div>
        </section>

        <hr className="gold-rule" />

        {/* ── Waterfall ── */}
        <section>
          <div className="section-label">Investor Returns</div>
          <p className="text-[#8A95A8] text-[14px] mb-8 max-w-2xl">
            {fmtNum(p.holdMonths)}-month hold period ({p.constructionMonths} months construction + {p.absorptionMonths} months absorption).
            All returns flow from current assumptions.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <WaterfallCard title="Option A" tag={"Full Equity"} w={p.optionA} />
            <WaterfallCard title="Option B" tag={fmtPct(p.optionBPref.irr) + " Senior"} w={p.optionBPref} />
            <WaterfallCard title="Option B" tag={"Equity Tranche"} w={p.optionBEquity} />
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-10 pb-20 text-center" style={{ borderTop: "1px solid rgba(201,168,76,0.18)" }}>
          <div className="stat-label mb-2">
            Vantage Point Investments · Trade Point Industrial · Cape Coral, FL
          </div>
          <p className="text-[#8A95A8] text-[11px]">
            Confidential. For qualified investors only. All projections subject to change.
          </p>
        </footer>
      </div>
    </main>
  );
}
