import { Card } from "@/components/ui/card";
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HeatCellStatus, HeatmapCell, OracleNodeId } from "./types";

type Point = {
  x: number;
  y: number;
  status: HeatCellStatus;
  nodeId: OracleNodeId;
  cycle: number;
  deviationPct: number;
};

function statusFill(status: HeatCellStatus) {
  switch (status) {
    case "good":
      return "hsl(var(--accent) / 0.9)";
    case "bad":
      return "hsl(var(--destructive) / 0.85)";
    case "warn":
    default:
      return "hsl(var(--primary) / 0.55)";
  }
}

export function ReliabilityHeatmap({
  cycles,
  nodes,
  maxCycles,
}: {
  cycles: HeatmapCell[];
  nodes: OracleNodeId[];
  maxCycles: number;
}) {
  const points: Point[] = cycles
    .map((c) => ({
      x: maxCycles - c.cycle + 1, // left=oldest, right=latest
      y: nodes.indexOf(c.nodeId),
      status: c.status,
      nodeId: c.nodeId,
      cycle: c.cycle,
      deviationPct: c.deviationPct,
    }))
    .filter((p) => p.y >= 0);

  return (
    <Card className="h-full border-border/60 bg-card/50 p-6 backdrop-blur supports-[backdrop-filter]:bg-card/40">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Reliability</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">Node Integrity Heatmap</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Green = within 0.1% of median. Cyan = drift. Red = outlier (&gt; 0.5%).
        </p>
      </div>

      <div className="mt-4 h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <CartesianGrid stroke="hsl(var(--border) / 0.6)" vertical={false} />

            <XAxis
              type="number"
              dataKey="x"
              domain={[0, maxCycles - 1]}
              tickFormatter={(v) => `T-${maxCycles - v}`}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              axisLine={{ stroke: "hsl(var(--border) / 0.6)" }}
              tickLine={false}
              interval={0}
              minTickGap={12}
            />

            <YAxis
              type="number"
              dataKey="y"
              domain={[-0.5, nodes.length - 0.5]}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              tickFormatter={(v) => (nodes[Math.round(v)] ? `Node ${nodes[Math.round(v)]}` : "")}
              axisLine={{ stroke: "hsl(var(--border) / 0.6)" }}
              tickLine={false}
              width={64}
            />

            <Tooltip
              cursor={false}
              content={({ payload }) => {
                const p = payload?.[0]?.payload as Point | undefined;
                if (!p) return null;
                return (
                  <div className="rounded-md border border-border/60 bg-popover/90 px-3 py-2 text-xs text-popover-foreground shadow">
                    <div className="font-medium">Node {p.nodeId}</div>
                    <div className="text-muted-foreground">Cycle: T-{p.cycle}</div>
                    <div className="text-muted-foreground">Deviation: {p.deviationPct.toFixed(3)}%</div>
                  </div>
                );
              }}
            />

            <Scatter
              data={points}
              shape={(props: any) => {
                const { cx, cy, payload } = props;
                const size = 18;
                const fill = statusFill(payload.status);
                return (
                  <rect
                    x={cx - size / 2}
                    y={cy - size / 2}
                    width={size}
                    height={size}
                    rx={4}
                    fill={fill}
                    stroke="hsl(var(--border) / 0.6)"
                    strokeWidth={1}
                  />
                );
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded" style={{ background: statusFill("good") }} />
          Verified
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded" style={{ background: statusFill("warn") }} />
          Drift
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded" style={{ background: statusFill("bad") }} />
          Outlier
        </span>
      </div>
    </Card>
  );
}
