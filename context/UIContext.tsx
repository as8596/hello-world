"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { Product } from "@/lib/types";

interface UIContextValue {
  quickView: Product | null;
  openQuickView: (product: Product) => void;
  closeQuickView: () => void;
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [quickView, setQuickView] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const value = useMemo<UIContextValue>(
    () => ({
      quickView,
      openQuickView: (product) => setQuickView(product),
      closeQuickView: () => setQuickView(null),
      cartOpen,
      openCart: () => setCartOpen(true),
      closeCart: () => setCartOpen(false),
    }),
    [quickView, cartOpen],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within a UIProvider");
  return ctx;
}
