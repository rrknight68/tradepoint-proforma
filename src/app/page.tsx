import { calculateProforma, DEFAULT_ASSUMPTIONS } from "@/lib/proforma";
import { getAssumptions } from "@/lib/supabase";
import { fmtDollar, fmtDollarFull, fmtPct, fmtSF, fmtMultiple, fmtNum } from "@/lib/fmt";

export const dynamic = "force-dynamic";

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between items-baseline py-[10px]" style={{ borderBottom: "1px solid rgba(201,168,76,0.08)" }}>
      <span className="text-[13px] text-[#8A95A8]">{label}</span>
      <span className={`mono text-[13px] ${accent ? "text-[#C9A84C]" : "text-[#F0EDE5]"}`}>{value}</span>
    </div>
  );
}

export default async function InvestorPage() {
  let assumptions: Record<string, string> = {};
  try {
    assumptions = await getAssumptions();
  } catch {
    // Fall back to defaults
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
        <div className="max-w-5xl mx-auto px-8 py-12">
          <div className="stat-label mb-4">Vantage Point Investments</div>
          <h1 className="display text-[44px] leading-[1.1] mb-3">Trade Point Industrial</h1>
          <p className="text-[#8A95A8] text-[15px]">
            {fmtNum(p.totalSF)} SF · {p.totalUnits} Units · 3 Buildings · Cape Coral, Florida
          </p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-8 py-16">

        {/* ── Hero Stats ── */}
        <section className="mb-20">
          <div className="grid grid-cols-4 gap-0" style={{ border: "1px solid rgba(201,168,76,0.18)", borderRadius: "2px" }}>
            {[
              { label: "Gross Revenue", value: fmtDollar(p.grossRevenue), sub: fmtDollarFull(Math.round(p.weightedAvgPSF)) + " / SF" },
              { label: "Total Dev Cost", value: fmtDollar(p.totalTDC), sub: fmtDollarFull(Math.round(p.totalTDC / p.totalSF)) + " / SF" },
              { label: "Net Profit", value: fmtDollar(p.netProfit), sub: fmtPct(p.profitMargin) + " margin" },
              { label: "Equity Raise", value: fmtDollar(p.totalRaise), sub: fmtPct(p.ltc) + " LTC" },
            ].map((s, i) => (
              <div key={s.label} className="py-8 px-6 text-center" style={{ borderRight: i < 3 ? "1px solid rgba(201,168,76,0.18)" : "none" }}>
                <div className="stat-label mb-3">{s.label}</div>
                <div className="display text-[32px]">{s.value}</div>
                <div className="text-[11px] text-[#8A95A8] mt-2">{s.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Unit Mix ── */}
        <section className="mb-20">
          <div className="section-label">Unit Mix by Phase</div>
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(201,168,76,0.25)" }}>
                <th className="stat-label text-left py-3 pr-4"></th>
                {["Phase 1", "Phase 2A", "Phase 2B", "Total"].map(h => (
                  <th key={h} className="stat-label text-right py-3 px-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {[
                { label: "Units", vals: [p.ph1.units, p.ph2a.units, p.ph2b.units, p.totalUnits] },
                { label: "Square feet", vals: [p.ph1.sf, p.ph2a.sf, p.ph2b.sf, p.totalSF], fmt: "sf" },
                { label: "Sale price / SF", vals: [p.ph1.priceSF, p.ph2a.priceSF, p.ph2b.priceSF, p.weightedAvgPSF], fmt: "$" },
                { label: "Gross revenue", vals: [p.ph1.revenue, p.ph2a.revenue, p.ph2b.revenue, p.grossRevenue], fmt: "dollar", accent: true },
                { label: "Total dev cost", vals: [p.ph1.tdc, p.ph2a.tdc, p.ph2b.tdc, p.totalTDC], fmt: "dollar" },
                { label: "Net profit", vals: [p.ph1.revenue - p.ph1.tdc, p.ph2a.revenue - p.ph2a.tdc, p.ph2b.revenue - p.ph2b.tdc, p.grossRevenue - p.totalTDC], fmt: "dollar", accent: true },
                { label: "Profit margin", vals: [p.ph1.revenue > 0 ? (p.ph1.revenue - p.ph1.tdc) / p.ph1.revenue : 0, p.ph2a.revenue > 0 ? (p.ph2a.revenue - p.ph2a.tdc) / p.ph2a.revenue : 0, p.ph2b.revenue > 0 ? (p.ph2b.revenue - p.ph2b.tdc) / p.ph2b.revenue : 0, p.grossRevenue > 0 ? (p.grossRevenue - p.totalTDC) / p.grossRevenue : 0], fmt: "pct", accent: true },
              ].map(row => (
                <tr key={row.label} style={{ borderBottom: "1px solid rgba(201,168,76,0.08)" }}>
                  <td className={`py-3 pr-4 ${row.accent ? "text-[#C9A84C]" : "text-[#8A95A8]"}`}>{row.label}</td>
                  {row.vals.map((v, i) => (
                    <td key={i} className={`mono text-right py-3 px-4 ${row.accent ? "text-[#C9A84C]" : "text-[#F0EDE5]"}`}>
                      {row.fmt === "pct" ? fmtPct(v) : row.fmt === "sf" ? fmtNum(v) : row.fmt === "$" ? fmtDollarFull(Math.round(v)) : row.fmt === "dollar" ? fmtDollar(v) : String(v)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <hr className="gold-rule mb-20" />

        {/* ── Development Budget ── */}
        <section className="mb-20">
          <div className="section-label">Development Budget</div>
          <div className="grid grid-cols-2 gap-16">
            <div>
              <div className="stat-label mb-4">Cost Summary</div>
              <Row label="Land" value={fmtDollar(p.totalLand)} />
              <Row label={"Hard costs (" + fmtDollarFull(p.hardCostSF) + " / SF)"} value={fmtDollar(p.totalHard)} />
              <Row label="Soft costs" value={fmtDollar(p.totalSoft)} />
              <Row label="Sponsor fees" value={fmtDollar(p.totalSponsor)} />
              <Row label="Total development cost" value={fmtDollar(p.totalTDC)} accent />
            </div>
            <div>
              <div className="stat-label mb-4">Capital Stack</div>
              <Row label={"Senior debt (" + fmtPct(p.ltc) + " LTC)"} value={fmtDollar(p.totalDebt)} />
              <Row label="Total equity required" value={fmtDollar(p.totalEquity)} />
              <Row label="Total development cost" value={fmtDollar(p.totalTDC)} accent />
              <div className="mt-6 pt-6" style={{ borderTop: "1px solid rgba(201,168,76,0.18)" }}>
                <Row label="Phase 1 net sale proceeds" value={fmtDollar(p.ph1NetProceeds)} />
                <Row label="Phase 2A equity need" value={fmtDollar(p.ph2aEquityReq)} />
                <Row label="Phase 2B equity need" value={fmtDollar(p.ph2bEquityReq)} />
                <Row label="Phase 2 surplus / (gap)" value={fmtDollar(p.ph2Surplus)} accent />
              </div>
            </div>
          </div>
        </section>

        <hr className="gold-rule mb-20" />

        {/* ── Sales & Net Proceeds ── */}
        <section className="mb-20">
          <div className="section-label">Sales &amp; Net Proceeds</div>
          <div className="max-w-lg">
            <Row label="Gross revenue" value={fmtDollar(p.grossRevenue)} />
            <Row label={"Broker commission (" + fmtPct(p.brokerCost / p.grossRevenue) + ")"} value={"(" + fmtDollar(p.brokerCost) + ")"} />
            <Row label={"Closing costs (" + fmtPct(p.closingCost / p.grossRevenue) + ")"} value={"(" + fmtDollar(p.closingCost) + ")"} />
            <Row label="Net sale proceeds" value={fmtDollar(p.netProceeds)} accent />
            <Row label="Less: total development cost" value={"(" + fmtDollar(p.totalTDC) + ")"} />
            <Row label="Net profit" value={fmtDollar(p.netProfit)} accent />
            <Row label="Profit margin" value={fmtPct(p.profitMargin)} accent />
          </div>
        </section>

        <hr className="gold-rule mb-20" />

        {/* ── Investor Returns ── */}
        <section className="mb-20">
          <div className="section-label">Investor Returns</div>
          <p className="text-[#8A95A8] text-[13px] mb-10">
            {fmtNum(p.holdMonths)}-month hold ({p.constructionMonths} months construction + {p.absorptionMonths} months absorption)
          </p>

          {/* Returns table */}
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(201,168,76,0.25)" }}>
                <th className="stat-label text-left py-3 pr-4"></th>
                <th className="text-center py-3 px-6">
                  <div className="display-gold text-[18px]">Option A</div>
                  <div className="stat-label mt-1">Full Equity</div>
                </th>
                <th className="text-center py-3 px-6" style={{ borderLeft: "1px solid rgba(201,168,76,0.18)" }}>
                  <div className="display-gold text-[18px]">Option B</div>
                  <div className="stat-label mt-1">{fmtPct(p.optionBPref.irr)} Senior Pref</div>
                </th>
                <th className="text-center py-3 px-6" style={{ borderLeft: "1px solid rgba(201,168,76,0.18)" }}>
                  <div className="display-gold text-[18px]">Option B</div>
                  <div className="stat-label mt-1">Equity Tranche</div>
                </th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {[
                { label: "Capital invested", vals: [p.optionA.capital, p.optionBPref.capital, p.optionBEquity.capital] },
                { label: "Preferred return", vals: [p.optionA.pref, p.optionBPref.pref, p.optionBEquity.pref] },
                { label: "Profit participation", vals: [p.optionA.split, 0, p.optionBEquity.split] },
                { label: "Total return", vals: [p.optionA.totalReturn, p.optionBPref.totalReturn, p.optionBEquity.totalReturn], accent: true },
              ].map(row => (
                <tr key={row.label} style={{ borderBottom: "1px solid rgba(201,168,76,0.08)" }}>
                  <td className={`py-3 pr-4 ${row.accent ? "text-[#C9A84C]" : "text-[#8A95A8]"}`}>{row.label}</td>
                  {row.vals.map((v, i) => (
                    <td key={i} className={`mono text-center py-3 px-6 ${row.accent ? "text-[#C9A84C]" : "text-[#F0EDE5]"}`} style={i > 0 ? { borderLeft: "1px solid rgba(201,168,76,0.18)" } : {}}>
                      {v === 0 && !row.accent ? "—" : fmtDollar(v)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Hero return metrics */}
          <div className="grid grid-cols-3 gap-0 mt-12" style={{ border: "1px solid rgba(201,168,76,0.18)", borderRadius: "2px" }}>
            {[
              { label: "Option A", sub: "Full Equity", em: p.optionA.equityMultiple, irr: p.optionA.irr },
              { label: "Option B — Pref", sub: fmtPct(p.optionBPref.irr) + " Senior", em: p.optionBPref.equityMultiple, irr: p.optionBPref.irr },
              { label: "Option B — Equity", sub: "Promote Tranche", em: p.optionBEquity.equityMultiple, irr: p.optionBEquity.irr },
            ].map((opt, i) => (
              <div key={opt.label} className="py-10 px-8 text-center" style={{ borderRight: i < 2 ? "1px solid rgba(201,168,76,0.18)" : "none" }}>
                <div className="display-gold text-[16px] mb-1">{opt.label}</div>
                <div className="stat-label mb-6">{opt.sub}</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="stat-label mb-2">Equity Multiple</div>
                    <div className="display text-[48px] leading-[1]">{fmtMultiple(opt.em)}</div>
                  </div>
                  <div>
                    <div className="stat-label mb-2">IRR</div>
                    <div className="display text-[48px] leading-[1]">{fmtPct(opt.irr)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-12 pb-20 text-center" style={{ borderTop: "1px solid rgba(201,168,76,0.18)" }}>
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
