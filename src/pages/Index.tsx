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
      <header className="border-b border-border/60">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-6 sm:px-6">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">AlgoOracle</p>
            <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
              Decentralized Data Consensus Dashboard
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button asChild variant="secondary" size="sm">
                <Link to="/markets">Markets</Link>
              </Button>
              {user ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    void signOut();
                  }}
                >
                  Sign out
                </Button>
              ) : (
                <Button asChild variant="secondary" size="sm">
                  <Link to="/auth">Sign in</Link>
                </Button>
              )}
            </div>
          </div>

          <TruthHeader
            aggregatedPrice={oracle.state.aggregatedPrice}
            onChainPrice={oracle.state.onChainPrice}
            isSynced={oracle.state.isSynced}
            updatedAt={oracle.state.updatedAt}
            onForceUpdate={oracle.forceUpdate}
          />
        </div>
      </header>

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
      </main>
    </div>
  );
};

export default Index;
