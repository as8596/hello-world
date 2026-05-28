"use client";

import { useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useUI } from "@/context/UIContext";
import { formatPrice } from "@/lib/format";
import Button from "./Button";
import Icon from "./Icon";
import PlaceholderImage from "./PlaceholderImage";
import styles from "./CartDrawer.module.css";

export default function CartDrawer() {
  const { items, subtotalCents, setQty, removeItem, clear } = useCart();
  const { cartOpen, closeCart } = useUI();

  useEffect(() => {
    if (!cartOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [cartOpen, closeCart]);

  return (
    <>
      <div
        className={`${styles.overlay} ${cartOpen ? styles.open : ""}`}
        onClick={closeCart}
        aria-hidden
      />
      <aside
        className={`${styles.drawer} ${cartOpen ? styles.open : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Your cart"
        aria-hidden={!cartOpen}
      >
        <header className={styles.head}>
          <h2 className={styles.title}>Your Hollow</h2>
          <button
            type="button"
            className={styles.close}
            onClick={closeCart}
            aria-label="Close cart"
          >
            <Icon name="close" size={20} />
          </button>
        </header>

        {items.length === 0 ? (
          <div className={styles.empty}>
            <Icon name="jar" size={48} />
            <p>Your cart is empty.</p>
            <span>Open a box and start your little collection.</span>
          </div>
        ) : (
          <>
            <ul className={styles.items}>
              {items.map(({ product, qty }) => (
                <li key={product.id} className={styles.item}>
                  <div className={styles.thumb}>
                    <PlaceholderImage
                      gradient={product.gradient}
                      label={product.theme}
                      icon={product.icon}
                      imageSrc={product.imageSrc}
                      alt={product.name}
                    />
                  </div>
                  <div className={styles.info}>
                    <p className={styles.itemName}>{product.name}</p>
                    <p className={styles.itemPrice}>
                      {formatPrice(product.priceCents)}
                    </p>
                    <div className={styles.qty}>
                      <button
                        type="button"
                        onClick={() => setQty(product.id, qty - 1)}
                        aria-label={`Decrease ${product.name} quantity`}
                      >
                        <Icon name="minus" size={14} />
                      </button>
                      <span aria-live="polite">{qty}</span>
                      <button
                        type="button"
                        onClick={() => setQty(product.id, qty + 1)}
                        aria-label={`Increase ${product.name} quantity`}
                      >
                        <Icon name="plus" size={14} />
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.remove}
                    onClick={() => removeItem(product.id)}
                    aria-label={`Remove ${product.name}`}
                  >
                    <Icon name="close" size={16} />
                  </button>
                </li>
              ))}
            </ul>

            <footer className={styles.foot}>
              <div className={styles.subtotal}>
                <span>Subtotal</span>
                <strong>{formatPrice(subtotalCents)}</strong>
              </div>
              <Button variant="primary" size="md" fullWidth disabled title="Checkout coming soon">
                Checkout — Coming Soon
              </Button>
              <button type="button" className={styles.clear} onClick={clear}>
                Clear cart
              </button>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}
