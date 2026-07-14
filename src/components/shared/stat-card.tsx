import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { formatPeso } from "@/lib/format";

export function StatCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: number;
  sub?: string;
  tone?: "positive" | "negative" | "neutral";
}) {
  const auto: "positive" | "negative" | "neutral" =
    tone ?? (value > 0 ? "positive" : value < 0 ? "negative" : "neutral");
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 md:p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p
          className={cn(
            "tnum mt-1.5 text-xl font-semibold md:text-2xl",
            tone === "positive" && "text-[var(--up-good)]",
            tone === "negative" && "text-destructive",
            tone === undefined && auto === "negative" && "text-destructive"
          )}
        >
          {formatPeso(value)}
        </p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}
