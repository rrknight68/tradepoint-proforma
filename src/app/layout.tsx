import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trade Point Industrial | Flex Condo Proforma",
  description: "98,264 SF · 38 Units · Cape Coral FL — Vantage Point Investments",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
