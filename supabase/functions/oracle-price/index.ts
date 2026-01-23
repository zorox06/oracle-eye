// Lovable Cloud backend function: fetch BTC/ETH spot prices from multiple sources

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Asset = "BTC" | "ETH";

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function toNumber(v: unknown) {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
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

    const coingeckoUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${cgId}&vs_currencies=usd`;
    const binanceUrl = `https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`;

    const cryptoCompareUrl = `https://min-api.cryptocompare.com/data/price?fsym=${asset}&tsyms=USD`;
    // Header values must be valid ByteString (edge runtime is strict). Secrets can include
    // newlines or other invisible unicode chars depending on how they were copied.
    const cryptoCompareKeyRaw = Deno.env.get("CRYPTOCOMPARE_API_KEY") ?? "";
    const cryptoCompareKeySanitized = cryptoCompareKeyRaw
      .replace(/[\r\n]+/g, "")
      // remove any non-ASCII/control chars to keep a valid ByteString
      .replace(/[^\x20-\x7E]+/g, "")
      .trim();
    // CryptoCompare keys are typically simple tokens; keep a conservative character set.
    const cryptoCompareKey = cryptoCompareKeySanitized.replace(/[^A-Za-z0-9._-]+/g, "") || null;

    const [cgRes, bnRes, ccRes] = await Promise.all([
      fetch(coingeckoUrl, { headers: { "Accept": "application/json" } }),
      fetch(binanceUrl, { headers: { "Accept": "application/json" } }),
      fetch(cryptoCompareUrl, {
        headers: {
          "Accept": "application/json",
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

    const nodes = [
      {
        id: "A",
        name: "Node A",
        source: "CoinGecko",
        status: cgUsd != null ? "online" : "offline",
        price: cgUsd ?? 0,
      },
      {
        id: "B",
        name: "Node B",
        source: "Binance",
        status: bnUsd != null ? "online" : "offline",
        price: bnUsd ?? 0,
      },
      {
        id: "C",
        name: "Node C",
        source: "CryptoCompare",
        status: ccUsd != null ? "online" : "offline",
        price: ccUsd ?? 0,
      },
    ] as const;

    const available = nodes.filter((n) => n.status === "online").map((n) => n.price);
    const aggregatedPrice = available.length ? median(available) : 0;

    return new Response(
      JSON.stringify({
        asset,
        updatedAt: new Date().toISOString(),
        nodes,
        aggregatedPrice,
        onChainPrice: aggregatedPrice,
        isSynced: true,
        debug: {
          coingecko: { ok: cg.ok, status: cg.status },
          binance: { ok: bn.ok, status: bn.status },
          cryptocompare: { ok: cc.ok, status: cc.status, keyed: Boolean(cryptoCompareKey) },
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
