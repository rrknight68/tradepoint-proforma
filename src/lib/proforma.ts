// ── Trade Point Flex Industrial Proforma Engine ──────────────────
// Single source of truth. Every displayed number flows from here.
// Zero hardcoded outputs. Pure function, no side effects.

export interface PhaseResult {
  units: number;
  sf: number;
  priceSF: number;
  revenue: number;
  hardCosts: number;
  loanInterest: number;
  origination: number;
  softCosts: number;
  sponsorFees: number;
  tdc: number;
  loan: number;
}

export interface WaterfallResult {
  capital: number;
  pref: number;
  split: number;
  totalReturn: number;
  equityMultiple: number;
  irr: number;
}

export interface ProformaResult {
  // Unit mix
  ph1: PhaseResult;
  ph2a: PhaseResult;
  ph2b: PhaseResult;
  totalUnits: number;
  totalSF: number;
  grossRevenue: number;
  weightedAvgPSF: number;

  // Budget
  totalLand: number;
  totalHard: number;
  totalSoft: number;
  totalSponsor: number;
  totalTDC: number;
  hardCostSF: number;

  // Sales
  brokerCost: number;
  closingCost: number;
  netProceeds: number;
  netProfit: number;
  profitMargin: number;

  // Capital stack
  totalDebt: number;
  totalEquity: number;
  ltc: number;
  ph1NetProceeds: number;
  ph2aEquityReq: number;
  ph2bEquityReq: number;
  ph2Surplus: number;
  totalRaise: number;
  equityGapNew: number;

  // Hold
  constructionMonths: number;
  absorptionMonths: number;
  holdMonths: number;
  holdYears: number;

  // Waterfall
  optionA: WaterfallResult;
  optionBPref: WaterfallResult;
  optionBEquity: WaterfallResult;
  optionBPrefTranche: number;
  optionBEquityTranche: number;
}

function n(a: Record<string, number>, key: string, def: number = 0): number {
  const v = a[key];
  return v !== undefined && !isNaN(v) ? v : def;
}

