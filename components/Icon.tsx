import type { IconName } from "@/lib/types";

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  title?: string;
}

const paths: Record<IconName, React.ReactNode> = {
  leaf: (
    <path d="M5 19c0-7 5-13 14-14 0 9-5 14-14 14Zm0 0c2.5-4 5.5-6.5 9-8" />
  ),
  mushroom: (
    <>
      <path d="M4 11a8 8 0 0 1 16 0c0 1-.8 1.6-2 1.6H6c-1.2 0-2-.6-2-1.6Z" />
      <path d="M10 12.6c0 3 .4 5.4-1 7.4h6c-1.4-2-1-4.4-1-7.4" />
    </>
  ),
  lantern: (
    <>
      <path d="M9 3h6M12 3v2" />
      <rect x="7" y="5" width="10" height="14" rx="3" />
      <path d="M7 9h10M9 19v2h6v-2" />
    </>
  ),
  star: (
    <path d="M12 3.5l2.4 5.2 5.6.6-4.2 3.8 1.2 5.6L12 16.9l-5 1.8 1.2-5.6L4 9.3l5.6-.6L12 3.5Z" />
  ),
  shootingStar: (
    <>
      <path d="M14 4.5l1.6 3.4 3.7.4-2.8 2.5.8 3.7L14 12.6l-3.3 1.9.8-3.7L8.7 8.3l3.7-.4L14 4.5Z" />
      <path d="M3 21c2-2.5 4-4.5 6.5-6" />
    </>
  ),
  jar: (
    <>
      <path d="M8 3h8M9 3v2.5c0 .7-.4 1.2-1 1.7C6.8 8 6 9.3 6 11v7a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-7c0-1.7-.8-3-2-3.8-.6-.5-1-1-1-1.7V3" />
      <path d="M6 13h12" />
    </>
  ),
  envelope: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M4 7l8 6 8-6" />
    </>
  ),
  paw: (
    <>
      <circle cx="7" cy="9" r="1.6" />
      <circle cx="12" cy="7" r="1.6" />
      <circle cx="17" cy="9" r="1.6" />
      <path d="M12 12c-2.8 0-5 1.9-5 4.2C7 18 8.4 19 10 19h4c1.6 0 3-1 3-2.8C17 13.9 14.8 12 12 12Z" />
    </>
  ),
  sprig: (
    <>
      <path d="M12 21V7" />
      <path d="M12 12c-2.8 0-4.5-1.5-5-4 2.8-.3 4.5.8 5 4Z" />
      <path d="M12 9c2.8 0 4.5-1.5 5-4-2.8-.3-4.5.8-5 4Z" />
    </>
  ),
  cart: (
    <>
      <path d="M3 4h2l2.2 11.2a1.5 1.5 0 0 0 1.5 1.2h8.1a1.5 1.5 0 0 0 1.5-1.2L20 7H6" />
      <circle cx="9.5" cy="20" r="1.3" />
      <circle cx="17.5" cy="20" r="1.3" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
};

export default function Icon({ name, size = 22, className, title }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      {paths[name]}
    </svg>
  );
}
