import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Award, Medal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface Trader {
    id: string;
    address: string;
    username?: string;
    totalPnl: number;
    totalVolume: number;
    winRate: number;
    trades: number;
    rank: number;
}

export default function Leaderboard() {
    const { data: traders } = useQuery({
        queryKey: ["leaderboard"],
        queryFn: async () => {
            // TODO: Fetch from database
            return mockTraders;
        },
    });

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Trophy className="h-5 w-5 text-yellow-500" />;
            case 2:
                return <Award className="h-5 w-5 text-gray-400" />;
            case 3:
                return <Medal className="h-5 w-5 text-orange-600" />;
            default:
                return <span className="text-muted-foreground">#{rank}</span>;
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="content-container py-6">
                    <div className="flex items-center gap-3">
                        <Trophy className="h-8 w-8 text-primary" />
                        <div>
                            <h1 className="text-3xl font-bold">Leaderboard</h1>
                            <p className="text-muted-foreground">Top traders by profit</p>
                        </div>
                    </div>
                </div>
            </div>

            <main className="content-container py-8">
                <div className="max-w-4xl mx-auto space-y-4">
                    {/* Top 3 Podium */}
                    <div className="grid grid-cols-3 gap-4 mb-8 stagger-container">
                        {traders?.slice(0, 3).map((trader, idx) => {
                            const heights = ["h-48", "h-56", "h-44"];
                            const positions = [1, 0, 2];
                            const actualIdx = positions.indexOf(idx);

                            return (
                                <div
                                    key={trader.id}
                                    className={`unified-card ${heights[idx]} flex flex-col items-center justify-center hover-lift`}
                                    style={{ order: actualIdx }}
                                >
                                    <div className="mb-4">{getRankIcon(trader.rank)}</div>
                                    <p className="font-mono text-sm mb-2">
                                        {trader.address.slice(0, 6)}...{trader.address.slice(-4)}
                                    </p>
                                    <p className={`text-2xl font-bold ${trader.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {trader.totalPnl >= 0 ? '+' : ''}{trader.totalPnl.toLocaleString()} ALGO
                                    </p>
                                    <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
                                        <div className="text-center">
                                            <p className="font-mono font-semibold text-foreground">{trader.winRate}%</p>
                                            <p>Win Rate</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="font-mono font-semibold text-foreground">{trader.trades}</p>
                                            <p>Trades</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Rest of Rankings */}
                    <Card className="unified-card overflow-hidden">
                        <div className="divide-y divide-border/40">
                            {traders?.slice(3).map((trader) => (
                                <div
                                    key={trader.id}
                                    className="flex items-center justify-between p-4 hover:bg-background/50 smooth-transition"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 text-center">
                                            {getRankIcon(trader.rank)}
                                        </div>
                                        <div>
                                            <p className="font-mono text-sm">
                                                {trader.username || `${trader.address.slice(0, 6)}...${trader.address.slice(-4)}`}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {trader.trades} trades • {trader.winRate}% win rate
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className={`font-mono font-semibold ${trader.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {trader.totalPnl >= 0 ? '+' : ''}{trader.totalPnl.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {trader.totalVolume.toLocaleString()} vol
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Stats Footer */}
                    <div className="grid grid-cols-3 gap-4 mt-8">
                        <Card className="unified-card p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="h-4 w-4 text-primary" />
                                <p className="text-sm text-muted-foreground">Total Volume</p>
                            </div>
                            <p className="text-2xl font-bold">
                                {traders?.reduce((sum, t) => sum + t.totalVolume, 0).toLocaleString()} ALGO
                            </p>
                        </Card>

                        <Card className="unified-card p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Trophy className="h-4 w-4 text-primary" />
                                <p className="text-sm text-muted-foreground">Active Traders</p>
                            </div>
                            <p className="text-2xl font-bold">{traders?.length || 0}</p>
                        </Card>

                        <Card className="unified-card p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Award className="h-4 w-4 text-primary" />
                                <p className="text-sm text-muted-foreground">Avg Win Rate</p>
                            </div>
                            <p className="text-2xl font-bold">
                                {traders ? (traders.reduce((sum, t) => sum + t.winRate, 0) / traders.length).toFixed(1) : 0}%
                            </p>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}

const mockTraders: Trader[] = [
    { id: "1", address: "ADDR1234567890ABC", totalPnl: 1250, totalVolume: 5000, winRate: 75, trades: 48, rank: 1 },
    { id: "2", address: "ADDR9876543210DEF", totalPnl: 980, totalVolume: 4200, winRate: 68, trades: 52, rank: 2 },
    { id: "3", address: "ADDRXYZ123456789", totalPnl: 720, totalVolume: 3800, winRate: 62, trades: 41, rank: 3 },
    { id: "4", address: "ADDR456789012ABC", totalPnl: 560, totalVolume: 2900, winRate: 58, trades: 35, rank: 4 },
    { id: "5", address: "ADDRABC987654321", totalPnl: 430, totalVolume: 2400, winRate: 55, trades: 29, rank: 5 },
    { id: "6", address: "ADDRDEF123456789", totalPnl: 320, totalVolume: 1900, winRate: 52, trades: 24, rank: 6 },
    { id: "7", address: "ADDRGHI987654321", totalPnl: 210, totalVolume: 1500, winRate: 48, trades: 18, rank: 7 },
];
