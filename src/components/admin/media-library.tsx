"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, Cloud, ImagePlus, Info, Loader2, Pencil, Trash2 } from "lucide-react";
import { addCloudinaryMediaAction, deleteMediaAction, registerSiteImageAction, updateMediaAction } from "@/app/admin/(panel)/media/actions";
import { AdminCard, adminButton } from "./admin-ui";
import { MediaThumb, type MediaOption } from "./media-picker";
import { cn } from "@/lib/utils";

export interface LibraryItem extends MediaOption {
  provider: "local" | "cloudinary";
  uses: string[];
}

type Result = { ok: true; id: number } | { ok: false; error: string };

const inputClass = "h-10 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-pine-600 focus:ring-4 focus:ring-pine-600/10";

function useAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (action: () => Promise<Result>, onOk?: () => void) => {
    setError(null);
    start(async () => {
      try {
        const r = await action();
        if (!r.ok) return setError(r.error);
        onOk?.();
        router.refresh();
      } catch {
        setError("Couldn't save — please try again");
      }
    });
  };
  return { pending, error, run };
}

function Field({ id, label, children, help }: { id: string; label: string; children: React.ReactNode; help?: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium">{label}</label>
      {children}
      {help && <p className="mt-1 text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}

function ErrorText({ error }: { error: string | null }) {
  return error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null;
}

function MediaCard({ item }: { item: LibraryItem }) {
  const [editing, setEditing] = useState(false);
  const [alt, setAlt] = useState(item.alt);
  const [label, setLabel] = useState(item.label);
  const { pending, error, run } = useAction();
  const used = item.uses.length > 0;

  return (
    <li className="flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
      <MediaThumb item={item} className="aspect-[4/3]" sizes="(min-width: 1024px) 300px, 50vw" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        {editing ? (
          <>
            <Field id={`label-${item.id}`} label="Label (for you)">
              <input id={`label-${item.id}`} className={inputClass} value={label} maxLength={160} onChange={(e) => setLabel(e.target.value)} />
            </Field>
            <Field id={`alt-${item.id}`} label={item.resourceType === "image" ? "Alt text (describes the image) *" : "Description"}>
              <textarea id={`alt-${item.id}`} rows={2} className={cn(inputClass, "h-auto py-2")} value={alt} maxLength={300} onChange={(e) => setAlt(e.target.value)} />
            </Field>
            <ErrorText error={error} />
            <div className="flex gap-2">
              <button type="button" disabled={pending} onClick={() => run(() => updateMediaAction(item.id, alt, label), () => setEditing(false))} className={cn(adminButton.primary, "h-9")}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Save
              </button>
              <button type="button" onClick={() => { setEditing(false); setAlt(item.alt); setLabel(item.label); }} className={cn(adminButton.secondary, "h-9")}>Cancel</button>
            </div>
          </>
        ) : (
          <>
            <p className="truncate text-sm font-semibold">{item.label || item.src.split("/").pop()}</p>
            <p className="line-clamp-2 text-xs text-muted-foreground">{item.alt || <span className="text-destructive">No alt text</span>}</p>
            <p className="text-xs text-muted-foreground">
              {item.provider === "cloudinary" ? "Cloudinary" : "Website file"} · {item.resourceType}
            </p>
            <div className="text-xs">
              {used ? (
                <details>
                  <summary className="cursor-pointer font-medium text-moss-700">Used in {item.uses.length} place{item.uses.length === 1 ? "" : "s"}</summary>
                  <ul className="mt-1 list-disc space-y-0.5 pl-4 text-muted-foreground">
                    {item.uses.map((u) => <li key={u}>{u}</li>)}
                  </ul>
                </details>
              ) : (
                <span className="text-muted-foreground">Not used</span>
              )}
            </div>
            <ErrorText error={error} />
            <div className="mt-auto flex gap-1 pt-1">
              <button type="button" onClick={() => setEditing(true)} className={adminButton.ghost}><Pencil className="size-3.5" /> Edit</button>
              <button
                type="button"
                disabled={pending || used}
                title={used ? "Replace it where it's used before deleting" : undefined}
                onClick={() => window.confirm("Remove this item from the media library?") && run(() => deleteMediaAction(item.id))}
                className={cn(adminButton.ghost, "text-destructive hover:text-destructive disabled:opacity-30")}
              >
                <Trash2 className="size-3.5" /> Delete
              </button>
            </div>
          </>
        )}
      </div>
    </li>
  );
}

function AddSiteImage({ files }: { files: string[] }) {
  const [src, setSrc] = useState("");
  const [alt, setAlt] = useState("");
  const [label, setLabel] = useState("");
  const { pending, error, run } = useAction();

  if (files.length === 0) {
    return <p className="text-sm text-muted-foreground">Every image in the website&rsquo;s image folder is already in the library.</p>;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-sand-100">
        {src && <Image src={src} alt="" fill sizes="160px" className="object-cover" />}
      </div>
      <div className="grid gap-3">
        <Field id="site-src" label="Image file">
          <select id="site-src" className={inputClass} value={src} onChange={(e) => setSrc(e.target.value)}>
            <option value="">Choose an image…</option>
            {files.map((f) => <option key={f} value={f}>{f.replace(/^\/images\//, "")}</option>)}
          </select>
        </Field>
        <Field id="site-alt" label="Alt text (describes the image) *">
          <input id="site-alt" className={inputClass} value={alt} maxLength={300} onChange={(e) => setAlt(e.target.value)} placeholder="e.g. Trekkers crossing a snowy pass at sunrise" />
        </Field>
        <Field id="site-label" label="Label (optional, for you)">
          <input id="site-label" className={inputClass} value={label} maxLength={160} onChange={(e) => setLabel(e.target.value)} />
        </Field>
        <ErrorText error={error} />
        <div>
          <button
            type="button"
            disabled={pending || !src}
            onClick={() => run(() => registerSiteImageAction(src, alt, label), () => { setSrc(""); setAlt(""); setLabel(""); })}
            className={cn(adminButton.primary, "disabled:opacity-50")}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />} Add to library
          </button>
        </div>
      </div>
    </div>
  );
}

function AddCloudinary({ cloudName }: { cloudName: string | null }) {
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [label, setLabel] = useState("");
  const { pending, error, run } = useAction();

  if (!cloudName) {
    return (
      <p className="text-sm text-muted-foreground">
        Cloudinary isn&rsquo;t connected yet. Once the developer sets the Cloudinary account name, you&rsquo;ll be able to add
        images and videos from Cloudinary here.
      </p>
    );
  }
  return (
    <div className="grid gap-3">
      <p className="text-sm text-muted-foreground">
        Upload the file in your Cloudinary account first, then copy its URL and paste it here. Only files from the
        &ldquo;{cloudName}&rdquo; account are accepted.
      </p>
      <Field id="cld-url" label="Cloudinary URL *">
        <input id="cld-url" className={inputClass} value={url} maxLength={500} inputMode="url" onChange={(e) => setUrl(e.target.value)} placeholder={`https://res.cloudinary.com/${cloudName}/image/upload/…`} />
      </Field>
      <Field id="cld-alt" label="Alt text (required for images)">
        <input id="cld-alt" className={inputClass} value={alt} maxLength={300} onChange={(e) => setAlt(e.target.value)} />
      </Field>
      <Field id="cld-label" label="Label (optional, for you)">
        <input id="cld-label" className={inputClass} value={label} maxLength={160} onChange={(e) => setLabel(e.target.value)} />
      </Field>
      <ErrorText error={error} />
      <div>
        <button
          type="button"
          disabled={pending || !url}
          onClick={() => run(() => addCloudinaryMediaAction(url, alt, label), () => { setUrl(""); setAlt(""); setLabel(""); })}
          className={cn(adminButton.primary, "disabled:opacity-50")}
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Cloud className="size-4" />} Add from Cloudinary
        </button>
      </div>
    </div>
  );
}

export function MediaLibrary({ items, unregistered, cloudName }: { items: LibraryItem[]; unregistered: string[]; cloudName: string | null }) {
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const shown = items.filter((i) => filter === "all" || i.resourceType === filter);
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title="Add an image from the website">
          <div className="p-5"><AddSiteImage files={unregistered} /></div>
        </AdminCard>
        <AdminCard title="Add from Cloudinary">
          <div className="p-5"><AddCloudinary cloudName={cloudName} /></div>
        </AdminCard>
      </div>
      <AdminCard
        title={`Library (${items.length})`}
        action={
          <div className="flex gap-1" role="group" aria-label="Filter media">
            {(["all", "image", "video"] as const).map((f) => (
              <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={cn(adminButton.ghost, filter === f && "bg-sand-100 text-ink")}>
                {f === "all" ? "All" : f === "image" ? "Images" : "Videos"}
              </button>
            ))}
          </div>
        }
      >
        {shown.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">Nothing here yet.</p>
        ) : (
          <ul className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shown.map((item) => <MediaCard key={item.id} item={item} />)}
          </ul>
        )}
      </AdminCard>
      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        Uploading files directly from this page isn&rsquo;t available yet. Website images are added by the developer; Cloudinary files are uploaded in Cloudinary and linked here.
      </p>
    </div>
  );
}
