import { formatPeso } from "@/lib/format";

interface Entry {
  name: string;
  value: number;
  color: string;
}

export function ChartTooltip({
  label,
  entries,
}: {
  label?: string;
  entries: Entry[];
}) {
  if (entries.length === 0) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      {label && <p className="mb-1 font-medium text-foreground">{label}</p>}
      <div className="space-y-0.5">
        {entries.map((e) => (
          <div key={e.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: e.color }}
              />
              {e.name}
            </span>
            <span className="tnum font-medium text-foreground">{formatPeso(e.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
