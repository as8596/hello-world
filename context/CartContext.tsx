"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import type { CartItem, Product } from "@/lib/types";

const STORAGE_KEY = "little-hollow-cart";

type CartState = { items: CartItem[] };

type CartAction =
  | { type: "ADD"; product: Product }
  | { type: "REMOVE"; id: string }
  | { type: "SET_QTY"; id: string; qty: number }
  | { type: "CLEAR" }
  | { type: "HYDRATE"; items: CartItem[] };

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD": {
      const existing = state.items.find((i) => i.product.id === action.product.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product.id === action.product.id ? { ...i, qty: i.qty + 1 } : i,
          ),
        };
      }
      return { items: [...state.items, { product: action.product, qty: 1 }] };
    }
    case "REMOVE":
      return { items: state.items.filter((i) => i.product.id !== action.id) };
    case "SET_QTY": {
      if (action.qty <= 0) {
        return { items: state.items.filter((i) => i.product.id !== action.id) };
      }
      return {
        items: state.items.map((i) =>
          i.product.id === action.id ? { ...i, qty: action.qty } : i,
        ),
      };
    }
    case "CLEAR":
      return { items: [] };
    case "HYDRATE":
      return { items: action.items };
    default:
      return state;
  }
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotalCents: number;
  mounted: boolean;
  addItem: (product: Product) => void;
  removeItem: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [] });
  const [mounted, setMounted] = useState(false);

  // Hydrate from localStorage once, after mount, to avoid SSR mismatch.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const items = JSON.parse(raw) as CartItem[];
        if (Array.isArray(items)) dispatch({ type: "HYDRATE", items });
      }
    } catch {
      /* ignore malformed storage */
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      /* storage unavailable — cart simply won't persist */
    }
  }, [state.items, mounted]);

  const value = useMemo<CartContextValue>(() => {
    const count = state.items.reduce((sum, i) => sum + i.qty, 0);
    const subtotalCents = state.items.reduce(
      (sum, i) => sum + i.qty * i.product.priceCents,
      0,
    );
    return {
      items: state.items,
      count,
      subtotalCents,
      mounted,
      addItem: (product) => dispatch({ type: "ADD", product }),
      removeItem: (id) => dispatch({ type: "REMOVE", id }),
      setQty: (id, qty) => dispatch({ type: "SET_QTY", id, qty }),
      clear: () => dispatch({ type: "CLEAR" }),
    };
  }, [state.items, mounted]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
