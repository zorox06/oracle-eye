import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeMarketData } from "@/hooks/useRealtimeMarketData";
import { MarketBetting } from "@/components/market/MarketBetting";
import { OrderBook } from "@/components/trading/OrderBook";
import { MarketStats } from "@/components/trading/MarketStats";
import { PriceChart } from "@/components/trading/PriceChart";
import { MarketDepth } from "@/components/trading/MarketDepth";
import { PriceHistoryChart } from "@/components/trading/PriceHistoryChart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Trade() {
    const { marketId } = useParams<{ marketId: string }>();
    const navigate = useNavigate();

    // Fetch market details
    const { data: market } = useQuery({
        queryKey: ["market", marketId],
        queryFn: async () => {
            if (!marketId) return null;
            const { data, error } = await supabase
                .from("markets")
                .select("*")
                .eq("id", marketId)
                .single();

            if (error) throw error;
            return data as any;
        },
        enabled: !!marketId,
    });

    // Real-time market data
    const { marketData, positions, loading, refresh } = useRealtimeMarketData(
        marketId || '',
        market?.app_id || 0,
        3000
    );


    if (!market) {
        return (
            <div className="page-container">
                <div className="content-container py-20 text-center">
                    <p className="text-muted-foreground">Market not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header">
                <div className="content-container py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate("/markets")}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold">{market.title}</h1>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {market.description}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={refresh}
                                className="gap-2"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Refresh
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    window.open(
                                        `https://testnet.explorer.perawallet.app/application/${market.app_id || 0}/`,
                                        "_blank"
                                    )
                                }
                                disabled={!market.app_id}
                                className="gap-2"
                            >
                                <ExternalLink className="h-4 w-4" />
                                Contract
                            </Button>
                            <Badge variant={market.status === "open" ? "default" : "secondary"}>
                                {market.status}
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            <main className="content-container py-8 space-y-6">
                {/* Market Stats */}
                <MarketStats
                    yesPrice={marketData.yesPrice}
                    noPrice={marketData.noPrice}
                    totalVolume={marketData.totalVolume}
                    yesPool={marketData.yesPool}
                    noPool={marketData.noPool}
                    lastUpdate={marketData.lastUpdate}
                />

                {/* Main Trading Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Chart + Market Depth */}
                    <div className="lg:col-span-2 space-y-6">
                        <PriceChart
                            yesPrice={marketData.yesPrice}
                            noPrice={marketData.noPrice}
                        />
                        <PriceHistoryChart
                            positions={positions}
                        />
                    </div>

                    {/* Right: Betting Interface */}
                    <div>
                        <MarketBetting
                            marketId={market.id}
                            appId={market.app_id}
                            yesPool={marketData.yesPool * 1_000_000}
                            noPool={marketData.noPool * 1_000_000}
                            onBetComplete={refresh}
                        />
                    </div>
                </div>

                {/* Order Book */}
                <OrderBook positions={positions} loading={loading} />

                {/* Market Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                        <p className="text-muted-foreground">Asset</p>
                        <p className="font-medium">{market.asset_symbol}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Strike Price</p>
                        <p className="font-medium font-mono">${market.strike_price}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Expiry</p>
                        <p className="font-medium">
                            {new Date(market.expiry_at).toLocaleString()}
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
