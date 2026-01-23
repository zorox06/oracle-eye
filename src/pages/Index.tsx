import { AuditTrail } from "@/components/oracle/AuditTrail";
import { ConsensusEngine } from "@/components/oracle/ConsensusEngine";
import { ReliabilityHeatmap } from "@/components/oracle/ReliabilityHeatmap";
import { TruthHeader } from "@/components/oracle/TruthHeader";
import { useOracleAsset } from "@/components/oracle/useOracleAsset";
import { ProviderStatusPanel } from "@/components/oracle/ProviderStatusPanel";
import type { OracleDataMode } from "@/components/oracle/OracleDataModeDialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/providers/AuthProvider";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";

const Index = () => {
  const { user, signOut } = useAuth();

  const [mode, setMode] = useLocalStorageState<OracleDataMode>("algooracle:dataMode", "backend");

  // NOTE: Any VITE_* key is public (bundled into the client). Prefer backend secrets.
  const envCryptoCompareKey = (import.meta as any)?.env?.VITE_CRYPTOCOMPARE_API_KEY as string | undefined;
  const [cryptoCompareKey, setCryptoCompareKey] = useLocalStorageState<string>(
    "algooracle:cryptoCompareKey",
    envCryptoCompareKey ?? ""
  );

  const btc = useOracleAsset("BTC", { mode, cryptoCompareKey });
  const eth = useOracleAsset("ETH", { mode, cryptoCompareKey });

  const [asset, setAsset] = useState<"BTC" | "ETH">("BTC");

  const getErrorMessage = (err: unknown) => {
    if (!err) return "Failed to load oracle data.";
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;
    try {
      return JSON.stringify(err);
    } catch {
      return "Failed to load oracle data.";
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
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
          <div className="relative">
            <div
              className="pointer-events-none absolute inset-0"
              aria-hidden
              style={{
                background:
                  "radial-gradient(900px 420px at 20% 20%, hsl(var(--primary) / 0.12), transparent 55%), radial-gradient(720px 360px at 85% 15%, hsl(var(--accent) / 0.10), transparent 60%)",
              }}
            />

            <div className="relative mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:py-12">
              <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-7">
                <p className="text-xs tracking-wide text-muted-foreground">Oracle</p>
                <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
                  BTC / ETH consensus
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  Two-asset oracle view built for plugging in live price APIs (median consensus + reliability + audit).
                </p>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <TabsList className="grid w-full max-w-[320px] grid-cols-2 sm:w-[240px]">
                    <TabsTrigger value="BTC">BTC</TabsTrigger>
                    <TabsTrigger value="ETH">ETH</TabsTrigger>
                  </TabsList>
                  <div className="text-xs text-muted-foreground">Polling live sources every ~5s.</div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <TabsContent value="BTC" className="mt-0 animate-fade-in">
                  <div className="grid gap-3">
                    <TruthHeader
                      aggregatedPrice={btc.state.aggregatedPrice}
                      onChainPrice={btc.state.onChainPrice}
                      isSynced={btc.state.isSynced}
                      updatedAt={btc.state.updatedAt}
                      onForceUpdate={btc.forceUpdate}
                    />
                    <ProviderStatusPanel
                      nodes={btc.state.nodes}
                      isLoading={btc.isLoading}
                      isError={btc.isError}
                      mode={mode}
                      onModeChange={setMode}
                      cryptoCompareKey={cryptoCompareKey}
                      onCryptoCompareKeyChange={setCryptoCompareKey}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="ETH" className="mt-0 animate-fade-in">
                  <div className="grid gap-3">
                    <TruthHeader
                      aggregatedPrice={eth.state.aggregatedPrice}
                      onChainPrice={eth.state.onChainPrice}
                      isSynced={eth.state.isSynced}
                      updatedAt={eth.state.updatedAt}
                      onForceUpdate={eth.forceUpdate}
                    />
                    <ProviderStatusPanel
                      nodes={eth.state.nodes}
                      isLoading={eth.isLoading}
                      isError={eth.isError}
                      mode={mode}
                      onModeChange={setMode}
                      cryptoCompareKey={cryptoCompareKey}
                      onCryptoCompareKeyChange={setCryptoCompareKey}
                    />
                  </div>
                </TabsContent>
              </div>
            </div>
          </div>
        </div>
        </div>

        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
          <TabsContent value="BTC" className="animate-fade-in">
            {btc.isError && (
              <div className="mb-6">
                <Alert variant="destructive" className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <AlertTitle>Oracle temporarily unavailable</AlertTitle>
                    <AlertDescription>
                      <p>{getErrorMessage(btc.error)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Your last known values are still shown below.</p>
                    </AlertDescription>
                  </div>
                  <Button variant="secondary" size="sm" onClick={btc.forceUpdate} className="sm:shrink-0">
                    Retry
                  </Button>
                </Alert>
              </div>
            )}
            <section className="grid gap-6 lg:grid-cols-12 lg:gap-8">
              <div className="lg:col-span-8">
                <ConsensusEngine nodes={btc.state.nodes} aggregatedPrice={btc.state.aggregatedPrice} algorithmLabel="Median" />
                <div className="mt-6">
                  <ReliabilityHeatmap cycles={btc.state.cycles} maxCycles={10} nodes={btc.state.nodes.map((n) => n.id)} />
                </div>
              </div>
              <div className="lg:col-span-4">
                <div className="lg:sticky lg:top-24">
                  <AuditTrail entries={btc.state.audit} />
                </div>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="ETH" className="animate-fade-in">
            {eth.isError && (
              <div className="mb-6">
                <Alert variant="destructive" className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <AlertTitle>Oracle temporarily unavailable</AlertTitle>
                    <AlertDescription>
                      <p>{getErrorMessage(eth.error)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Your last known values are still shown below.</p>
                    </AlertDescription>
                  </div>
                  <Button variant="secondary" size="sm" onClick={eth.forceUpdate} className="sm:shrink-0">
                    Retry
                  </Button>
                </Alert>
              </div>
            )}
            <section className="grid gap-6 lg:grid-cols-12 lg:gap-8">
              <div className="lg:col-span-8">
                <ConsensusEngine nodes={eth.state.nodes} aggregatedPrice={eth.state.aggregatedPrice} algorithmLabel="Median" />
                <div className="mt-6">
                  <ReliabilityHeatmap cycles={eth.state.cycles} maxCycles={10} nodes={eth.state.nodes.map((n) => n.id)} />
                </div>
              </div>
              <div className="lg:col-span-4">
                <div className="lg:sticky lg:top-24">
                  <AuditTrail entries={eth.state.audit} />
                </div>
              </div>
            </section>
          </TabsContent>

          <div className="mt-10 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
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
