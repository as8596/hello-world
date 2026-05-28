import type { Metadata } from "next";
import { Fraunces, Nunito, Caveat } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { UIProvider } from "@/context/UIContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import QuickViewModal from "@/components/QuickViewModal";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Little Hollow — Collect Small Worlds",
  description:
    "Little Hollow creates heartwarming collectible blind-box figures, miniatures, and themed merch inspired by nature, nostalgia, and imagination. Cozy worlds. Timeless stories. Tiny wonders.",
  openGraph: {
    title: "Little Hollow — Collect Small Worlds",
    description:
      "Heartwarming collectible blind boxes and themed merch from a cozy little world.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${nunito.variable} ${caveat.variable}`}
    >
      <body>
        <UIProvider>
          <CartProvider>
            <a href="#series" className="visually-hidden">Skip to content</a>
            <Header />
            <main id="top">{children}</main>
            <Footer />
            <CartDrawer />
            <QuickViewModal />
          </CartProvider>
        </UIProvider>
      </body>
    </html>
  );
}
