import Icon from "./Icon";
import type { IconName } from "@/lib/types";
import styles from "./BrandValues.module.css";

const values: { icon: IconName; title: string; body: string }[] = [
  { icon: "sprig", title: "Whimsical", body: "Whimsy and imagination in every detail." },
  { icon: "lantern", title: "Heartwarming", body: "Characters and stories that bring comfort and joy." },
  { icon: "leaf", title: "Natural", body: "Inspired by nature, organic shapes, and earth tones." },
  { icon: "jar", title: "Timeless", body: "A nostalgic, storybook feeling that lasts beyond trends." },
  { icon: "star", title: "Collectible", body: "Made to be collected, displayed, and cherished." },
];

export default function BrandValues() {
  return (
    <section id="about" className="section">
      <div className="container">
        <header className="sectionHead center">
          <span className="eyebrow">Our Little World</span>
          <h2 className="sectionTitle">What Little Hollow Stands For</h2>
          <p className="sectionIntro">
            We speak like a friend inviting you into a small world — warm,
            sincere, and full of wonder. These five things guide everything we make.
          </p>
        </header>

        <ul className={styles.grid}>
          {values.map((value) => (
            <li key={value.title} className={styles.card}>
              <span className={styles.icon}>
                <Icon name={value.icon} size={26} />
              </span>
              <h3 className={styles.title}>{value.title}</h3>
              <p className={styles.body}>{value.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
