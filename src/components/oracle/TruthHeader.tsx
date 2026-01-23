import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RefreshCcw } from "lucide-react";

function formatUsd(amount: number) {
  return amount.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function useSinceSeconds(date: Date) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);
  return Math.max(0, Math.round((now - date.getTime()) / 1000));
}

export function TruthHeader({
  aggregatedPrice,
  onChainPrice,
  isSynced,
  updatedAt,
  onForceUpdate,
}: {
  aggregatedPrice: number;
  onChainPrice: number;
  isSynced: boolean;
  updatedAt: Date;
  onForceUpdate: () => void;
}) {
  const sinceSec = useSinceSeconds(updatedAt);
  const updateLabel = useMemo(() => {
    if (sinceSec < 60) return `Updated ${sinceSec}s ago`;
    const m = Math.floor(sinceSec / 60);
    return `Updated ${m}m ago`;
  }, [sinceSec]);

  return (
    <div className="grid w-full items-stretch gap-3 sm:w-auto sm:min-w-[540px] sm:grid-cols-3">
      <Card className="relative overflow-hidden border-border/60 bg-card/50 p-4 backdrop-blur supports-[backdrop-filter]:bg-card/40">
        <p className="text-xs font-medium tracking-wide text-muted-foreground">Real-Time Market Price (Aggregated)</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{formatUsd(aggregatedPrice)}</p>
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full"
          style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.25), transparent 60%)" }}
        />
      </Card>

      <Card className="relative overflow-hidden border-border/60 bg-card/50 p-4 backdrop-blur supports-[backdrop-filter]:bg-card/40">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium tracking-wide text-muted-foreground">On-Chain Smart Contract Price</p>
          <Badge variant={isSynced ? "secondary" : "destructive"} className="gap-1">
            {isSynced ? "Synced" : "Out of sync"}
          </Badge>
        </div>
        <p className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{formatUsd(onChainPrice)}</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span>{updateLabel}</span>
          </div>

          <Button
            onClick={onForceUpdate}
            variant="secondary"
            size="icon"
            className="shrink-0 transition-transform hover:scale-[1.02] active:scale-[0.98]"
            aria-label="Refresh oracle"
            title="Refresh"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      <Card className="relative overflow-hidden border-border/60 bg-card/50 p-4 backdrop-blur supports-[backdrop-filter]:bg-card/40">
        <p className="text-xs font-medium tracking-wide text-muted-foreground">Last Update</p>
        <p className="mt-2 text-lg font-medium">{updatedAt.toLocaleTimeString()}</p>
        <p className="mt-1 text-xs text-muted-foreground">{updateLabel}</p>
        <div
          className="pointer-events-none absolute -bottom-12 -left-12 h-28 w-28 rounded-full"
          style={{ background: "radial-gradient(circle, hsl(var(--accent) / 0.22), transparent 60%)" }}
        />
      </Card>
    </div>
  );
}
