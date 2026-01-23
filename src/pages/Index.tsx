import { AuditTrail } from "@/components/oracle/AuditTrail";
import { ConsensusEngine } from "@/components/oracle/ConsensusEngine";
import { ReliabilityHeatmap } from "@/components/oracle/ReliabilityHeatmap";
import { TruthHeader } from "@/components/oracle/TruthHeader";
import { useOracleSimulation } from "@/components/oracle/useOracleSimulation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";
import { Link } from "react-router-dom";

const Index = () => {
  const oracle = useOracleSimulation();
  const { user, signOut } = useAuth();

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

      <div className="border-b border-border/60">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <p className="text-xs tracking-wide text-muted-foreground">Oracle</p>
              <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                Consensus dashboard
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Monitor node submissions, reliability, and the aggregated oracle price in real time.
              </p>
            </div>
            <div className="lg:col-span-5">
              <TruthHeader
                aggregatedPrice={oracle.state.aggregatedPrice}
                onChainPrice={oracle.state.onChainPrice}
                isSynced={oracle.state.isSynced}
                updatedAt={oracle.state.updatedAt}
                onForceUpdate={oracle.forceUpdate}
              />
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        <section className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-12">
            <ConsensusEngine
              nodes={oracle.state.nodes}
              aggregatedPrice={oracle.state.aggregatedPrice}
              algorithmLabel="Median Calculation"
            />
          </div>

          <div className="lg:col-span-7">
            <ReliabilityHeatmap
              cycles={oracle.state.cycles}
              maxCycles={10}
              nodes={oracle.state.nodes.map((n) => n.id)}
            />
          </div>

          <div className="lg:col-span-5">
            <AuditTrail entries={oracle.state.audit} />
          </div>
        </section>

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
    </div>
  );
};

export default Index;
