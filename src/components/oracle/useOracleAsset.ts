import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { AuditEntry, HeatmapCell, OracleNode, OracleNodeId, OracleState } from "./types";
import type { OracleDataMode } from "./OracleDataModeDialog";

type Asset = "BTC" | "ETH";

type OraclePriceResponse = {
  asset: Asset;
  updatedAt: string;
  nodes: Array<OracleNode>;
  aggregatedPrice: number;
  onChainPrice: number;
  isSynced: boolean;
};

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return { ok: res.ok, status: res.status, json: JSON.parse(text) };
  } catch {
    return { ok: false, status: res.status, json: null };
  }
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function toNumber(v: unknown) {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

async function fetchOracleBrowserDirect(asset: Asset, cryptoCompareKey: string): Promise<OraclePriceResponse> {
  const cgId = asset === "BTC" ? "bitcoin" : "ethereum";
  const binanceSymbol = asset === "BTC" ? "BTCUSDT" : "ETHUSDT";

  const coingeckoUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${cgId}&vs_currencies=usd`;
  const binanceUrl = `https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`;
  const cryptoCompareUrl = `https://min-api.cryptocompare.com/data/price?fsym=${asset}&tsyms=USD`;

  const [cgRes, bnRes, ccRes] = await Promise.all([
    fetch(coingeckoUrl, { headers: { Accept: "application/json" } }),
    fetch(binanceUrl, { headers: { Accept: "application/json" } }),
    fetch(cryptoCompareUrl, {
      headers: {
        Accept: "application/json",
        ...(cryptoCompareKey ? { Authorization: `Apikey ${cryptoCompareKey}` } : {}),
      },
    }),
  ]);

  const cg = await safeJson(cgRes);
  const bn = await safeJson(bnRes);
  const cc = await safeJson(ccRes);

  const cgUsd = toNumber(cg.json?.[cgId]?.usd);
  const bnUsd = toNumber(bn.json?.price);
  const ccUsd = toNumber(cc.json?.USD);

  const nodes: OracleNode[] = [
    { id: "A", name: "Node A", source: "CoinGecko", status: cgUsd != null ? "online" : "offline", price: cgUsd ?? 0 },
    { id: "B", name: "Node B", source: "Binance", status: bnUsd != null ? "online" : "offline", price: bnUsd ?? 0 },
    { id: "C", name: "Node C", source: "CryptoCompare", status: ccUsd != null ? "online" : "offline", price: ccUsd ?? 0 },
  ];

  const available = nodes.filter((n) => n.status === "online").map((n) => n.price);
  const aggregatedPrice = available.length ? Math.round(median(available)) : 0;

  return {
    asset,
    updatedAt: new Date().toISOString(),
    nodes,
    aggregatedPrice,
    onChainPrice: aggregatedPrice,
    isSynced: true,
  };
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

export function useOracleAsset(
  asset: Asset,
  opts?: {
    mode?: OracleDataMode;
    cryptoCompareKey?: string;
  }
) {
  const maxCycles = 10;
  const mode = opts?.mode ?? "backend";
  const cryptoCompareKey = opts?.cryptoCompareKey ?? "";

  const query = useQuery({
    queryKey: ["oracle", "price", asset, mode],
    queryFn: async () => {
      if (mode === "browser") {
        // No secrets in code: user provides key locally.
        return await fetchOracleBrowserDirect(asset, cryptoCompareKey);
      }
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

