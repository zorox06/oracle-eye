import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink } from "lucide-react";
import type { AuditEntry } from "./types";

function formatUsdCompact(amount: number) {
  return amount.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function AuditTrail({ entries }: { entries: AuditEntry[] }) {
  return (
    <Card className="h-full border-border/60 bg-card/50 p-6 backdrop-blur supports-[backdrop-filter]:bg-card/40">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Audit Trail</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">On-Chain Transaction Log</h2>
        </div>

        <a
          href="https://algoexplorer.io"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          AlgoExplorer
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-border/60">
        <Table>
          <TableHeader>
            <TableRow className="bg-card/30">
              <TableHead className="w-[120px]">Time</TableHead>
              <TableHead>Final Price</TableHead>
              <TableHead>Tx Hash</TableHead>
              <TableHead className="text-right">Gas Fee</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((e, idx) => (
              <TableRow key={`${e.txHash}-${idx}`} className="hover:bg-card/30">
                <TableCell className="font-mono text-xs text-muted-foreground">{e.time}</TableCell>
                <TableCell className="font-mono">{formatUsdCompact(e.finalPrice)}</TableCell>
                <TableCell className="font-mono text-xs">
                  <span className="story-link">{e.txHash}</span>
                </TableCell>
                <TableCell className="text-right font-mono text-xs text-muted-foreground">{e.gasFee}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
