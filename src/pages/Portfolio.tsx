import { useWallet } from "@/providers/WalletProvider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Wallet, TrendingUp, History } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function Portfolio() {
    const { isConnected, address, connect } = useWallet();

    const { data: positions, isLoading } = useQuery({
        queryKey: ["portfolio", address],
        queryFn: async () => {
            if (!address) return [];
            // Mock data until DB table created
            return [
                {
                    id: "1",
                    market_title: "BTC > 100k by 2025?",
                    side: "YES",
                    stake: 50,
                    shares: 100,
                    current_value: 65,
                },
                {
                    id: "2",
                    market_title: "ETH > 5k by Q3?",
                    side: "NO",
                    stake: 25,
                    shares: 40,
                    current_value: 15,
                }
            ];
        },
        enabled: !!address,
    });

    if (!isConnected) {
        return (
            <div className="container max-w-4xl py-10 flex flex-col items-center justify-center min-h-[50vh] gap-6">
                <div className="rounded-full bg-primary/10 p-6">
                    <Wallet className="h-12 w-12 text-primary" />
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold">Connect Wallet</h2>
                    <p className="text-muted-foreground">Connect your Pera Wallet to view your positions and betting history.</p>
                </div>
                <Button size="lg" onClick={connect}>Connect Wallet</Button>
            </div>
        );
    }

    const totalValue = positions?.reduce((acc, p) => acc + p.current_value, 0) || 0;
    const totalStake = positions?.reduce((acc, p) => acc + p.stake, 0) || 0;
    const pnl = totalValue - totalStake;

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="container max-w-4xl py-8 space-y-8">
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
                        <p className="text-muted-foreground">Manage your positions and claim winnings.</p>
                    </div>
                    <Card className="p-4 flex items-center gap-4 bg-card/40 backdrop-blur border-border/60">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-medium">Net P&L</p>
                            <p className={`text-xl font-bold font-mono ${pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                                {pnl >= 0 ? "+" : ""}{pnl} ALGO
                            </p>
                        </div>
                        <div className="h-8 w-px bg-border" />
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-medium">Total Value</p>
                            <p className="text-xl font-bold font-mono">{totalValue} ALGO</p>
                        </div>
                    </Card>
                </header>

                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        <h2 className="text-xl font-semibold">Active Positions</h2>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-10 text-muted-foreground">Loading positions...</div>
                    ) : positions?.length === 0 ? (
                        <Card className="p-10 text-center border-dashed border-border/60 bg-card/20">
                            <p className="text-muted-foreground">No active positions found.</p>
                            <Button asChild variant="link" className="mt-2">
                                <Link to="/markets">Explore Markets</Link>
                            </Button>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {positions?.map((pos) => (
                                <Card key={pos.id} className="p-4 border-border/60 bg-card/40 backdrop-blur flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="font-semibold">{pos.market_title}</h3>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={pos.side === 'YES' ? 'default' : 'destructive'}>{pos.side}</Badge>
                                            <span className="text-sm text-muted-foreground">{pos.shares} Shares</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-mono font-medium">{pos.current_value} ALGO</div>
                                        <div className={`text-xs ${pos.current_value >= pos.stake ? "text-green-500" : "text-red-500"}`}>
                                            {((pos.current_value - pos.stake) / pos.stake * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </section>

                <section className="space-y-4 pt-4 border-t border-border/40">
                    <div className="flex items-center gap-2">
                        <History className="h-5 w-5 text-muted-foreground" />
                        <h2 className="text-lg font-semibold text-muted-foreground">History</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">Your recent transactions will appear here.</p>
                </section>
            </div>
        </div>
    );
}
