import Link from "next/link";
import styles from "./Button.module.css";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md";

type BaseProps = {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
};

type ButtonProps = BaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type AnchorProps = BaseProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string };

function classes(variant: Variant, size: Size, fullWidth?: boolean, extra?: string) {
  return [
    styles.btn,
    styles[variant],
    styles[size],
    fullWidth ? styles.full : "",
    extra ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

export default function Button(props: ButtonProps | AnchorProps) {
  const {
    variant = "primary",
    size = "md",
    fullWidth,
    className,
    children,
    ...rest
  } = props;

  const cls = classes(variant, size, fullWidth, className);

  if ("href" in props && props.href !== undefined) {
    const { href, ...anchorRest } = rest as AnchorProps;
    return (
      <Link href={href} className={cls} {...anchorRest}>
        {children}
      </Link>
    );
  }

  return (
    <button className={cls} {...(rest as ButtonProps)}>
      {children}
    </button>
  );
}
