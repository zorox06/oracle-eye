import { AuditTrail } from "@/components/oracle/AuditTrail";
import { ConsensusEngine } from "@/components/oracle/ConsensusEngine";
import { ReliabilityHeatmap } from "@/components/oracle/ReliabilityHeatmap";
import { TruthHeader } from "@/components/oracle/TruthHeader";
import { useOracleAsset } from "@/components/oracle/useOracleAsset";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/providers/AuthProvider";
import { Link } from "react-router-dom";
import { useState } from "react";

const Index = () => {
  const { user, signOut } = useAuth();

  const btc = useOracleAsset("BTC");
  const eth = useOracleAsset("ETH");

  const [asset, setAsset] = useState<"BTC" | "ETH">("BTC");

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
            <Button asChild variant="secondary" size="sm" className="transition-transform hover:scale-[1.02] active:scale-[0.98]">
              <Link to="/markets">Markets</Link>
            </Button>
            <Button asChild variant="secondary" size="sm" className="transition-transform hover:scale-[1.02] active:scale-[0.98]">
              <Link to="/oracle">Oracle</Link>
            </Button>
            {user ? (
              <Button type="button" variant="secondary" size="sm" onClick={() => void signOut()} className="transition-transform hover:scale-[1.02] active:scale-[0.98]">
                Sign out
              </Button>
            ) : (
              <Button asChild size="sm" className="transition-transform hover:scale-[1.02] active:scale-[0.98]">
                <Link to="/auth">Sign in</Link>
              </Button>
            )}
          </nav>
        </div>
      </header>

      <Tabs value={asset} onValueChange={(v) => setAsset(v as "BTC" | "ETH")} className="w-full">
        <div className="border-b border-border/60">
          <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
            <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-7">
                <p className="text-xs tracking-wide text-muted-foreground">Oracle</p>
                <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">BTC / ETH consensus</h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  Two-asset oracle view built for plugging in live price APIs (median consensus + reliability + audit).
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <TabsList className="grid w-[240px] grid-cols-2">
                    <TabsTrigger value="BTC">BTC</TabsTrigger>
                    <TabsTrigger value="ETH">ETH</TabsTrigger>
                  </TabsList>
                  <div className="text-xs text-muted-foreground">Polling live sources every ~5s.</div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <TabsContent value="BTC" className="mt-0">
                  <TruthHeader
                    aggregatedPrice={btc.state.aggregatedPrice}
                    onChainPrice={btc.state.onChainPrice}
                    isSynced={btc.state.isSynced}
                    updatedAt={btc.state.updatedAt}
                    onForceUpdate={btc.forceUpdate}
                  />
                </TabsContent>
                <TabsContent value="ETH" className="mt-0">
                  <TruthHeader
                    aggregatedPrice={eth.state.aggregatedPrice}
                    onChainPrice={eth.state.onChainPrice}
                    isSynced={eth.state.isSynced}
                    updatedAt={eth.state.updatedAt}
                    onForceUpdate={eth.forceUpdate}
                  />
                </TabsContent>
              </div>
            </div>
          </div>
        </div>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
          <TabsContent value="BTC">
            <section className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <ConsensusEngine nodes={btc.state.nodes} aggregatedPrice={btc.state.aggregatedPrice} algorithmLabel="Median" />
                <div className="mt-6">
                  <ReliabilityHeatmap cycles={btc.state.cycles} maxCycles={10} nodes={btc.state.nodes.map((n) => n.id)} />
                </div>
              </div>
              <div className="lg:col-span-4">
                <AuditTrail entries={btc.state.audit} />
              </div>
            </section>
          </TabsContent>

          <TabsContent value="ETH">
            <section className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <ConsensusEngine nodes={eth.state.nodes} aggregatedPrice={eth.state.aggregatedPrice} algorithmLabel="Median" />
                <div className="mt-6">
                  <ReliabilityHeatmap cycles={eth.state.cycles} maxCycles={10} nodes={eth.state.nodes.map((n) => n.id)} />
                </div>
              </div>
              <div className="lg:col-span-4">
                <AuditTrail entries={eth.state.audit} />
              </div>
            </section>
          </TabsContent>

        <div className="mt-8 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>Back to</span>
          <Link to="/" className="story-link">
            Home
          </Link>
          <span>or</span>
          <Link to="/markets" className="story-link">
            Markets
          </Link>
          <span>.</span>
        </div>
        </main>
      </Tabs>
    </div>
  );
};

export default Index;
