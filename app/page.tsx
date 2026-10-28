import type { Metadata } from "next";
import LandingPage from "@/components/landing";
import "./landing.css";

export const metadata: Metadata = {
  title: "PageFix AI — Commerce Intelligence & Remediation for Sellers",
  description: "Inspect product pages, offers and ad-to-page journeys. Find evidence-backed issues, get practical fixes and verify changes without invented performance claims.",
  openGraph: {
    title: "PageFix AI — Find it. Fix it. Verify it.",
    description: "Seller-first commerce intelligence for product pages, buying journeys and evidence-led remediation.",
    type: "website",
  },
};

export default function HomePage() {
  return <LandingPage />;
}
