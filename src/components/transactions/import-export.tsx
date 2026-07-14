"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ImportExport() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function onImport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setBusy(true);
    setResult(null);
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/import", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) {
        setResult(json.error ?? "Import failed.");
      } else {
        setResult(
          `Imported ${json.imported} transaction${json.imported === 1 ? "" : "s"}` +
            (json.skipped ? `, skipped ${json.skipped} row${json.skipped === 1 ? "" : "s"}.` : ".") +
            (json.errors?.length ? `\n${json.errors.join("\n")}` : "")
        );
        router.refresh();
      }
    } catch {
      setResult("Import failed — check the file and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="outline" size="sm" className="gap-1.5">
        <a href="/api/export" download>
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Export CSV</span>
          <span className="sm:hidden">Export</span>
        </a>
      </Button>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setResult(null);
        }}
      >
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Upload className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Import CSV</span>
            <span className="sm:hidden">Import</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import transactions from CSV</DialogTitle>
            <DialogDescription>
              Header row required. Columns: <code className="text-xs">date, amount, direction, account, category, description, notes, is_recurring</code>.
              Only <code className="text-xs">date</code> and <code className="text-xs">amount</code> are mandatory —
              unknown accounts and categories are created automatically.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onImport} className="space-y-4">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              required
              className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium"
            />
            {result && (
              <p className="whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs">{result}</p>
            )}
            <Button type="submit" disabled={busy} className="w-full">
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
