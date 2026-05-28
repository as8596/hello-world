import Button from "./Button";
import Icon from "./Icon";
import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.copy}>
          <span className="eyebrow">
            <Icon name="sprig" size={16} /> Collectible blind boxes
          </span>
          <h1 className={styles.title}>Collect Small Worlds</h1>
          <p className={styles.tagline}>
            <span className="script">Cozy worlds. Timeless stories. Tiny wonders.</span>
          </p>
          <p className={styles.lede}>
            Little Hollow creates heartwarming collectible figures and miniatures
            inspired by nature, nostalgia, and imagination — small worlds filled
            with wonder, comfort, and a little everyday magic.
          </p>
          <div className={styles.ctas}>
            <Button href="#series" size="md">
              Shop the Series <Icon name="arrow" size={18} />
            </Button>
            <Button href="#how" variant="secondary" size="md">
              How Blind Boxes Work
            </Button>
          </div>
        </div>

        <div className={styles.scene} aria-hidden>
          <div className={styles.hollow}>
            <Icon name="lantern" size={66} className={styles.lantern} />
            <Icon name="mushroom" size={92} className={styles.bigMushroom} />
            <Icon name="leaf" size={40} className={styles.leaf1} />
            <Icon name="leaf" size={28} className={styles.leaf2} />
            <Icon name="star" size={22} className={styles.star1} />
            <Icon name="shootingStar" size={30} className={styles.star2} />
            <Icon name="paw" size={26} className={styles.paw} />
            <span className={styles.tag}>Open a tiny door</span>
          </div>
        </div>
      </div>
    </section>
  );
}
