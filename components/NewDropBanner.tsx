import Button from "./Button";
import Icon from "./Icon";
import styles from "./NewDropBanner.module.css";

export default function NewDropBanner() {
  return (
    <section className={`section ${styles.wrap}`}>
      <div className="container">
        <div className={styles.banner}>
          <Icon name="shootingStar" size={40} className={styles.spark} />
          <div className={styles.content}>
            <span className={styles.label}>New drop · Coming soon</span>
            <h2 className={styles.title}>Lantern Festival Series</h2>
            <p className={styles.body}>
              When dusk settles over the hollow, the lanterns wake. Be the first
              to know when this glowing new collection opens its little doors.
            </p>
          </div>
          <Button href="#newsletter" variant="secondary" size="md">
            Notify Me
          </Button>
        </div>
      </div>
    </section>
  );
}
