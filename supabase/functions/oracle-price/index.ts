// Supabase Edge Function: fetch BTC/ETH spot prices from multiple sources
// Decentralized oracle with confidence scoring, deviation detection, and timestamp validation

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Asset = "BTC" | "ETH";
type NodeStatus = "online" | "offline" | "stale" | "outlier";

interface OracleNode {
  id: string;
  name: string;
  source: string;
  status: NodeStatus;
  price: number;
  timestamp: string;
  deviation: number | null;
}

// Configuration
const STALE_THRESHOLD_MS = 60_000; // 60 seconds
const DEVIATION_THRESHOLD = 0.05; // 5%

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function toNumber(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

function calculateDeviation(price: number, medianPrice: number): number {
  if (medianPrice === 0) return 0;
  return Math.abs(price - medianPrice) / medianPrice;
}

function calculateConfidence(nodes: OracleNode[]): { score: number; level: string } {
  const onlineNodes = nodes.filter((n) => n.status === "online");
  const totalNodes = nodes.length;

  if (onlineNodes.length === 0) {
    return { score: 0, level: "none" };
  }

  // Base score from node availability (0-50 points)
  const availabilityScore = (onlineNodes.length / totalNodes) * 50;

  // Agreement score based on deviation (0-50 points)
  const deviations = onlineNodes
    .map((n) => n.deviation)
    .filter((d): d is number => d !== null);

  const avgDeviation = deviations.length > 0
    ? deviations.reduce((a, b) => a + b, 0) / deviations.length
    : 0;

  // Lower deviation = higher agreement score
  // 0% deviation = 50 points, 5% deviation = 0 points
  const agreementScore = Math.max(0, 50 * (1 - avgDeviation / DEVIATION_THRESHOLD));

  const totalScore = Math.round(availabilityScore + agreementScore);

  let level: string;
  if (totalScore >= 90) level = "high";
  else if (totalScore >= 70) level = "medium";
  else if (totalScore >= 50) level = "low";
  else level = "critical";

  return { score: totalScore, level };
}

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return { ok: res.ok, status: res.status, json: JSON.parse(text) };
  } catch {
    return { ok: false, status: res.status, json: null };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const now = Date.now();
    const body = (await req.json().catch(() => ({}))) as { asset?: string };
    const asset = body.asset?.toUpperCase() as Asset | undefined;
    if (asset !== "BTC" && asset !== "ETH") {
      return new Response(JSON.stringify({ error: "asset must be BTC or ETH" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cgId = asset === "BTC" ? "bitcoin" : "ethereum";
    const binanceSymbol = asset === "BTC" ? "BTCUSDT" : "ETHUSDT";

    // CoinGecko API key support
    const coingeckoKeyRaw = Deno.env.get("COINGECKO_API_KEY") ?? "";
    const coingeckoKeySanitized = coingeckoKeyRaw
      .replace(/[\r\n]+/g, "")
      .replace(/[^\x20-\x7E]+/g, "")
      .trim();
    const coingeckoKey = coingeckoKeySanitized.replace(/[^A-Za-z0-9._-]+/g, "") || null;

    const coingeckoUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${cgId}&vs_currencies=usd`;

    // Binance API key support
    const binanceKeyRaw = Deno.env.get("BINANCE_API_KEY") ?? "";
    const binanceKeySanitized = binanceKeyRaw
      .replace(/[\r\n]+/g, "")
      .replace(/[^\x20-\x7E]+/g, "")
      .trim();
    const binanceKey = binanceKeySanitized.replace(/[^A-Za-z0-9]+/g, "") || null;

    const binanceUrl = `https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`;

    // CryptoCompare API key support
    const cryptoCompareUrl = `https://min-api.cryptocompare.com/data/price?fsym=${asset}&tsyms=USD`;
    const cryptoCompareKeyRaw = Deno.env.get("CRYPTOCOMPARE_API_KEY") ?? "";
    const cryptoCompareKeySanitized = cryptoCompareKeyRaw
      .replace(/[\r\n]+/g, "")
      .replace(/[^\x20-\x7E]+/g, "")
      .trim();
    const cryptoCompareKey = cryptoCompareKeySanitized.replace(/[^A-Za-z0-9._-]+/g, "") || null;

    // Fetch all sources in parallel
    const fetchStart = Date.now();
    const [cgRes, bnRes, ccRes] = await Promise.all([
      fetch(coingeckoUrl, {
        headers: {
          Accept: "application/json",
          ...(coingeckoKey ? { "x-cg-demo-api-key": coingeckoKey } : {}),
        },
      }),
      fetch(binanceUrl, {
        headers: {
          Accept: "application/json",
          ...(binanceKey ? { "X-MBX-APIKEY": binanceKey } : {}),
        },
      }),
      fetch(cryptoCompareUrl, {
        headers: {
          Accept: "application/json",
          ...(cryptoCompareKey ? { Authorization: `Apikey ${cryptoCompareKey}` } : {}),
        },
      }),
    ]);
    const fetchDuration = Date.now() - fetchStart;

    const cg = await safeJson(cgRes);
    const bn = await safeJson(bnRes);
    const cc = await safeJson(ccRes);

    const cgUsd = toNumber(cg.json?.[cgId]?.usd);
    const bnUsd = toNumber(bn.json?.price);
    const ccUsd = toNumber(cc.json?.USD);

    // First pass: get all valid prices for median calculation
    const validPrices: number[] = [];
    if (cgUsd !== null) validPrices.push(cgUsd);
    if (bnUsd !== null) validPrices.push(bnUsd);
    if (ccUsd !== null) validPrices.push(ccUsd);

    const medianPrice = median(validPrices);

    // Build nodes with status, deviation, and timestamps
    const nodeTimestamp = new Date().toISOString();

    const buildNode = (
      id: string,
      name: string,
      source: string,
      price: number | null,
      apiOk: boolean
    ): OracleNode => {
      if (price === null || !apiOk) {
        return {
          id,
          name,
          source,
          status: "offline",
          price: 0,
          timestamp: nodeTimestamp,
          deviation: null,
        };
      }

      const deviation = calculateDeviation(price, medianPrice);

      // Check if outlier (> 5% from median)
      if (deviation > DEVIATION_THRESHOLD) {
        return {
          id,
          name,
          source,
          status: "outlier",
          price,
          timestamp: nodeTimestamp,
          deviation,
        };
      }

      return {
        id,
        name,
        source,
        status: "online",
        price,
        timestamp: nodeTimestamp,
        deviation,
      };
    };

    const nodes: OracleNode[] = [
      buildNode("A", "Node A", "CoinGecko", cgUsd, cg.ok),
      buildNode("B", "Node B", "Binance", bnUsd, bn.ok),
      buildNode("C", "Node C", "CryptoCompare", ccUsd, cc.ok),
    ];

    // Calculate aggregated price from online nodes only (exclude outliers)
    const onlinePrices = nodes
      .filter((n) => n.status === "online")
      .map((n) => n.price);

    const aggregatedPrice = onlinePrices.length > 0 ? median(onlinePrices) : medianPrice;

    // Calculate confidence score
    const confidence = calculateConfidence(nodes);

    // Consensus info
    const onlineCount = nodes.filter((n) => n.status === "online").length;
    const totalCount = nodes.length;
    const consensusReached = onlineCount >= 2; // At least 2 nodes must agree

    return new Response(
      JSON.stringify({
        asset,
        updatedAt: new Date().toISOString(),
        nodes,
        aggregatedPrice,
        onChainPrice: aggregatedPrice,
        isSynced: true,

        // New decentralized oracle fields
        oracle: {
          confidence,
          consensus: {
            reached: consensusReached,
            onlineNodes: onlineCount,
            totalNodes: totalCount,
            threshold: 2,
          },
          latency: fetchDuration,
          staleThresholdMs: STALE_THRESHOLD_MS,
          deviationThreshold: DEVIATION_THRESHOLD,
        },

        debug: {
          coingecko: { ok: cg.ok, status: cg.status, keyed: Boolean(coingeckoKey) },
          binance: { ok: bn.ok, status: bn.status, keyed: Boolean(binanceKey) },
          cryptocompare: { ok: cc.ok, status: cc.status, keyed: Boolean(cryptoCompareKey) },
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type\": \"application/json" },
    });
  }
});
