import { Card } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

interface MarketDepthProps {
    yesPool: number;
    noPool: number;
}

export function MarketDepth({ yesPool, noPool }: MarketDepthProps) {
    const totalLiquidity = yesPool + noPool;
    const yesPercentage = totalLiquidity > 0 ? (yesPool / totalLiquidity) * 100 : 50;
    const noPercentage = totalLiquidity > 0 ? (noPool / totalLiquidity) * 100 : 50;

    return (
        <Card className="unified-card p-6">
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Market Depth</h3>
                </div>

                {/* Liquidity Distribution */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total Liquidity</span>
                        <span className="font-bold">{totalLiquidity.toFixed(2)} ALGO</span>
                    </div>

                    {/* Visual depth representation */}
                    <div className="relative h-4 bg-background/50 rounded-full overflow-hidden">
                        <div
                            className="absolute left-0 h-full bg-green-500 transition-all duration-500"
                            style={{ width: `${yesPercentage}%` }}
                        />
                        <div
                            className="absolute right-0 h-full bg-red-500 transition-all duration-500"
                            style={{ width: `${noPercentage}%` }}
                        />
                    </div>

                    {/* Pool details */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">YES Pool</p>
                            <div className="flex items-baseline gap-1">
                                <p className="text-lg font-bold text-green-500">{yesPool.toFixed(2)}</p>
                                <span className="text-xs text-muted-foreground">ALGO</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{yesPercentage.toFixed(1)}% of total</p>
                        </div>

                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">NO Pool</p>
                            <div className="flex items-baseline gap-1">
                                <p className="text-lg font-bold text-red-500">{noPool.toFixed(2)}</p>
                                <span className="text-xs text-muted-foreground">ALGO</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{noPercentage.toFixed(1)}% of total</p>
                        </div>
                    </div>
                </div>

                {/* Info */}
                <div className="pt-4 border-t border-border/40">
                    <p className="text-xs text-muted-foreground">
                        Market depth shows the available liquidity for each outcome. Higher liquidity means lower price slippage.
                    </p>
                </div>
            </div>
        </Card>
    );
}
