"use client";

import { useEffect, useRef, useState } from "react";
import { CircleDollarSign } from "lucide-react";

/**
 * The app icon: shows the uploaded image from /api/logo when one exists,
 * otherwise falls back to the default badge. `bump` busts the browser cache
 * after a new upload.
 */
export function AppLogo({ size = 36, bump = 0 }: { size?: number; bump?: number }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // The 404 can arrive before hydration, so onError alone can miss it.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed) {
    return (
      <span
        className="flex items-center justify-center rounded-xl bg-primary text-primary-foreground"
        style={{ width: size, height: size }}
      >
        <CircleDollarSign style={{ width: size * 0.55, height: size * 0.55 }} />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={`/api/logo?v=${bump}`}
      alt=""
      width={size}
      height={size}
      className="rounded-xl object-cover"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );
}
