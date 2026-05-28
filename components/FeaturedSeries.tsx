import { series } from "@/lib/products";
import ProductCard from "./ProductCard";
import styles from "./Grid.module.css";

export default function FeaturedSeries() {
  return (
    <section id="series" className="section">
      <div className="container">
        <header className="sectionHead center">
          <span className="eyebrow">Featured Series</span>
          <h2 className="sectionTitle">Discover Our Little Worlds</h2>
          <p className="sectionIntro">
            Each blind box invites you into a tiny story — to be discovered,
            cherished, and collected. Open one and meet whoever&apos;s waiting inside.
          </p>
        </header>

        <div className={styles.grid}>
          {series.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