export function calculateProforma(raw: Record<string, string | number>): ProformaResult {
  // Parse all values to numbers
  const a: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) {
    a[k] = typeof v === "number" ? v : parseFloat(String(v)) || 0;
  }

  // ── Unit mix ──
  const ph1SmallUnits = n(a, "ph1_small_units");
  const ph1SmallSF = n(a, "ph1_small_sf");
  const ph1MidUnits = n(a, "ph1_mid_units");
  const ph1MidSF = n(a, "ph1_mid_sf");
  const ph1LargeUnits = n(a, "ph1_large_units");
  const ph1LargeSF = n(a, "ph1_large_sf");

  const ph2aSmallUnits = n(a, "ph2a_small_units");
  const ph2aSmallSF = n(a, "ph2a_small_sf");
  const ph2aMidUnits = n(a, "ph2a_mid_units");
  const ph2aMidSF = n(a, "ph2a_mid_sf");
  const ph2aLargeUnits = n(a, "ph2a_large_units");
  const ph2aLargeSF = n(a, "ph2a_large_sf");

  const ph2bPremUnits = n(a, "ph2b_premium_units");
  const ph2bPremSF = n(a, "ph2b_premium_sf");

  const ph1Units = ph1SmallUnits + ph1MidUnits + ph1LargeUnits;
  const ph1SF = ph1SmallUnits * ph1SmallSF + ph1MidUnits * ph1MidSF + ph1LargeUnits * ph1LargeSF;

  const ph2aUnits = ph2aSmallUnits + ph2aMidUnits + ph2aLargeUnits;
  const ph2aSF = ph2aSmallUnits * ph2aSmallSF + ph2aMidUnits * ph2aMidSF + ph2aLargeUnits * ph2aLargeSF;

  const ph2bUnits = ph2bPremUnits;
  const ph2bSF = ph2bPremUnits * ph2bPremSF;

  const totalUnits = ph1Units + ph2aUnits + ph2bUnits;
  const totalSF = ph1SF + ph2aSF + ph2bSF;

  // ── Revenue ──
  const ph1PriceSF = n(a, "ph1_price_sf");
  const ph2aPriceSF = n(a, "ph2a_price_sf");
  const ph2bPriceSF = n(a, "ph2b_price_sf");

  const ph1Revenue = ph1SF * ph1PriceSF;
  const ph2aRevenue = ph2aSF * ph2aPriceSF;
  const ph2bRevenue = ph2bSF * ph2bPriceSF;
  const grossRevenue = ph1Revenue + ph2aRevenue + ph2bRevenue;
  const weightedAvgPSF = totalSF > 0 ? grossRevenue / totalSF : 0;

  // ── Construction costs ──
  const hardCostSFVal = n(a, "hard_cost_sf");
  const landCost = n(a, "land_cost");

  const ph1Hard = hardCostSFVal * ph1SF;
  const ph2aHard = hardCostSFVal * ph2aSF;
  const ph2bHard = hardCostSFVal * ph2bSF;

  // ── Financing ──
  const ltc = n(a, "ltc", 0.70);
  const loanRate = n(a, "loan_rate", 0.085);
  const ph1DrawMonths = n(a, "ph1_draw_months", 12);
  const ph2aDrawMonths = n(a, "ph2a_draw_months", 8);
  const ph2bDrawMonths = n(a, "ph2b_draw_months", 5);

  // Loan interest: rate × LTC × (land + hard) × (draw_months/12)
  // Land only in phase 1
  const ph1LoanInterest = loanRate * ltc * (landCost + ph1Hard) * (ph1DrawMonths / 12);
  const ph2aLoanInterest = loanRate * ltc * ph2aHard * (ph2aDrawMonths / 12);
  const ph2bLoanInterest = loanRate * ltc * ph2bHard * (ph2bDrawMonths / 12);

  // Origination: 1.5% × LTC × (land + hard) [land only in ph1]
  const ph1Origination = 0.015 * ltc * (landCost + ph1Hard);
  const ph2aOrigination = 0.015 * ltc * ph2aHard;
  const ph2bOrigination = 0.015 * ltc * ph2bHard;

  // ── Soft costs ──
  const ph1ArchEng = n(a, "arch_eng_ph1", 377078);
  const ph2aArchEng = n(a, "arch_eng_ph2a", 245933);
  const ph2bArchEng = n(a, "arch_eng_ph2b", 102270);

  const ph1Permits = n(a, "permits_ph1", 235674);
  const ph2aPermits = n(a, "permits_ph2a", 153708);
  const ph2bPermits = n(a, "permits_ph2b", 63919);

  const ph1Legal = n(a, "legal_ph1", 45000);
  const ph2aLegal = n(a, "legal_ph2a", 30000);
  const ph2bLegal = n(a, "legal_ph2b", 15000);

  const ph1Enviro = n(a, "enviro_ph1", 35000);
  const ph2aEnviro = n(a, "enviro_ph2a", 20000);
  const ph2bEnviro = n(a, "enviro_ph2b", 10000);

  const ph1Marketing = n(a, "marketing_ph1", 75000);
  const ph2aMarketing = n(a, "marketing_ph2a", 50000);
  const ph2bMarketing = n(a, "marketing_ph2b", 25000);

  const ph1Soft = ph1ArchEng + ph1Permits + ph1Legal + ph1Enviro + ph1Marketing + ph1LoanInterest + ph1Origination;
  const ph2aSoft = ph2aArchEng + ph2aPermits + ph2aLegal + ph2aEnviro + ph2aMarketing + ph2aLoanInterest + ph2aOrigination;
  const ph2bSoft = ph2bArchEng + ph2bPermits + ph2bLegal + ph2bEnviro + ph2bMarketing + ph2bLoanInterest + ph2bOrigination;

  // ── Sponsor fees ──
  const devFeePct = n(a, "dev_fee_pct", 0.02);
  const cmFeePct = n(a, "cm_fee_pct", 0.03);
  const assetMgmtPerMonth = n(a, "asset_mgmt_per_month", 7500);
  const constructionMonths = n(a, "construction_months", 24);
  const absorptionMonths = n(a, "absorption_months", 12);
  const placementFeePct = n(a, "placement_fee_pct", 0.03);
  const cogpEquityRaise = n(a, "cogp_equity_raise", 2500000);

  const assetMgmt = assetMgmtPerMonth * constructionMonths; // ph1 only
  const placementFee = placementFeePct * cogpEquityRaise; // ph1 only

  const ph1SponsorBase = (devFeePct + cmFeePct) * (landCost + ph1Hard + ph1Soft);
  const ph1Sponsor = ph1SponsorBase + assetMgmt + placementFee;
  const ph2aSponsor = (devFeePct + cmFeePct) * (ph2aHard + ph2aSoft);
  const ph2bSponsor = (devFeePct + cmFeePct) * (ph2bHard + ph2bSoft);

  // ── TDC ──
  const ph1TDC = landCost + ph1Hard + ph1Soft + ph1Sponsor;
  const ph2aTDC = ph2aHard + ph2aSoft + ph2aSponsor;
  const ph2bTDC = ph2bHard + ph2bSoft + ph2bSponsor;
  const totalTDC = ph1TDC + ph2aTDC + ph2bTDC;

  // ── Sales / net proceeds ──
  const brokerPct = n(a, "broker_pct", 0.05);
  const closingPct = n(a, "closing_pct", 0.0075);
  const brokerCost = grossRevenue * brokerPct;
  const closingCost = grossRevenue * closingPct;
  const netProceeds = grossRevenue - brokerCost - closingCost;
  const netProfit = netProceeds - totalTDC;
  const profitMargin = grossRevenue > 0 ? netProfit / grossRevenue : 0;

  // ── Capital stack ──
  const ph1Loan = ltc * ph1TDC;
  const ph2aLoan = ltc * ph2aTDC;
  const ph2bLoan = ltc * ph2bTDC;
  const totalDebt = ph1Loan + ph2aLoan + ph2bLoan;
  const totalEquity = totalTDC - totalDebt;

  const ph1NetProceeds = ph1Revenue * (1 - brokerPct - closingPct) - ph1Loan;
  const ph2aEquityReq = (1 - ltc) * ph2aTDC;
  const ph2bEquityReq = (1 - ltc) * ph2bTDC;
  const ph2Surplus = ph1NetProceeds - ph2aEquityReq - ph2bEquityReq;

  const gpEquity = n(a, "gp_equity", 500000);
  const landEquityCredit = n(a, "land_equity_credit", 2003827);
  const equityGapNew = (1 - ltc) * ph1TDC - landEquityCredit - gpEquity;

  const totalRaise = landCost + gpEquity + 180000 + 1599436 + Math.max(0, equityGapNew) + 400000 + 300000 + placementFee;

  // ── Hold period ──
  const holdMonths = constructionMonths + absorptionMonths;
  const holdYears = holdMonths / 12;

  // ── Waterfall ──
  const prefRateSenior = n(a, "pref_rate_senior", 0.13);
  const prefRateEquity = n(a, "pref_rate_equity", 0.10);
  const profitSplitCoGP = n(a, "profit_split_cogp", 0.50);
  const optionBPrefTranche = n(a, "option_b_pref_tranche", 4000000);
  const optionBEquityTranche = Math.max(0, totalRaise - optionBPrefTranche);

  // Option A — full equity
  const optACapital = totalRaise;
  const optAPref = optACapital * prefRateEquity * holdYears;
  const optASplit = Math.max(0, netProfit - optAPref) * profitSplitCoGP;
  const optATotalReturn = optACapital + optAPref + optASplit;
  const optAEM = optACapital > 0 ? optATotalReturn / optACapital : 0;
  const optAIRR = holdYears > 0 && optAEM > 0 ? Math.pow(optAEM, 1 / holdYears) - 1 : 0;

  // Option B — pref tranche (senior debt-like)
  const optBPrefCapital = optionBPrefTranche;
  const optBPrefInterest = optBPrefCapital * prefRateSenior * holdYears;
  const optBPrefTotalReturn = optBPrefCapital + optBPrefInterest;
  const optBPrefEM = optBPrefCapital > 0 ? optBPrefTotalReturn / optBPrefCapital : 0;
  const optBPrefIRR = prefRateSenior; // fixed rate

  // Option B — equity tranche
  const optBEqCapital = optionBEquityTranche;
  const optBEqPref = optBEqCapital * prefRateEquity * holdYears;
  const optBEqSplit = Math.max(0, netProfit - optBPrefInterest - optBEqPref) * profitSplitCoGP;
  const optBEqTotalReturn = optBEqCapital + optBEqPref + optBEqSplit;
  const optBEqEM = optBEqCapital > 0 ? optBEqTotalReturn / optBEqCapital : 0;
  const optBEqIRR = holdYears > 0 && optBEqEM > 0 ? Math.pow(optBEqEM, 1 / holdYears) - 1 : 0;

  // ── Build phase results ──
  const mkPhase = (
    units: number, sf: number, priceSF: number, revenue: number,
    hard: number, loanInt: number, orig: number, soft: number,
    sponsor: number, land: number
  ): PhaseResult => ({
    units, sf, priceSF, revenue, hardCosts: hard,
    loanInterest: loanInt, origination: orig, softCosts: soft,
    sponsorFees: sponsor,
    tdc: land + hard + soft + sponsor,
    loan: ltc * (land + hard + soft + sponsor),
  });

  return {
    ph1: mkPhase(ph1Units, ph1SF, ph1PriceSF, ph1Revenue, ph1Hard, ph1LoanInterest, ph1Origination, ph1Soft, ph1Sponsor, landCost),
    ph2a: mkPhase(ph2aUnits, ph2aSF, ph2aPriceSF, ph2aRevenue, ph2aHard, ph2aLoanInterest, ph2aOrigination, ph2aSoft, ph2aSponsor, 0),
    ph2b: mkPhase(ph2bUnits, ph2bSF, ph2bPriceSF, ph2bRevenue, ph2bHard, ph2bLoanInterest, ph2bOrigination, ph2bSoft, ph2bSponsor, 0),
    totalUnits, totalSF, grossRevenue, weightedAvgPSF,
    totalLand: landCost,
    totalHard: ph1Hard + ph2aHard + ph2bHard,
    totalSoft: ph1Soft + ph2aSoft + ph2bSoft,
    totalSponsor: ph1Sponsor + ph2aSponsor + ph2bSponsor,
    totalTDC, hardCostSF: hardCostSFVal,
    brokerCost, closingCost, netProceeds, netProfit, profitMargin,
    totalDebt, totalEquity, ltc,
    ph1NetProceeds, ph2aEquityReq, ph2bEquityReq, ph2Surplus, totalRaise, equityGapNew,
    constructionMonths, absorptionMonths, holdMonths, holdYears,
    optionA: { capital: optACapital, pref: optAPref, split: optASplit, totalReturn: optATotalReturn, equityMultiple: optAEM, irr: optAIRR },
    optionBPref: { capital: optBPrefCapital, pref: optBPrefInterest, split: 0, totalReturn: optBPrefTotalReturn, equityMultiple: optBPrefEM, irr: optBPrefIRR },
    optionBEquity: { capital: optBEqCapital, pref: optBEqPref, split: optBEqSplit, totalReturn: optBEqTotalReturn, equityMultiple: optBEqEM, irr: optBEqIRR },
    optionBPrefTranche, optionBEquityTranche,
  };
}

