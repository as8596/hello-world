import Icon from "./Icon";
import type { IconName } from "@/lib/types";
import styles from "./HowItWorks.module.css";

const steps: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "leaf",
    title: "Pick a series",
    body: "Choose a little world that speaks to you — woodland friends, glowing lanterns, or starlit wanderers.",
  },
  {
    icon: "mushroom",
    title: "Open your mystery box",
    body: "Every box is a surprise. You won't know which character you've found until you open the tiny door.",
  },
  {
    icon: "star",
    title: "Collect & display the set",
    body: "Gather the whole series — and keep an eye out for the rare secret figure hidden in every collection.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className={`section ${styles.wrap}`}>
      <div className="container">
        <header className="sectionHead center">
          <span className="eyebrow">The Joy of the Box</span>
          <h2 className="sectionTitle">How Blind Boxes Work</h2>
          <p className="sectionIntro">
            Half the magic is not knowing. Here&apos;s how a Little Hollow box
            becomes a collection.
          </p>
        </header>

        <ol className={styles.steps}>
          {steps.map((step, i) => (
            <li key={step.title} className={styles.step}>
              <span className={styles.num}>{i + 1}</span>
              <span className={styles.icon}>
                <Icon name={step.icon} size={30} />
              </span>
              <h3 className={styles.title}>{step.title}</h3>
              <p className={styles.body}>{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
