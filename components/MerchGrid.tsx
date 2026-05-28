"use client";

import { useMemo, useState } from "react";
import { merch, merchCategories } from "@/lib/products";
import type { ProductCategory } from "@/lib/types";
import ProductCard from "./ProductCard";
import gridStyles from "./Grid.module.css";
import styles from "./MerchGrid.module.css";

type Filter = ProductCategory | "all";

export default function MerchGrid() {
  const [filter, setFilter] = useState<Filter>("all");

  const visible = useMemo(
    () => (filter === "all" ? merch : merch.filter((p) => p.category === filter)),
    [filter],
  );

  return (
    <section id="shop" className="section">
      <div className="container">
        <header className="sectionHead center">
          <span className="eyebrow">Beyond the Box</span>
          <h2 className="sectionTitle">Merch &amp; Apparel</h2>
          <p className="sectionIntro">
            Carry a little of the hollow with you — soft apparel, everyday
            accessories, and home pieces drawn from the worlds you love.
          </p>
        </header>

        <div className={styles.filters} role="group" aria-label="Filter products by category">
          {merchCategories.map((cat) => (
            <button
              key={cat.value}
              type="button"
              className={`${styles.chip} ${filter === cat.value ? styles.active : ""}`}
              aria-pressed={filter === cat.value}
              onClick={() => setFilter(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className={gridStyles.grid}>
          {visible.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
