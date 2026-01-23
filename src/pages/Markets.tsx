import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useIsAdmin } from "@/hooks/use-is-admin";

type MarketRow = {
  id: string;
  title: string;
  description: string | null;
  asset_symbol: string;
  strike_price: number;
  expiry_at: string;
  status: "open" | "closed" | "resolved";
  created_at: string;
};

function formatUsd(amount: number) {
  return amount.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

export default function Markets() {
  const isAdmin = useIsAdmin();

  const markets = useQuery({
    queryKey: ["markets", "list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("markets")
        .select("id,title,description,asset_symbol,strike_price,expiry_at,status,created_at")
        .order("created_at", { ascending: false })
        .limit(25);
      if (error) throw error;
      return (data ?? []) as MarketRow[];
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/" className="group min-w-0 transition-opacity hover:opacity-90" aria-label="AlgoOracle Home">
            <div className="text-xs tracking-wide text-muted-foreground">AlgoOracle</div>
            <div className="truncate text-base font-semibold tracking-tight">Oracle-driven prediction markets</div>
            <div className="mt-0.5 h-px w-16 origin-left bg-primary/40 transition-transform duration-300 group-hover:scale-x-125" />
          </Link>

          <nav className="flex flex-wrap items-center justify-end gap-2">
            <Button asChild variant="secondary" size="sm">
              <Link to="/markets">Markets</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link to="/oracle">Oracle</Link>
            </Button>
            <Button asChild disabled={!isAdmin.data} size="sm">
              <Link to="/markets/new">Create market</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="animate-fade-in flex flex-wrap items-end justify-between gap-6">
          <div className="space-y-2">
            <p className="text-xs tracking-wide text-muted-foreground">Prediction Markets</p>
            <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Markets</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Scalar markets resolve YES if the oracle price is ≥ strike at expiry.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="secondary" size="sm">
              <Link to="/">Home</Link>
            </Button>
          </div>
        </header>

        {!isAdmin.isLoading && !isAdmin.data ? (
          <div className="mt-6 rounded-lg border border-border/60 bg-card/30 p-4 text-sm text-muted-foreground backdrop-blur supports-[backdrop-filter]:bg-card/25">
            Creating markets is restricted to <span className="font-medium text-foreground">admins</span>. Sign in with an
            admin account to enable the button.
          </div>
        ) : null}

        <section className="mt-8 grid gap-4">
          {(markets.data ?? []).map((m) => (
            <Card
              key={m.id}
              className="hover-scale border-border/60 bg-card/40 p-5 backdrop-blur supports-[backdrop-filter]:bg-card/30"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold tracking-tight">{m.title}</h2>
                    <Badge variant="secondary">{m.status.toUpperCase()}</Badge>
                  </div>
                  {m.description ? <p className="text-sm text-muted-foreground">{m.description}</p> : null}
                </div>

                <div className="text-right text-sm">
                  <div className="text-muted-foreground">Strike</div>
                  <div className="font-mono">{formatUsd(Number(m.strike_price))}</div>
                </div>
              </div>

              <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                <div>
                  <span className="text-foreground">Asset:</span> {m.asset_symbol}
                </div>
                <div>
                  <span className="text-foreground">Expiry:</span> {new Date(m.expiry_at).toLocaleString()}
                </div>
                <div className="sm:text-right">
                  <span className="text-foreground">Market ID:</span> <span className="font-mono">{m.id.slice(0, 8)}…</span>
                </div>
              </div>
            </Card>
          ))}

          {markets.isLoading ? (
            <Card className="border-border/60 bg-card/40 p-6 text-sm text-muted-foreground">Loading markets…</Card>
          ) : null}

          {!markets.isLoading && (markets.data?.length ?? 0) === 0 ? (
            <Card className="border-border/60 bg-card/40 p-6 text-sm text-muted-foreground">
              No markets yet. Create the first one.
            </Card>
          ) : null}
        </section>
      </main>
    </div>
  );
}
