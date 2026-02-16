import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from "lucide-react";

interface PricePoint {
    timestamp: string;
    yesPrice: number;
    noPrice: number;
}

interface PriceHistoryChartProps {
    positions: any[];
}

export function PriceHistoryChart({ positions }: PriceHistoryChartProps) {
    // Generate price history from positions
    const generatePriceHistory = (): PricePoint[] => {
        if (positions.length === 0) {
            // Default data showing 50/50
            return [
                { timestamp: 'Start', yesPrice: 50, noPrice: 50 }
            ];
        }

        const history: PricePoint[] = [];
        let yesTotal = 0;
        let noTotal = 0;

        // Sort positions by timestamp (oldest first)
        const sortedPositions = [...positions].sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        // Add initial point
        history.push({
            timestamp: 'Start',
            yesPrice: 50,
            noPrice: 50
        });

        // Calculate running totals
        sortedPositions.forEach((pos, index) => {
            if (pos.side === 'YES') {
                yesTotal += pos.amount;
            } else {
                noTotal += pos.amount;
            }

            const total = yesTotal + noTotal;
            const yesPrice = total > 0 ? (yesTotal / total) * 100 : 50;
            const noPrice = total > 0 ? (noTotal / total) * 100 : 50;

            // Format timestamp
            const date = new Date(pos.timestamp);
            const timeStr = date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });

            history.push({
                timestamp: timeStr,
                yesPrice: Math.round(yesPrice * 10) / 10,
                noPrice: Math.round(noPrice * 10) / 10
            });
        });

        return history;
    };

    const data = generatePriceHistory();
    const latestYes = data[data.length - 1]?.yesPrice || 50;
    const latestNo = data[data.length - 1]?.noPrice || 50;

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background/95 backdrop-blur border border-border rounded-lg p-3 shadow-lg">
                    <p className="text-xs font-medium mb-2">{payload[0].payload.timestamp}</p>
                    <div className="space-y-1">
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-xs text-green-500">YES</span>
                            <span className="text-xs font-bold">{payload[0].value.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-xs text-red-500">NO</span>
                            <span className="text-xs font-bold">{payload[1].value.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="unified-card p-6">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Probability Over Time</h3>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            <span className="font-medium">{latestYes.toFixed(1)}% YES</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-red-500" />
                            <span className="font-medium">{latestNo.toFixed(1)}% NO</span>
                        </div>
                    </div>
                </div>

                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                            <XAxis
                                dataKey="timestamp"
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                                stroke="hsl(var(--border))"
                            />
                            <YAxis
                                domain={[0, 100]}
                                ticks={[0, 25, 50, 75, 100]}
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                                stroke="hsl(var(--border))"
                                tickFormatter={(value) => `${value}%`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Line
                                type="monotone"
                                dataKey="yesPrice"
                                stroke="#22c55e"
                                strokeWidth={2.5}
                                dot={{ fill: '#22c55e', r: 3 }}
                                activeDot={{ r: 5 }}
                                animationDuration={500}
                            />
                            <Line
                                type="monotone"
                                dataKey="noPrice"
                                stroke="#ef4444"
                                strokeWidth={2.5}
                                dot={{ fill: '#ef4444', r: 3 }}
                                activeDot={{ r: 5 }}
                                animationDuration={500}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="pt-2 border-t border-border/40">
                    <p className="text-xs text-muted-foreground">
                        Chart updates in real-time as bets are placed. Hover over the line to see exact probabilities at each point.
                    </p>
                </div>
            </div>
        </Card>
    );
}
