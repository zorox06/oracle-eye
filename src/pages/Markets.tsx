import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

export default function Markets() {
  const navigate = useNavigate();

  const { data: markets, isLoading } = useQuery({
    queryKey: ["markets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("markets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="page-container">
        <main className="content-container py-20">
          <div className="text-center">
            <div className="animate-pulse text-muted-foreground">Loading markets...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="content-container py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Markets</h1>
              <p className="text-muted-foreground mt-2">
                Browse and trade on prediction markets
              </p>
            </div>
            <Button onClick={() => navigate("/admin")} className="btn-primary gap-2">
              <Plus className="h-4 w-4" />
              Create Market
            </Button>
          </div>
        </div>
      </div>

      <main className="content-container py-8">
        {!markets || markets.length === 0 ? (
          <Card className="unified-card p-12 text-center">
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">No Markets Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first prediction market to get started!
                </p>
                <Button onClick={() => navigate("/admin")} className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Market
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {markets.map((market) => (
              <Card
                key={market.id}
                className="unified-card p-6 cursor-pointer hover:border-primary/50 transition-all"
                onClick={() => navigate(`/trade/${market.id}`)}
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold line-clamp-2">{market.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {market.description}
                      </p>
                    </div>
                    <Badge
                      variant={market.status === "open" ? "default" : "secondary"}
                      className="shrink-0"
                    >
                      {market.status}
                    </Badge>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Asset</p>
                      <p className="font-medium">{market.asset_symbol}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Strike</p>
                      <p className="font-medium font-mono">${market.strike_price}</p>
                    </div>
                  </div>

                  {/* Expiry */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-3 border-t border-border/40">
                    <Clock className="h-4 w-4" />
                    <span>
                      Expires {formatDistanceToNow(new Date(market.expiry_at), { addSuffix: true })}
                    </span>
                  </div>

                  {/* CTA */}
                  <Button className="w-full btn-primary" size="sm">
                    Trade Now
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
