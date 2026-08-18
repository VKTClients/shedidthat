import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { SiteChrome } from "@/components/layout/SiteChrome";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SheDidThat — Premium Hair Studio",
  description:
    "Book your next hair appointment at SheDidThat. Premium braiding, cornrows, and styling services.",
  keywords: ["hair salon", "braiding", "cornrows", "booking", "South Africa"],
  icons: {
    icon: "/images/logo.png",
    apple: "/images/logo.png",
  },
  openGraph: {
    title: "SheDidThat — Premium Hair Studio",
    description: "Book your next hair appointment at SheDidThat. Premium braiding, cornrows, and styling services.",
    images: [{ url: "/images/logo.png" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans min-h-screen flex flex-col">
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
