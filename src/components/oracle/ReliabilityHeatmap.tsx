import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";
import type { HeatCellStatus, HeatmapCell, OracleNodeId } from "./types";

interface ReliabilityHeatmapProps {
  cycles: HeatmapCell[];
  nodes: OracleNodeId[];
  maxCycles: number;
}

function getStatusColor(status: HeatCellStatus) {
  switch (status) {
    case "good":
      return "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]";
    case "warn":
      return "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]";
    case "bad":
      return "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]";
    case "offline":
      return "bg-muted/30 border border-border/50";
    default:
      return "bg-muted";
  }
}

export function ReliabilityHeatmap({ cycles, nodes, maxCycles }: ReliabilityHeatmapProps) {
  // Group cells by Node ID for easier row rendering
  const rows = nodes.map((nodeId) => {
    // Get cells for this node, sorted by cycle (oldest to newest)
    // cycles: 1 is latest. maxCycles is oldest.
    // We want left to be oldest (cycle=max) -> right (cycle=1)
    const nodeCells = cycles
      .filter((c) => c.nodeId === nodeId)
      .sort((a, b) => b.cycle - a.cycle);

    // Fill gaps if any
    const fullRow = Array.from({ length: maxCycles }).map((_, i) => {
      const targetCycle = maxCycles - i;
      return nodeCells.find((c) => c.cycle === targetCycle) || {
        nodeId,
        cycle: targetCycle,
        deviationPct: 0,
        status: "offline" as const,
      };
    });

    return { nodeId, cells: fullRow };
  });

  return (
    <Card className="h-full border-border/60 bg-card/50 p-6 backdrop-blur supports-[backdrop-filter]:bg-card/40 animate-fade-in flex flex-col">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Reliability</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">Consensus Topology</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Real-time visualization of node agreement and outliers.
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>Each block represents a consensus cycle (~5s). Green blocks indicate the node is within 0.1% of the median price. Red blocks indicate deviation &gt; 0.5%.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="mt-8 flex-1 flex flex-col justify-center gap-6">
        {rows.map((row) => (
          <div key={row.nodeId} className="flex items-center gap-4">
            <div className="w-16 flex-shrink-0 text-sm font-semibold text-muted-foreground">
              Node {row.nodeId}
            </div>

            <div className="flex-1 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${maxCycles}, 1fr)` }}>
              {row.cells.map((cell) => (
                <TooltipProvider key={`${cell.nodeId}-${cell.cycle}`}>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "aspect-[3/4] w-full rounded-sm transition-all duration-500 hover:scale-110 cursor-crosshair",
                          getStatusColor(cell.status),
                          cell.cycle === 1 && "animate-pulse" // Pulse latest
                        )}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <div className="text-xs font-mono space-y-1">
                        <div className="font-bold">Node {cell.nodeId}</div>
                        <div>Cycle: T-{cell.cycle}</div>
                        <div className={cell.deviationPct > 0.1 ? "text-yellow-500" : "text-green-500"}>
                          Dev: {cell.deviationPct.toFixed(4)}%
                        </div>
                        <div className="text-muted-foreground capitalize">{cell.status}</div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-8 grid grid-cols-4 gap-4 pt-6 border-t border-border/40">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
            <span className="text-xs font-medium">Synced</span>
          </div>
          <span className="text-[10px] text-muted-foreground">Deviation &lt; 0.1%</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.6)]" />
            <span className="text-xs font-medium">Drifting</span>
          </div>
          <span className="text-[10px] text-muted-foreground">Deviation 0.1% - 0.5%</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
            <span className="text-xs font-medium">Outlier</span>
          </div>
          <span className="text-[10px] text-muted-foreground">Deviation &gt; 0.5%</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 border border-border/50 bg-muted/40" />
            <span className="text-xs font-medium">Offline</span>
          </div>
          <span className="text-[10px] text-muted-foreground">No Response</span>
        </div>
      </div>
    </Card>
  );
}
