import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PriceChartProps {
    yesPrice: number;
    noPrice: number;
}

export function PriceChart({ yesPrice, noPrice }: PriceChartProps) {
    // Simple visual representation of current prices
    const yesPercentage = yesPrice * 100;
    const noPercentage = noPrice * 100;

    return (
        <Card className="unified-card p-6">
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Price Overview</h3>

                {/* Price Bars */}
                <div className="space-y-4">
                    {/* YES Price Bar */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-green-500" />
                                <span className="text-sm font-medium">YES</span>
                            </div>
                            <span className="text-lg font-bold text-green-500">
                                {yesPercentage.toFixed(1)}¢
                            </span>
                        </div>
                        <div className="h-8 bg-background/50 rounded-lg overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-500 flex items-center justify-end pr-3"
                                style={{ width: `${yesPercentage}%` }}
                            >
                                <span className="text-xs font-bold text-white">
                                    {yesPercentage.toFixed(0)}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* NO Price Bar */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <TrendingDown className="h-4 w-4 text-red-500" />
                                <span className="text-sm font-medium">NO</span>
                            </div>
                            <span className="text-lg font-bold text-red-500">
                                {noPercentage.toFixed(1)}¢
                            </span>
                        </div>
                        <div className="h-8 bg-background/50 rounded-lg overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500 flex items-center justify-end pr-3"
                                style={{ width: `${noPercentage}%` }}
                            >
                                <span className="text-xs font-bold text-white">
                                    {noPercentage.toFixed(0)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Price Info */}
                <div className="pt-4 border-t border-border/40">
                    <p className="text-xs text-muted-foreground">
                        Prices automatically adjust based on pool liquidity using an AMM (Automated Market Maker) model.
                    </p>
                </div>
            </div>
        </Card>
    );
}
