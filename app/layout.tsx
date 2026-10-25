import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeLoom — teach code, together",
  description: "A live coding classroom designed for serious teaching.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
