import type { AnchorHTMLAttributes, ReactNode } from "react";

type LinkHref = string | URL | { pathname?: string };

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: LinkHref;
  children?: ReactNode;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  locale?: string | false;
};

function toHref(href: LinkHref) {
  if (typeof href === "string") return href;
  if (href instanceof URL) return href.toString();
  return href.pathname ?? "#";
}

export default function Link({
  href,
  children,
  prefetch: _prefetch,
  replace: _replace,
  scroll: _scroll,
  shallow: _shallow,
  locale: _locale,
  ...props
}: LinkProps) {
  return (
    <a href={toHref(href)} {...props}>
      {children}
    </a>
  );
}
