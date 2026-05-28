import Icon from "./Icon";
import styles from "./Footer.module.css";

const columns = [
  {
    title: "Collect",
    links: [
      { href: "#series", label: "Blind Box Series" },
      { href: "#shop", label: "Merch & Apparel" },
      { href: "#how", label: "How It Works" },
    ],
  },
  {
    title: "Our World",
    links: [
      { href: "#about", label: "About Little Hollow" },
      { href: "#newsletter", label: "Join the Hollow" },
      { href: "#series", label: "New Drops" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "#", label: "Shipping & Returns" },
      { href: "#", label: "Collector FAQ" },
      { href: "#", label: "Contact Us" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.top}>
          <div className={styles.brand}>
            <a href="#top" className={styles.logo}>
              <Icon name="leaf" size={24} className={styles.logoMark} />
              <span>Little Hollow</span>
            </a>
            <p className={styles.tagline}>Collect Small Worlds</p>
            <div className={styles.socials} aria-label="Social links">
              <a href="#" aria-label="Email"><Icon name="envelope" size={20} /></a>
              <a href="#" aria-label="Favorites"><Icon name="star" size={20} /></a>
              <a href="#" aria-label="Community"><Icon name="paw" size={20} /></a>
            </div>
          </div>

          <nav className={styles.cols} aria-label="Footer">
            {columns.map((col) => (
              <div key={col.title} className={styles.col}>
                <h3 className={styles.colTitle}>{col.title}</h3>
                <ul>
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href}>{link.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className={styles.closing}>
          <p className={`script ${styles.closingLine}`}>
            Thank you for being part of our little world. There&apos;s always
            another story waiting to be discovered in Little Hollow.
          </p>
          <div className="flourish">
            <Icon name="sprig" size={18} />
            <Icon name="star" size={14} />
            <Icon name="sprig" size={18} />
          </div>
        </div>

        <div className={styles.legal}>
          <span>© {new Date().getFullYear()} Little Hollow. Made with wonder.</span>
          <div className={styles.legalLinks}>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
