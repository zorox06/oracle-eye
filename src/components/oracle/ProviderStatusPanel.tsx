import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { OracleNode } from "./types";

type ProviderKey = "CoinGecko" | "Binance" | "CryptoCompare";

const PROVIDERS: ProviderKey[] = ["CoinGecko", "Binance", "CryptoCompare"];

function getProviderStatus(nodes: OracleNode[], provider: ProviderKey) {
  const node = nodes.find((n) => n.source === provider);
  if (!node) return { status: "offline" as const, label: "Missing" };
  const online = node.status === "online";
  return { status: node.status, label: online ? "Online" : "Offline" };
}

export function ProviderStatusPanel({
  nodes,
  isLoading,
  isError,
}: {
  nodes: OracleNode[];
  isLoading: boolean;
  isError: boolean;
}) {
  return (
    <Card className="border-border/60 bg-card/50 p-4 backdrop-blur supports-[backdrop-filter]:bg-card/40">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium tracking-wide text-muted-foreground">Provider status</p>
        <p className="text-xs text-muted-foreground">
          {isError ? "Degraded" : isLoading ? "Syncing" : "Live"}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {PROVIDERS.map((provider) => {
          const { status, label } = getProviderStatus(nodes, provider);
          const online = status === "online";
          return (
            <Badge
              key={provider}
              variant={online && !isError ? "secondary" : "destructive"}
              className="gap-1"
              title={`${provider}: ${label}`}
            >
              <span
                className="h-2 w-2 rounded-full"
                aria-hidden
                style={{
                  background:
                    online && !isError ? "hsl(var(--accent))" : "hsl(var(--destructive))",
                }}
              />
              {provider}
            </Badge>
          );
        })}
      </div>
    </Card>
  );
}
