import { useCallback, useMemo, useRef, useState } from "react";
import type { AuditEntry, HeatmapCell, OracleNode, OracleNodeId, OracleState } from "./types";

function formatUsd(amount: number) {
  return amount.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function shortHash() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const rand = () => alphabet[Math.floor(Math.random() * alphabet.length)];
  return `${rand()}${rand()}${rand()}...${rand()}${rand()}${rand()}`;
}

function cellStatus(deviationPct: number): HeatmapCell["status"] {
  if (deviationPct <= 0.1) return "good";
  if (deviationPct > 0.5) return "bad";
  return "warn";
}

function buildInitialNodes(base: number): OracleNode[] {
  return [
    { id: "A", name: "Node A", source: "CoinGecko", price: base - 5, status: "online" },
    { id: "B", name: "Node B", source: "Binance", price: base + 5, status: "online" },
    { id: "C", name: "Node C", source: "CryptoCompare", price: base, status: "online" },
  ];
}

function buildHeatmapSeed(nodes: OracleNode[], medianPrice: number, maxCycles = 10): HeatmapCell[] {
  const cells: HeatmapCell[] = [];
  for (let cycle = maxCycles; cycle >= 1; cycle -= 1) {
    for (const n of nodes) {
      const deviationPct = Math.abs((n.price - medianPrice) / medianPrice) * 100;
      cells.push({
        nodeId: n.id,
        cycle,
        deviationPct,
        status: cellStatus(deviationPct),
      });
    }
  }
  return cells;
}

export function useOracleSimulation() {
  const basePrice = 102_450;
  const maxCycles = 10;
  const initialNodes = useMemo(() => buildInitialNodes(basePrice), []);
  const initialMedian = useMemo(() => median(initialNodes.map((n) => n.price)), [initialNodes]);

  const [state, setState] = useState<OracleState>(() => {
    const now = new Date();
    const auditSeed: AuditEntry[] = Array.from({ length: 5 }).map((_, i) => ({
      time: `${(i + 1) * 12}s ago`,
      finalPrice: basePrice,
      txHash: shortHash(),
      gasFee: `${(0.0012 + i * 0.0001).toFixed(4)} ALGO`,
    }));

    return {
      nodes: initialNodes,
      aggregatedPrice: initialMedian,
      onChainPrice: initialMedian,
      isSynced: true,
      updatedAt: now,
      cycles: buildHeatmapSeed(initialNodes, initialMedian, maxCycles),
      audit: auditSeed,
    };
  });

  const lastUpdateRef = useRef<Date>(state.updatedAt);
  lastUpdateRef.current = state.updatedAt;

  const forceUpdate = useCallback(() => {
    setState((prev) => {
      const now = new Date();
      const jitter = () => Math.round((Math.random() - 0.5) * 20); // +-10-ish

      const nextNodes: OracleNode[] = prev.nodes.map((n) => ({
        ...n,
        price: basePrice + jitter() + (n.id === "A" ? -5 : n.id === "B" ? 5 : 0),
        status: "online",
      }));

      const nextMedian = Math.round(median(nextNodes.map((n) => n.price)));

      // shift cycles: increment existing cycle index, drop > maxCycles, then add new (cycle=1)
      const shifted = prev.cycles
        .map((c) => ({ ...c, cycle: c.cycle + 1 }))
        .filter((c) => c.cycle <= maxCycles);

      const newCells: HeatmapCell[] = nextNodes.map((n) => {
        const deviationPct = Math.abs((n.price - nextMedian) / nextMedian) * 100;
        return {
          nodeId: n.id,
          cycle: 1,
          deviationPct,
          status: cellStatus(deviationPct),
        };
      });

      const nextAudit: AuditEntry[] = [
        {
          time: now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          finalPrice: nextMedian,
          txHash: shortHash(),
          gasFee: `${(0.001 + Math.random() * 0.0008).toFixed(4)} ALGO`,
        },
        ...prev.audit,
      ].slice(0, 5);

      return {
        ...prev,
        nodes: nextNodes,
        aggregatedPrice: nextMedian,
        onChainPrice: nextMedian,
        isSynced: true,
        updatedAt: now,
        cycles: [...newCells, ...shifted],
        audit: nextAudit,
      };
    });
  }, []);

  return {
    state,
    forceUpdate,
    formatUsd,
  };
}
