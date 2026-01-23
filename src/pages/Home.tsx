import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type MarketPreviewRow = {
  id: string;
  title: string;
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

export default function Home() {
  const latestMarkets = useQuery({
    queryKey: ["markets", "latest"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("markets")
        .select("id,title,asset_symbol,strike_price,expiry_at,status,created_at")
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return (data ?? []) as MarketPreviewRow[];
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">AlgoOracle</p>
            <div className="truncate text-lg font-semibold tracking-tight">Prediction markets + oracle consensus</div>
          </div>

          <nav className="flex flex-wrap items-center justify-end gap-2">
            <Button asChild variant="secondary" size="sm">
              <Link to="/markets">Markets</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link to="/oracle">Oracle dashboard</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
        <section className="grid gap-8 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-7">
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              Prediction markets powered by oracle consensus.
            </h1>
            <p className="mt-4 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
              Create scalar markets that resolve <span className="text-foreground">YES</span> when the oracle price is ≥ the
              strike at expiry. Browse markets publicly—sign in to access protected actions.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Button asChild>
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link to="/markets">Browse markets</Link>
              </Button>
            </div>

            <Separator className="my-8" />

            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="border-border/60 bg-card/50 p-5">
                <div className="text-sm font-medium">Create markets</div>
                <p className="mt-2 text-sm text-muted-foreground">Admins can define asset, strike, and expiry.</p>
              </Card>
              <Card className="border-border/60 bg-card/50 p-5">
                <div className="text-sm font-medium">Trade (next)</div>
                <p className="mt-2 text-sm text-muted-foreground">Order book trading for YES/NO shares (coming soon).</p>
              </Card>
              <Card className="border-border/60 bg-card/50 p-5">
                <div className="text-sm font-medium">Settle by oracle</div>
                <p className="mt-2 text-sm text-muted-foreground">Consensus price determines resolution at expiry.</p>
              </Card>
            </div>
          </div>

          <div className="lg:col-span-5">
            <Card className="border-border/60 bg-card/50 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">Latest markets</div>
                  <p className="mt-1 text-sm text-muted-foreground">A quick snapshot of what’s live right now.</p>
                </div>
                <Button asChild variant="secondary" size="sm">
                  <Link to="/markets">View all</Link>
                </Button>
              </div>

              <div className="mt-4 grid gap-3">
                {latestMarkets.isLoading ? (
                  <div className="text-sm text-muted-foreground">Loading markets…</div>
                ) : null}

                {!latestMarkets.isLoading && (latestMarkets.data?.length ?? 0) === 0 ? (
                  <div className="text-sm text-muted-foreground">No markets yet.</div>
                ) : null}

                {(latestMarkets.data ?? []).map((m) => (
                  <div key={m.id} className="rounded-lg border border-border/60 bg-background/40 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="truncate text-sm font-medium">{m.title}</div>
                          <Badge variant="secondary" className="text-xs">
                            {m.status.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {m.asset_symbol} • Strike {formatUsd(Number(m.strike_price))}
                        </div>
                      </div>
                      <div className="shrink-0 text-right text-xs text-muted-foreground">
                        <div>Expiry</div>
                        <div className="text-foreground">{new Date(m.expiry_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="mt-4 text-xs text-muted-foreground">
              Want to inspect the oracle consensus engine? <Link className="underline" to="/oracle">Open the dashboard</Link>.
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:px-6">
          <div>© {new Date().getFullYear()} AlgoOracle</div>
          <div className="flex flex-wrap items-center gap-3">
            <Link className="underline" to="/markets">
              Markets
            </Link>
            <Link className="underline" to="/oracle">
              Oracle
            </Link>
            <Link className="underline" to="/auth">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
