"use client";

import { useState } from "react";
import Button from "./Button";
import Icon from "./Icon";
import styles from "./Newsletter.module.css";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <section id="newsletter" className={`section ${styles.wrap}`}>
      <div className="container">
        <div className={styles.panel}>
          <span className={styles.icon}>
            <Icon name="envelope" size={30} />
          </span>
          <h2 className={styles.title}>Join the Hollow</h2>
          <p className={styles.sub}>
            <span className="script">Little notes from a little world</span>
          </p>
          <p className={styles.body}>
            Be first to hear about new series, restocks, and the occasional
            hidden surprise. No noise — just gentle updates.
          </p>

          {submitted ? (
            <p className={styles.success} role="status">
              <Icon name="check" size={20} /> Welcome to our little world. Keep an
              eye on your inbox.
            </p>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="Email address"
                className={styles.input}
              />
              <Button type="submit" size="md">
                Join the Hollow
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
