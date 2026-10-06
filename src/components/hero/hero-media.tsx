"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface HeroMediaProps {
  image: string;
  alt: string;
  video?: string;
}

/**
 * The poster image is always server-rendered and preloaded (fast LCP).
 * A video, if provided, is only attached on wider screens with no data-saver
 * or reduced-motion preference, so mobile visitors from ads never download it.
 */
export function HeroMedia({ image, alt, video }: HeroMediaProps) {
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    if (!video) return;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const ok =
      window.matchMedia("(min-width: 768px)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      !conn?.saveData;
    if (!ok) return;
    const id = requestAnimationFrame(() => setShowVideo(true));
    return () => cancelAnimationFrame(id);
  }, [video]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 animate-ken-burns">
        <Image
          src={image}
          alt={alt}
          fill
          preload
          fetchPriority="high"
          sizes="100vw"
          className="object-cover object-[50%_40%]"
        />
      </div>
      {showVideo && video && (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={video}
          poster={image}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
