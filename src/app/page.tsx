import { calculateProforma, DEFAULT_ASSUMPTIONS } from "@/lib/proforma";
import { getAssumptions } from "@/lib/supabase";
import { fmtDollar, fmtDollarFull, fmtPct, fmtSF, fmtMultiple, fmtNum } from "@/lib/fmt";

export const dynamic = "force-dynamic";

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="metric-card">
      <div className="text-[10px] font-mono tracking-[2px] uppercase text-gold/70 mb-2">{label}</div>
      <div className="font-display text-3xl text-cream">{value}</div>
      {sub && <div className="text-xs text-sand/60 mt-1">{sub}</div>}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between py-2.5 border-b border-navy-light ${bold ? "font-semibold text-gold" : "text-cream/80"}`}>
      <span className="text-sm">{label}</span>
      <span className="font-mono text-sm">{value}</span>
    </div>
  );
}

function WaterfallCard({ title, tag, w }: {
  title: string; tag: string;
  w: { capital: number; pref: number; split: number; totalReturn: number; equityMultiple: number; irr: number };
}) {
  return (
    <div className="metric-card">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="font-display text-xl text-cream">{title}</h3>
        <span className="text-[9px] font-mono tracking-[2px] uppercase bg-gold/10 text-gold px-2 py-0.5 rounded">{tag}</span>
      </div>
      <Row label="Capital invested" value={fmtDollar(w.capital)} />
      <Row label="Preferred return" value={fmtDollar(w.pref)} />
      {w.split > 0 && <Row label="Profit participation" value={fmtDollar(w.split)} />}
      <Row label="Total return" value={fmtDollarFull(w.totalReturn)} bold />
      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-navy-light">
        <div>
          <div className="text-[10px] font-mono tracking-[2px] uppercase text-gold/70 mb-1">Equity Multiple</div>
          <div className="font-display text-2xl text-cream">{fmtMultiple(w.equityMultiple)}</div>
        </div>
        <div>
          <div className="text-[10px] font-mono tracking-[2px] uppercase text-gold/70 mb-1">IRR</div>
          <div className="font-display text-2xl text-cream">{fmtPct(w.irr)}</div>
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

  // Merge defaults for any missing keys
  const merged: Record<string, string> = {};
  for (const [k, v] of Object.entries(DEFAULT_ASSUMPTIONS)) {
    merged[k] = assumptions[k] ?? String(v);
  }

  const p = calculateProforma(merged);

  return (
    <main className="min-h-screen bg-navy">
      {/* Header */}
      <header className="border-b border-navy-light">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-[10px] font-mono tracking-[4px] uppercase text-gold mb-3">
            Vantage Point Investments
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-cream mb-2">
            Trade Point Industrial
          </h1>
          <p className="text-sand/60 text-lg font-light">
            {fmtNum(p.totalSF)} SF · {p.totalUnits} Units · 3 Buildings · Cape Coral, FL
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-16">

        {/* ── Key Metrics ── */}
        <section>
          <div className="section-label">Project Overview</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Metric label="Gross Revenue" value={fmtDollar(p.grossRevenue)} sub={fmtDollarFull(p.weightedAvgPSF) + "/SF avg"} />
            <Metric label="Total Dev Cost" value={fmtDollar(p.totalTDC)} sub={fmtDollarFull(Math.round(p.totalTDC / p.totalSF)) + "/SF all-in"} />
            <Metric label="Net Profit" value={fmtDollar(p.netProfit)} sub={fmtPct(p.profitMargin) + " margin"} />
            <Metric label="Total Equity Raise" value={fmtDollar(p.totalRaise)} sub={fmtPct(p.ltc) + " LTC"} />
          </div>
        </section>

        {/* ── Unit Mix ── */}
        <section>
          <div className="section-label">Unit Mix by Phase</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: "Phase 1", ph: p.ph1 },
              { name: "Phase 2A", ph: p.ph2a },
              { name: "Phase 2B", ph: p.ph2b },
            ].map(({ name, ph }) => (
              <div key={name} className="metric-card">
                <h3 className="font-display text-xl text-cream mb-4">{name}</h3>
                <Row label="Units" value={String(ph.units)} />
                <Row label="Total SF" value={fmtSF(ph.sf)} />
                <Row label="Price / SF" value={fmtDollarFull(ph.priceSF)} />
                <Row label="Gross Revenue" value={fmtDollar(ph.revenue)} bold />
              </div>
            ))}
          </div>
        </section>

        {/* ── Project Budget ── */}
        <section>
          <div className="section-label">Development Budget</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="metric-card">
              <h3 className="font-display text-xl text-cream mb-4">Cost Summary</h3>
              <Row label="Land" value={fmtDollar(p.totalLand)} />
              <Row label={"Hard costs (" + fmtDollarFull(p.hardCostSF) + "/SF)"} value={fmtDollar(p.totalHard)} />
              <Row label="Soft costs" value={fmtDollar(p.totalSoft)} />
              <Row label="Sponsor fees" value={fmtDollar(p.totalSponsor)} />
              <Row label="Total development cost" value={fmtDollar(p.totalTDC)} bold />
            </div>
            <div className="metric-card">
              <h3 className="font-display text-xl text-cream mb-4">Capital Stack</h3>
              <Row label={"Senior debt (" + fmtPct(p.ltc) + " LTC)"} value={fmtDollar(p.totalDebt)} />
              <Row label="Total equity required" value={fmtDollar(p.totalEquity)} />
              <Row label="Total development cost" value={fmtDollar(p.totalTDC)} bold />
              <div className="mt-4 pt-4 border-t border-navy-light">
                <Row label="Ph1 net proceeds" value={fmtDollar(p.ph1NetProceeds)} />
                <Row label="Ph2A equity need" value={fmtDollar(p.ph2aEquityReq)} />
                <Row label="Ph2B equity need" value={fmtDollar(p.ph2bEquityReq)} />
                <Row label="Ph2 surplus / (gap)" value={fmtDollar(p.ph2Surplus)} bold />
              </div>
            </div>
          </div>
        </section>

        {/* ── Sales ── */}
        <section>
          <div className="section-label">Sales &amp; Net Proceeds</div>
          <div className="metric-card max-w-xl">
            <Row label="Gross revenue" value={fmtDollar(p.grossRevenue)} />
            <Row label={"Broker commission (" + fmtPct(p.brokerCost / p.grossRevenue) + ")"} value={"(" + fmtDollar(p.brokerCost) + ")"} />
            <Row label={"Closing costs (" + fmtPct(p.closingCost / p.grossRevenue) + ")"} value={"(" + fmtDollar(p.closingCost) + ")"} />
            <Row label="Net sale proceeds" value={fmtDollar(p.netProceeds)} bold />
            <Row label="Less: total development cost" value={"(" + fmtDollar(p.totalTDC) + ")"} />
            <Row label="Net profit" value={fmtDollar(p.netProfit)} bold />
            <Row label="Profit margin" value={fmtPct(p.profitMargin)} bold />
          </div>
        </section>

        {/* ── Waterfall ── */}
        <section>
          <div className="section-label">Investor Returns — Waterfall Analysis</div>
          <p className="text-sand/60 text-sm mb-6 max-w-2xl">
            {fmtNum(p.holdMonths)}-month hold ({p.constructionMonths}mo construction + {p.absorptionMonths}mo absorption).
            All returns calculated from current assumptions.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <WaterfallCard title="Option A" tag="Full Equity" w={p.optionA} />
            <WaterfallCard title="Option B — Pref" tag={"Senior " + fmtPct(p.optionBPref.irr)} w={p.optionBPref} />
            <WaterfallCard title="Option B — Equity" tag="Promote" w={p.optionBEquity} />
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-navy-light pt-8 pb-16 text-center">
          <div className="font-mono text-[10px] tracking-[3px] uppercase text-gold/40">
            Vantage Point Investments · Trade Point Industrial · Cape Coral FL
          </div>
          <p className="text-sand/30 text-xs mt-2">
            Confidential. For qualified investors only. All projections subject to change.
          </p>
        </footer>
      </div>
    </main>
  );
}
