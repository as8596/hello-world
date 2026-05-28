import Image from "next/image";
import type { IconName } from "@/lib/types";
import Icon from "./Icon";
import styles from "./PlaceholderImage.module.css";

interface PlaceholderImageProps {
  gradient: [string, string];
  label: string;
  icon: IconName;
  /** When provided, a real photo replaces the styled placeholder. */
  imageSrc?: string;
  alt: string;
  /** Larger treatment for the quick-view modal. */
  size?: "card" | "feature";
}

export default function PlaceholderImage({
  gradient,
  label,
  icon,
  imageSrc,
  alt,
  size = "card",
}: PlaceholderImageProps) {
  if (imageSrc) {
    return (
      <div className={`${styles.frame} ${styles[size]}`}>
        <Image
          src={imageSrc}
          alt={alt}
          fill
          sizes="(max-width: 720px) 100vw, 360px"
          style={{ objectFit: "cover" }}
        />
      </div>
    );
  }

  return (
    <div
      className={`${styles.frame} ${styles.placeholder} ${styles[size]}`}
      style={{
        background: `linear-gradient(150deg, ${gradient[0]}, ${gradient[1]})`,
      }}
      role="img"
      aria-label={alt}
    >
      <span className={styles.glow} aria-hidden />
      <Icon name={icon} size={size === "feature" ? 72 : 52} className={styles.mark} />
      <span className={styles.label}>{label}</span>
    </div>
  );
}
