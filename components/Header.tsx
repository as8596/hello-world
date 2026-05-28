"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { useUI } from "@/context/UIContext";
import Icon from "./Icon";
import styles from "./Header.module.css";

const navLinks = [
  { href: "#series", label: "Series" },
  { href: "#how", label: "How It Works" },
  { href: "#shop", label: "Shop" },
  { href: "#about", label: "About" },
  { href: "#newsletter", label: "Newsletter" },
];

export default function Header() {
  const { count, mounted } = useCart();
  const { openCart } = useUI();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
      <div className={`container ${styles.bar}`}>
        <a href="#top" className={styles.logo}>
          <Icon name="leaf" size={24} className={styles.logoMark} />
          <span className={styles.logoText}>Little Hollow</span>
        </a>

        <nav className={styles.nav} aria-label="Primary">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className={styles.navLink}>
              {link.label}
            </a>
          ))}
        </nav>

        <button
          type="button"
          className={styles.cart}
          onClick={openCart}
          aria-label={`Open cart${mounted && count > 0 ? `, ${count} item${count === 1 ? "" : "s"}` : ""}`}
        >
          <Icon name="cart" size={22} />
          {mounted && count > 0 && <span className={styles.badge}>{count}</span>}
        </button>
      </div>
    </header>
  );
}
