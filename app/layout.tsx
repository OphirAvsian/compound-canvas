import type { Metadata } from "next";
import "ketcher-react/dist/index.css";
import "molstar/build/viewer/molstar.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Compound Canvas",
  description: "Learn drug discovery by designing molecules and running experiments.",
  applicationName: "Compound Canvas",
  openGraph: {
    title: "Compound Canvas",
    description: "Learn drug discovery by designing molecules and running experiments.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Compound Canvas",
    description: "Learn drug discovery by designing molecules and running experiments.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
