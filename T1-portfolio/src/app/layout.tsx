import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Gulzar Ahmed - Data Scientist & Full-Stack Architect",
  description: "Portfolio of Gulzar Ahmed",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
