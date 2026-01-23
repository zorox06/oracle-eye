import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { AuditEntry, HeatmapCell, OracleNode, OracleNodeId, OracleState } from "./types";

type Asset = "BTC" | "ETH";

type OraclePriceResponse = {
  asset: Asset;
  updatedAt: string;
  nodes: Array<OracleNode>;
  aggregatedPrice: number;
  onChainPrice: number;
  isSynced: boolean;
};

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

function buildHeatmapSeed(nodes: OracleNode[], medianPrice: number, maxCycles = 10): HeatmapCell[] {
  const cells: HeatmapCell[] = [];
  for (let cycle = maxCycles; cycle >= 1; cycle -= 1) {
    for (const n of nodes) {
      if (n.status !== "online" || medianPrice <= 0) {
        cells.push({ nodeId: n.id, cycle, deviationPct: 0, status: "warn" });
        continue;
      }
      const deviationPct = Math.abs((n.price - medianPrice) / medianPrice) * 100;
      cells.push({ nodeId: n.id, cycle, deviationPct, status: cellStatus(deviationPct) });
    }
  }
  return cells;
}

function normalizeNodes(nodes: OracleNode[]): OracleNode[] {
  // Ensure stable order and presence for A/B/C (the UI assumes fixed node IDs)
  const byId = new Map<OracleNodeId, OracleNode>();
  for (const n of nodes) byId.set(n.id, n);
  const fallback = (id: OracleNodeId, source: string): OracleNode => ({
    id,
    name: `Node ${id}`,
    source,
    status: "offline",
    price: 0,
  });
  return [
    byId.get("A") ?? fallback("A", "CoinGecko"),
    byId.get("B") ?? fallback("B", "Binance"),
    byId.get("C") ?? fallback("C", "CryptoCompare"),
  ];
}

export function useOracleAsset(asset: Asset) {
  const maxCycles = 10;

  const query = useQuery({
    queryKey: ["oracle", "price", asset],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<OraclePriceResponse>("oracle-price", {
        body: { asset },
      });
      if (error) throw error;
      if (!data) throw new Error("No data returned");
      return data;
    },
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  const initialNodes = useMemo(
    () =>
      normalizeNodes([
        { id: "A", name: "Node A", source: "CoinGecko", price: 0, status: "offline" },
        { id: "B", name: "Node B", source: "Binance", price: 0, status: "offline" },
        { id: "C", name: "Node C", source: "CryptoCompare", price: 0, status: "offline" },
      ]),
    []
  );

  const [state, setState] = useState<OracleState>(() => {
    const now = new Date();
    const auditSeed: AuditEntry[] = Array.from({ length: 3 }).map((_, i) => ({
      time: `${(i + 1) * 15}s ago`,
      finalPrice: 0,
      txHash: shortHash(),
      gasFee: `${(0.0012 + i * 0.0001).toFixed(4)} ALGO`,
    }));
    return {
      nodes: initialNodes,
      aggregatedPrice: 0,
      onChainPrice: 0,
      isSynced: true,
      updatedAt: now,
      cycles: buildHeatmapSeed(initialNodes, 0, maxCycles),
      audit: auditSeed,
    };
  });

  useEffect(() => {
    if (!query.data) return;
    const nextNodes = normalizeNodes(query.data.nodes);
    const nextAgg = Math.round(Number(query.data.aggregatedPrice) || 0);
    const now = new Date(query.data.updatedAt);

    setState((prev) => {
      // shift cycles: increment existing cycle index, drop > maxCycles, then add new (cycle=1)
      const shifted = prev.cycles
        .map((c) => ({ ...c, cycle: c.cycle + 1 }))
        .filter((c) => c.cycle <= maxCycles);

      const newCells: HeatmapCell[] = nextNodes.map((n) => {
        const deviationPct = nextAgg > 0 && n.status === "online" ? Math.abs((n.price - nextAgg) / nextAgg) * 100 : 0;
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
          finalPrice: nextAgg,
          txHash: shortHash(),
          gasFee: `${(0.001 + Math.random() * 0.0008).toFixed(4)} ALGO`,
        },
        ...prev.audit,
      ].slice(0, 5);

      return {
        ...prev,
        nodes: nextNodes,
        aggregatedPrice: nextAgg,
        onChainPrice: Math.round(Number(query.data.onChainPrice) || nextAgg),
        isSynced: Boolean(query.data.isSynced),
        updatedAt: now,
        cycles: [...newCells, ...shifted],
        audit: nextAudit,
      };
    });
  }, [asset, maxCycles, query.data]);

  const forceUpdate = useCallback(() => {
    void query.refetch();
  }, [query]);

  return {
    state,
    forceUpdate,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
