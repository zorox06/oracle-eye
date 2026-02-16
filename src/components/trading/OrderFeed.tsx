import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface OrderFeedProps {
    marketId: string;
}

interface Order {
    id: string;
    user_address: string;
    side: "yes" | "no";
    amount: number;
    timestamp: string;
}

export function OrderFeed({ marketId }: OrderFeedProps) {
    // Mock data - will be replaced with real blockchain data
    const { data: orders } = useQuery({
        queryKey: ["orders", marketId],
        queryFn: async () => {
            // TODO: Query from blockchain_positions table
            return mockOrders;
        },
        refetchInterval: 5000, // Update every 5 seconds
    });

    return (
        <Card className="unified-card p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Live Order Feed
                </h3>
                <Badge variant="outline" className="text-xs">Real-time</Badge>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
                {orders?.map((order) => (
                    <div
                        key={order.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/40 smooth-transition hover:border-border/80"
                    >
                        <div className="flex items-center gap-3">
                            {order.side === "yes" ? (
                                <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                            <div>
                                <Badge
                                    variant={order.side === "yes" ? "default" : "destructive"}
                                    className="text-xs"
                                >
                                    {order.side.toUpperCase()}
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {order.user_address.slice(0, 6)}...{order.user_address.slice(-4)}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-mono font-semibold">{order.amount} ALGO</p>
                            <p className="text-xs text-muted-foreground">
                                {new Date(order.timestamp).toLocaleTimeString()}
                            </p>
                        </div>
                    </div>
                ))}

                {!orders?.length && (
                    <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No orders yet. Be the first to trade!</p>
                    </div>
                )}
            </div>
        </Card>
    );
}

// Mock data
const mockOrders: Order[] = [
    {
        id: "1",
        user_address: "ADDR1234567890ABCDEF",
        side: "yes",
        amount: 50,
        timestamp: new Date(Date.now() - 60000).toISOString(),
    },
    {
        id: "2",
        user_address: "ADDR9876543210FEDCBA",
        side: "no",
        amount: 25,
        timestamp: new Date(Date.now() - 120000).toISOString(),
    },
    {
        id: "3",
        user_address: "ADDRXYZABC123456789",
        side: "yes",
        amount: 100,
        timestamp: new Date(Date.now() - 300000).toISOString(),
    },
];
