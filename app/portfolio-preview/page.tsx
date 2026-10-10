import type { Metadata } from "next";

import { PortfolioHomepage } from "@/components/portfolio-preview/homepage";
import "./portfolio.css";

export const metadata: Metadata = {
  title: "Portfolio Template Preview | MOMENTIS",
  robots: { index: false, follow: false },
};

export default function PortfolioPreviewPage() {
  return <PortfolioHomepage />;
}
