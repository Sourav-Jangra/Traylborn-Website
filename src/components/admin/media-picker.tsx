"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Film, ImageIcon, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { adminButton } from "./admin-ui";
import { cn } from "@/lib/utils";

export interface MediaOption {
  id: number;
  src: string;
  alt: string;
  label: string;
  resourceType: "image" | "video";
}

export function MediaThumb({ item, sizes = "160px", className }: { item: MediaOption; sizes?: string; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden bg-sand-100", className)}>
      {item.resourceType === "image" ? (
        <Image src={item.src} alt={item.alt} fill sizes={sizes} className="object-cover" />
      ) : (
        <>
          <video src={item.src} muted playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover" aria-hidden="true" />
          <Film className="absolute right-2 bottom-2 size-4 text-white drop-shadow" aria-hidden="true" />
        </>
      )}
    </div>
  );
}

/** Dialog listing the media library, filtered to images or videos. */
export function MediaPickerDialog({
  open,
  onOpenChange,
  media,
  type,
  onPick,
  exclude = [],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  media: MediaOption[];
  type: "image" | "video";
  onPick: (item: MediaOption) => void;
  exclude?: string[];
}) {
  const items = media.filter((m) => m.resourceType === type && !exclude.includes(m.src));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Choose {type === "image" ? "an image" : "a video"}</DialogTitle>
          <DialogDescription>
            From the media library. To add new files, go to{" "}
            <Link href="/admin/media" className="font-semibold underline underline-offset-2">Media</Link>.
          </DialogDescription>
        </DialogHeader>
        {items.length === 0 ? (
          <p className="rounded-xl bg-sand-50 p-6 text-center text-sm text-muted-foreground">
            No {type === "image" ? "images" : "videos"} available yet. Add some on the Media page first.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    onPick(item);
                    onOpenChange(false);
                  }}
                  className="group block w-full overflow-hidden rounded-xl text-left ring-1 ring-black/5 hover:ring-2 hover:ring-pine-600 focus-visible:ring-2 focus-visible:ring-pine-600"
                >
                  <MediaThumb item={item} className="aspect-[4/3]" />
                  <span className="block truncate px-2.5 py-2 text-xs font-medium">{item.label || item.src.split("/").pop()}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** A form field holding one media id. */
export function MediaField({
  media,
  type,
  value,
  onChange,
  required,
}: {
  media: MediaOption[];
  type: "image" | "video";
  value: number | null;
  onChange: (id: number | null) => void;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = value == null ? undefined : media.find((m) => m.id === value);
  return (
    <div className="flex items-center gap-3">
      {selected ? (
        <MediaThumb item={selected} className="aspect-[4/3] w-28 shrink-0 rounded-xl" sizes="112px" />
      ) : (
        <div className="grid aspect-[4/3] w-28 shrink-0 place-items-center rounded-xl border-2 border-dashed border-border text-muted-foreground">
          {type === "image" ? <ImageIcon className="size-5" aria-hidden="true" /> : <Film className="size-5" aria-hidden="true" />}
        </div>
      )}
      <div className="flex min-w-0 flex-col items-start gap-1.5">
        {selected && <span className="max-w-full truncate text-xs text-muted-foreground">{selected.label || selected.src}</span>}
        {value != null && !selected && <span className="text-xs text-destructive">This media item was removed. Choose another.</span>}
        <div className="flex gap-2">
          <button type="button" onClick={() => setOpen(true)} className={cn(adminButton.secondary, "h-9")}>
            {selected ? "Change" : "Choose"}
          </button>
          {value != null && !required && (
            <button type="button" onClick={() => onChange(null)} className={cn(adminButton.ghost, "h-9")}>
              <X className="size-3.5" /> Remove
            </button>
          )}
        </div>
      </div>
      <MediaPickerDialog open={open} onOpenChange={setOpen} media={media} type={type} onPick={(m) => onChange(m.id)} />
    </div>
  );
}
