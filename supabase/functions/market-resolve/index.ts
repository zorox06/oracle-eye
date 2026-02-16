// Supabase Edge Function: resolve an expired market using oracle consensus

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ResolveRequest = {
  marketId?: string;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "method must be POST" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const SUPABASE_ANON_KEY =
    Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return jsonResponse({ error: "backend env is missing" }, 500);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const apikeyHeader = req.headers.get("apikey") ?? "";

  // Use the caller's auth context so RLS + role checks apply.
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
        ...(apikeyHeader ? { apikey: apikeyHeader } : {}),
      },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) return jsonResponse({ error: "unauthorized" }, 401);

  const user = userData.user;
  const { data: isAdmin, error: roleErr } = await supabase.rpc("has_role", {
    _user_id: user.id,
    _role: "admin",
  });

  if (roleErr) return jsonResponse({ error: roleErr.message }, 500);
  if (!isAdmin) return jsonResponse({ error: "admin required" }, 403);

  const body = (await req.json().catch(() => ({}))) as ResolveRequest;
  const marketId = body.marketId;
  if (!marketId) return jsonResponse({ error: "marketId is required" }, 400);

  const { data: market, error: marketErr } = await supabase
    .from("markets")
    .select("id,asset_symbol,strike_price,expiry_at,status")
    .eq("id", marketId)
    .single();

  if (marketErr) return jsonResponse({ error: marketErr.message }, 400);
  if (!market) return jsonResponse({ error: "market not found" }, 404);

  if (market.status === "resolved") {
    return jsonResponse({ error: "market already resolved" }, 409);
  }

  const expiryAt = new Date(market.expiry_at);
  if (Number.isNaN(expiryAt.getTime())) return jsonResponse({ error: "invalid expiry_at" }, 400);

  if (expiryAt.getTime() > Date.now()) {
    return jsonResponse({ error: "market has not expired yet" }, 409);
  }

  const oracleRes = await fetch(`${SUPABASE_URL}/functions/v1/oracle-price`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // anon is sufficient; oracle-price is public anyway
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ asset: String(market.asset_symbol).toUpperCase() }),
  });

  const oracleText = await oracleRes.text();
  if (!oracleRes.ok) return jsonResponse({ error: "oracle fetch failed", details: oracleText }, 502);

  let oracleJson: any;
  try {
    oracleJson = JSON.parse(oracleText);
  } catch {
    return jsonResponse({ error: "oracle returned invalid json" }, 502);
  }

  const resolvedPrice = Number(oracleJson?.aggregatedPrice);
  if (!Number.isFinite(resolvedPrice) || resolvedPrice <= 0) {
    return jsonResponse({ error: "oracle price unavailable" }, 502);
  }

  const strike = Number(market.strike_price);
  const resolvedOutcome = resolvedPrice >= strike;
  const resolvedAt = new Date().toISOString();

  const { data: updated, error: updateErr } = await supabase
    .from("markets")
    .update({
      status: "resolved",
      resolved_price: resolvedPrice,
      resolved_outcome: resolvedOutcome,
      resolved_at: resolvedAt,
    })
    .eq("id", marketId)
    .select("id,status,resolved_price,resolved_outcome,resolved_at")
    .single();

  if (updateErr) return jsonResponse({ error: updateErr.message }, 400);

  return jsonResponse({
    market: updated,
    oracle: { asset: oracleJson?.asset, updatedAt: oracleJson?.updatedAt },
  });
});
