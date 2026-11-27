import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Preflight",
  description: "Check any Celo agent before you pay it or plug it in.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="wrap">
          <p className="wordmark">
            <Link href="/">Preflight</Link>
          </p>
          {children}
          <footer>Celo mainnet, chain 42220. Checks are read only. Preflight&apos;s own agent writes receipts from its Altana wallet, under a capped key its owner can revoke.</footer>
        </div>
      </body>
    </html>
  );
}
