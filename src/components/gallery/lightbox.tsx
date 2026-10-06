"use client";

import Image from "next/image";
import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { m } from "@/components/ui/motion";

export interface LightboxImage {
  src: string;
  alt: string;
  caption?: string;
}

interface LightboxProps {
  images: LightboxImage[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export function Lightbox({ images, index, onClose, onIndexChange }: LightboxProps) {
  const open = index !== null;
  const step = (dir: 1 | -1) => index !== null && onIndexChange((index + dir + images.length) % images.length);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  });

  return (
    <AnimatePresence>
      {open && (
        <m.div
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          className="fixed inset-0 z-[70] flex flex-col bg-black/95"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="flex items-center justify-between gap-4 p-4 text-white">
            <p className="truncate text-sm text-white/80">
              {index + 1} / {images.length}
              {(images[index].caption ?? images[index].alt) && ` · ${images[index].caption ?? images[index].alt}`}
            </p>
            <button type="button" onClick={onClose} autoFocus aria-label="Close" className="grid size-11 shrink-0 place-items-center rounded-full bg-white/10 hover:bg-white/20">
              <X className="size-5" />
            </button>
          </div>
          <div className="relative flex-1" onClick={(e) => e.stopPropagation()}>
            <AnimatePresence mode="wait">
              <m.div
                key={index}
                className="absolute inset-3 sm:inset-12"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Image src={images[index].src} alt={images[index].alt} fill sizes="100vw" className="object-contain" />
              </m.div>
            </AnimatePresence>
            {images.length > 1 && (
              <>
                <button type="button" onClick={() => step(-1)} aria-label="Previous photo" className="absolute top-1/2 left-3 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
                  <ChevronLeft className="size-6" />
                </button>
                <button type="button" onClick={() => step(1)} aria-label="Next photo" className="absolute top-1/2 right-3 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
                  <ChevronRight className="size-6" />
                </button>
              </>
            )}
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
