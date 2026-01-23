import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Database, ShieldCheck } from "lucide-react";
import type { OracleNode } from "./types";

function formatUsdCompact(amount: number) {
  return amount.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function NodeCard({ node }: { node: OracleNode }) {
  const online = node.status === "online";
  return (
    <div className="rounded-lg border border-border/60 bg-card/40 p-4 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium tracking-tight">{node.source}</p>
          <p className="mt-1 text-xs text-muted-foreground">{node.name}</p>
        </div>
        <Badge variant={online ? "secondary" : "destructive"} className="gap-1">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: online ? "hsl(var(--accent))" : "hsl(var(--destructive))" }}
          />
          {online ? "Online" : "Offline"}
        </Badge>
      </div>
      <p className="mt-3 font-mono text-xl tracking-tight">{formatUsdCompact(node.price)}</p>
    </div>
  );
}

export function ConsensusEngine({
  nodes,
  aggregatedPrice,
  algorithmLabel,
}: {
  nodes: OracleNode[];
  aggregatedPrice: number;
  algorithmLabel: string;
}) {
  return (
    <Card className="relative overflow-hidden border-border/60 bg-card/50 p-6 backdrop-blur supports-[backdrop-filter]:bg-card/40">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Consensus Engine</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">Off-chain Sources → On-chain Truth</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Three independent price feeds converge into a single trusted value using a median calculation. This proves aggregation
            rather than copying one API.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/30 px-3 py-2">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-sm text-muted-foreground">Fault-tolerant median</span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {nodes.map((n) => (
            <NodeCard key={n.id} node={n} />
          ))}
        </div>

        <div className="hidden lg:flex lg:flex-col lg:items-center lg:gap-2">
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="grid gap-3">
          <div className="rounded-lg border border-border/60 bg-card/40 p-5 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <p className="text-sm font-medium">{algorithmLabel}</p>
              </div>
              <Badge variant="secondary">Output</Badge>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Aggregated price published on-chain:</p>
            <p className="mt-2 font-mono text-3xl tracking-tight">{formatUsdCompact(aggregatedPrice)}</p>
            <div className="mt-3 text-xs text-muted-foreground">
              Median is resilient against a single outlier feed.
            </div>
          </div>
        </div>
      </div>

      <div
        className="pointer-events-none absolute -right-24 top-10 h-60 w-60 rounded-full"
        style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.16), transparent 60%)" }}
      />
    </Card>
  );
}
