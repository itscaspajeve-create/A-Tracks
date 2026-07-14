"use client";

import { useRef, useState } from "react";
import { Loader2, RotateCcw, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AppLogo } from "./app-logo";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Upload / reset the app icon shown in the sidebar, tab bar and login screen. */
export function AppIconDialog({ open, onOpenChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setError(null);
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  async function upload() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Choose an image first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/logo", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Upload failed.");
      } else {
        window.location.reload();
      }
    } catch {
      setError("Upload failed — try again.");
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    setBusy(true);
    setError(null);
    try {
      await fetch("/api/logo", { method: "DELETE" });
      window.location.reload();
    } catch {
      setError("Could not reset the icon.");
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setPreview(null);
          setError(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>App icon</DialogTitle>
          <DialogDescription>
            Upload a square image (PNG, JPG, WebP, GIF or SVG, up to 2 MB). It replaces the icon
            in the sidebar and on the sign-in screen.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-6 rounded-lg border bg-muted/40 py-4">
            <div className="flex flex-col items-center gap-1.5">
              <AppLogo size={48} />
              <span className="text-[11px] text-muted-foreground">Current</span>
            </div>
            {preview && (
              <div className="flex flex-col items-center gap-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="New icon preview" className="h-12 w-12 rounded-xl object-cover" />
                <span className="text-[11px] text-muted-foreground">New</span>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            onChange={onPick}
            className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={upload} disabled={busy} className="flex-1 gap-1.5">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Save icon
            </Button>
            <Button onClick={reset} disabled={busy} variant="outline" className="gap-1.5">
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
