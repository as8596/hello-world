"use client";

import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { useUI } from "@/context/UIContext";
import PlaceholderImage from "./PlaceholderImage";
import AddToCartButton from "./AddToCartButton";
import styles from "./ProductCard.module.css";

export default function ProductCard({ product }: { product: Product }) {
  const { openQuickView } = useUI();

  return (
    <article className={styles.card}>
      <button
        type="button"
        className={styles.media}
        onClick={() => openQuickView(product)}
        aria-label={`Quick view ${product.name}`}
      >
        {product.isBlindBox && <span className={styles.badge}>Blind Box</span>}
        <PlaceholderImage
          gradient={product.gradient}
          label={product.theme}
          icon={product.icon}
          imageSrc={product.imageSrc}
          alt={`${product.name} — ${product.theme} placeholder artwork`}
        />
        <span className={styles.quickHint}>Quick view</span>
      </button>

      <div className={styles.body}>
        <h3 className={styles.name}>{product.name}</h3>
        <p className={styles.meta}>
          {product.isBlindBox && product.figureCount
            ? `${product.figureCount} to collect · 1 mystery figure`
            : product.theme}
        </p>
        <div className={styles.footer}>
          <span className={styles.price}>{formatPrice(product.priceCents)}</span>
          <AddToCartButton product={product} />
        </div>
      </div>
    </article>
  );
}
