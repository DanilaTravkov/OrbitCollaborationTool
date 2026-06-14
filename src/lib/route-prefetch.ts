"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

export function useRoutePrefetch(href: string) {
  const router = useRouter();
  const prefetched = useRef(false);

  return useCallback(() => {
    if (prefetched.current) {
      return;
    }

    prefetched.current = true;
    router.prefetch(href);
  }, [href, router]);
}
