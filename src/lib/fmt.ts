export function fmtDollar(v: number): string {
  if (Math.abs(v) >= 1_000_000) return "$" + (v / 1_000_000).toFixed(2) + "M";
  return "$" + Math.round(v).toLocaleString("en-US");
}

export function fmtDollarFull(v: number): string {
  return "$" + Math.round(v).toLocaleString("en-US");
}

export function fmtPct(v: number): string {
  return (v * 100).toFixed(1) + "%";
}

export function fmtSF(v: number): string {
  return Math.round(v).toLocaleString("en-US") + " SF";
}

export function fmtMultiple(v: number): string {
  return v.toFixed(2) + "x";
}

export function fmtNum(v: number): string {
  return Math.round(v).toLocaleString("en-US");
}
