import { Card } from "@/components/ui/card";
import { TrendingUp, Activity, DollarSign } from "lucide-react";

interface MarketStatsProps {
    yesPrice: number;
    noPrice: number;
    totalVolume: number;
    yesPool: number;
    noPool: number;
    lastUpdate: Date;
}

export function MarketStats({
    yesPrice,
    noPrice,
    totalVolume,
    yesPool,
    noPool,
    lastUpdate
}: MarketStatsProps) {
    const yesPriceChange = 0; // TODO: Calculate from historical data
    const volumeChange = 0; // TODO: Calculate 24h change

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* YES Price */}
            <Card className="unified-card p-4">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">YES Price</span>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-3xl font-bold text-green-500">
                            {(yesPrice * 100).toFixed(1)}¢
                        </p>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                                Pool: {yesPool.toFixed(2)} ALGO
                            </span>
                            {yesPriceChange !== 0 && (
                                <span className={`text-xs ${yesPriceChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {yesPriceChange > 0 ? '+' : ''}{yesPriceChange.toFixed(1)}%
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            {/* NO Price */}
            <Card className="unified-card p-4">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">NO Price</span>
                        <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-3xl font-bold text-red-500">
                            {(noPrice * 100).toFixed(1)}¢
                        </p>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                                Pool: {noPool.toFixed(2)} ALGO
                            </span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Total Volume */}
            <Card className="unified-card p-4">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Volume</span>
                        <Activity className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-3xl font-bold">
                            {totalVolume.toFixed(2)} <span className="text-lg text-muted-foreground">ALGO</span>
                        </p>
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                                ≈ ${(totalVolume * 0.25).toFixed(2)} USD
                            </span>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
