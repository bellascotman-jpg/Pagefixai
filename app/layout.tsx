import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PageFix AI — Find what's getting in the way of the sale.",
  description: "Evidence-driven ecommerce purchase-friction intelligence.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
