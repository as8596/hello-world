"use client";

import { useEffect, useRef } from "react";
import { useUI } from "@/context/UIContext";
import { formatPrice } from "@/lib/format";
import PlaceholderImage from "./PlaceholderImage";
import AddToCartButton from "./AddToCartButton";
import Icon from "./Icon";
import styles from "./QuickViewModal.module.css";

export default function QuickViewModal() {
  const { quickView, closeQuickView } = useUI();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (quickView && !dialog.open) {
      dialog.showModal();
    } else if (!quickView && dialog.open) {
      dialog.close();
    }
  }, [quickView]);

  // Close on backdrop click (the dialog element fills the viewport behind content).
  function handleClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) closeQuickView();
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      onClose={closeQuickView}
      onClick={handleClick}
      aria-label={quickView ? `${quickView.name} details` : undefined}
    >
      {quickView && (
        <div className={styles.inner}>
          <button
            type="button"
            className={styles.close}
            onClick={closeQuickView}
            aria-label="Close quick view"
          >
            <Icon name="close" size={20} />
          </button>

          <div className={styles.media}>
            <PlaceholderImage
              gradient={quickView.gradient}
              label={quickView.theme}
              icon={quickView.icon}
              imageSrc={quickView.imageSrc}
              alt={`${quickView.name} artwork`}
              size="feature"
            />
          </div>

          <div className={styles.content}>
            {quickView.isBlindBox && (
              <span className={styles.tag}>Blind Box Series</span>
            )}
            <h2 className={styles.name}>{quickView.name}</h2>
            <p className={styles.price}>{formatPrice(quickView.priceCents)}</p>
            <p className={styles.blurb}>{quickView.blurb}</p>
            {quickView.isBlindBox && quickView.figureCount && (
              <p className={styles.detail}>
                <Icon name="star" size={16} /> {quickView.figureCount} figures to
                collect, including one rare secret.
              </p>
            )}
            <div className={styles.actions}>
              <AddToCartButton product={quickView} size="md" variant="primary" fullWidth />
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
