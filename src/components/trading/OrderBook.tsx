import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Position {
    user: string;
    side: 'YES' | 'NO';
    amount: number;
    timestamp: Date;
    price: number;
}

interface OrderBookProps {
    positions: Position[];
    loading?: boolean;
}

export function OrderBook({ positions, loading }: OrderBookProps) {
    const yesOrders = positions.filter(p => p.side === 'YES');
    const noOrders = positions.filter(p => p.side === 'NO');

    const yesVolume = yesOrders.reduce((sum, p) => sum + p.amount, 0);
    const noVolume = noOrders.reduce((sum, p) => sum + p.amount, 0);

    if (loading) {
        return (
            <Card className="unified-card p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-pulse text-muted-foreground">Loading orderbook...</div>
                </div>
            </Card>
        );
    }

    return (
        <Card className="unified-card p-6">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Live Order Book</h3>
                    <Badge variant="outline" className="gap-1">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        Live
                    </Badge>
                </div>

                {/* Volume Summary */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <span className="text-xs text-muted-foreground">YES Volume</span>
                        </div>
                        <p className="text-xl font-bold text-green-500">{yesVolume.toFixed(2)} ALGO</p>
                        <p className="text-xs text-muted-foreground">{yesOrders.length} orders</p>
                    </div>

                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingDown className="h-4 w-4 text-red-500" />
                            <span className="text-xs text-muted-foreground">NO Volume</span>
                        </div>
                        <p className="text-xl font-bold text-red-500">{noVolume.toFixed(2)} ALGO</p>
                        <p className="text-xs text-muted-foreground">{noOrders.length} orders</p>
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Recent Orders</h4>
                    <div className="space-y-1 max-h-96 overflow-y-auto">
                        {positions.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No orders yet. Be the first to trade!
                            </div>
                        ) : (
                            positions.map((position, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-2 rounded-lg bg-background/50 hover:bg-background transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Badge
                                            variant={position.side === 'YES' ? 'default' : 'destructive'}
                                            className={position.side === 'YES' ? 'bg-green-600' : 'bg-red-600'}
                                        >
                                            {position.side}
                                        </Badge>
                                        <div>
                                            <p className="text-sm font-medium">{position.amount.toFixed(2)} ALGO</p>
                                            <p className="text-xs text-muted-foreground font-mono">{position.user}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-mono">@{(position.price * 100).toFixed(1)}¢</p>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            {formatDistanceToNow(position.timestamp, { addSuffix: true })}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}
