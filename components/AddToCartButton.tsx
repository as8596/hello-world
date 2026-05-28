"use client";

import { useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/types";
import { useCart } from "@/context/CartContext";
import Button from "./Button";
import Icon from "./Icon";

interface AddToCartButtonProps {
  product: Product;
  size?: "sm" | "md";
  fullWidth?: boolean;
  variant?: "primary" | "secondary";
}

export default function AddToCartButton({
  product,
  size = "sm",
  fullWidth,
  variant = "primary",
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function handleClick() {
    addItem(product);
    setAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1300);
  }

  return (
    <Button
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      onClick={handleClick}
      aria-label={`Add ${product.name} to cart`}
    >
      <Icon name={added ? "check" : "cart"} size={17} />
      {added ? "Added" : "Add to Cart"}
    </Button>
  );
}
