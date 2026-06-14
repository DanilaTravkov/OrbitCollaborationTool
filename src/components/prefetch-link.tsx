"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useRoutePrefetch } from "@/lib/route-prefetch";

type PrefetchLinkProps = ComponentProps<typeof Link> & {
  href: string;
};

export function PrefetchLink({ href, onFocus, onMouseEnter, onTouchStart, ...props }: PrefetchLinkProps) {
  const prefetch = useRoutePrefetch(href);

  return (
    <Link
      {...props}
      href={href}
      prefetch
      onMouseEnter={(event) => {
        prefetch();
        onMouseEnter?.(event);
      }}
      onFocus={(event) => {
        prefetch();
        onFocus?.(event);
      }}
      onTouchStart={(event) => {
        prefetch();
        onTouchStart?.(event);
      }}
    />
  );
}