/** All assumption keys with default values */
export const DEFAULT_ASSUMPTIONS: Record<string, number> = {
  ph1_price_sf: 350, ph2a_price_sf: 357.5, ph2b_price_sf: 367.5,
  ph1_small_units: 8, ph1_small_sf: 2000,
  ph1_mid_units: 8, ph1_mid_sf: 2400,
  ph1_large_units: 4, ph1_large_sf: 3972,
  ph2a_small_units: 4, ph2a_small_sf: 1750,
  ph2a_mid_units: 8, ph2a_mid_sf: 2415,
  ph2a_large_units: 2, ph2a_large_sf: 3500,
  ph2b_premium_units: 4, ph2b_premium_sf: 3464,
  hard_cost_sf: 155, land_cost: 2343051, land_appraised: 4500000,
  ltc: 0.70, loan_rate: 0.085,
  ph1_draw_months: 12, ph2a_draw_months: 8, ph2b_draw_months: 5,
  broker_pct: 0.05, closing_pct: 0.0075, absorption_rate: 2,
  construction_months: 24, absorption_months: 12,
  dev_fee_pct: 0.02, cm_fee_pct: 0.03,
  asset_mgmt_per_month: 7500, placement_fee_pct: 0.03,
  cogp_equity_raise: 2500000, gp_equity: 500000, land_equity_credit: 2003827,
  pref_rate_senior: 0.13, pref_rate_equity: 0.10,
  profit_split_cogp: 0.50, option_b_pref_tranche: 4000000,
  arch_eng_ph1: 377078, arch_eng_ph2a: 245933, arch_eng_ph2b: 102270,
  permits_ph1: 235674, permits_ph2a: 153708, permits_ph2b: 63919,
  legal_ph1: 45000, legal_ph2a: 30000, legal_ph2b: 15000,
  enviro_ph1: 35000, enviro_ph2a: 20000, enviro_ph2b: 10000,
  marketing_ph1: 75000, marketing_ph2a: 50000, marketing_ph2b: 25000,
};
