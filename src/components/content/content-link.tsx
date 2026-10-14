import Link from "next/link";
import type { ReactNode } from "react";

/** A button link from admin content: site paths use client navigation, https links open in a new tab. */
export function ContentLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  if (href.startsWith("/") || href.startsWith("#")) {
    return <Link href={href} className={className}>{children}</Link>;
  }
  if (href.startsWith("https://")) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>;
  }
  return <a href={href} className={className}>{children}</a>;
}
