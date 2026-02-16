import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    BarChart3,
    Settings,
    Activity,
    AlertCircle,
    CheckCircle,
    Clock,
    TrendingUp,
    Users,
    Plus
} from "lucide-react";
import { isAdmin } from "@/lib/admin";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CreateMarketForm } from "@/components/admin/CreateMarketForm";

export default function Admin() {
    const [adminStatus, setAdminStatus] = useState<boolean | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        isAdmin().then(setAdminStatus);
    }, []);

    const { data: markets } = useQuery({
        queryKey: ["admin", "markets"],
        queryFn: async () => {
            const { data } = await supabase
                .from("markets")
                .select("*")
                .order("created_at", { ascending: false });
            return data || [];
        },
    });

    const { data: users } = useQuery({
        queryKey: ["admin", "users"],
        queryFn: async () => {
            const { count } = await supabase
                .from("profiles")
                .select("*", { count: "exact", head: true });
            return count || 0;
        },
    });

    if (adminStatus === null) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <Clock className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Verifying admin access...</p>
                </div>
            </div>
        );
    }

    if (!adminStatus) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background/95 backdrop-blur-sm">
                <Card className="max-w-md w-full p-8 border-primary/20 bg-background/50 shadow-xl">
                    <div className="text-center mb-6">
                        <AlertCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Admin Access</h2>
                        <p className="text-muted-foreground">
                            Enter the Host Key to access the admin dashboard.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="admin-key" className="text-sm font-medium">Host Key</label>
                            <input
                                id="admin-key"
                                type="password"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Enter server key..."
                                onChange={(e) => {
                                    const key = e.target.value;
                                    const envKey = import.meta.env.VITE_ADMIN_ACCESS_KEY || "oracle-admin-host-key";
                                    if (key === envKey) {
                                        setAdminStatus(true);
                                    }
                                }}
                            />
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    Or
                                </span>
                            </div>
                        </div>

                        <Button onClick={() => navigate("/")} variant="outline" className="w-full">
                            Return to Home
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    const stats = [
        {
            label: "Total Markets",
            value: markets?.length || 0,
            icon: BarChart3,
            color: "text-blue-500",
        },
        {
            label: "Active Markets",
            value: markets?.filter((m: any) => m.status === "open").length || 0,
            icon: Activity,
            color: "text-green-500",
        },
        {
            label: "Total Users",
            value: users,
            icon: Users,
            color: "text-purple-500",
        },
        {
            label: "Resolved",
            value: markets?.filter((m: any) => m.status === "resolved").length || 0,
            icon: CheckCircle,
            color: "text-yellow-500",
        },
    ];

    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header">
                <div className="content-container py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                            <p className="text-muted-foreground mt-1">
                                Manage markets, monitor oracle health, and view analytics
                            </p>
                        </div>
                        <Badge variant="outline" className="gap-2">
                            <Settings className="h-4 w-4" />
                            Admin Mode
                        </Badge>
                    </div>
                </div>
            </div>

            <main className="content-container py-8 space-y-8">
                {/* Stats Grid */}
                <div className="stat-grid stagger-container">
                    {stats.map((stat) => (
                        <Card key={stat.label} className="unified-card p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                                    <p className="text-3xl font-bold mt-2">{stat.value}</p>
                                </div>
                                <stat.icon className={`h-12 w-12 ${stat.color}`} />
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Main Tabs */}
                <Tabs defaultValue="create" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="create">
                            <Plus className="h-4 w-4 mr-2 hidden sm:inline" />
                            Create
                        </TabsTrigger>
                        <TabsTrigger value="markets">Markets</TabsTrigger>
                        <TabsTrigger value="oracle">Oracle</TabsTrigger>
                        <TabsTrigger value="contract">Contract</TabsTrigger>
                        <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    </TabsList>

                    {/* Create Market Tab */}
                    <TabsContent value="create" className="space-y-4 animate-fade-in">
                        <CreateMarketForm />
                    </TabsContent>

                    {/* Markets Tab */}
                    <TabsContent value="markets" className="space-y-4 animate-fade-in">
                        <h2 className="text-2xl font-semibold">Market Management</h2>

                        <div className="grid gap-4">
                            {markets?.map((market: any) => (
                                <Card key={market.id} className="unified-card p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-lg font-semibold">{market.title}</h3>
                                                <Badge variant={market.status === "open" ? "default" : "secondary"}>
                                                    {market.status}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{market.description}</p>
                                            <div className="flex items-center gap-4 text-sm">
                                                <span className="text-muted-foreground">
                                                    Strike: <span className="font-mono">${market.strike_price}</span>
                                                </span>
                                                <span className="text-muted-foreground">
                                                    Expiry: {new Date(market.expiry_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm">View</Button>
                                            {market.status === "open" && (
                                                <Button variant="outline" size="sm">Resolve</Button>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    {/* Oracle Health Tab */}
                    <TabsContent value="oracle" className="space-y-4 animate-fade-in">
                        <Card className="unified-card p-6">
                            <h3 className="text-xl font-semibold mb-4">Oracle Node Status</h3>
                            <div className="space-y-3">
                                {["CoinGecko", "Binance", "CryptoCompare"].map((node) => (
                                    <div key={node} className="flex items-center justify-between p-4 rounded-lg bg-background/50">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                            <span className="font-medium">{node}</span>
                                        </div>
                                        <Badge variant="outline" className="bg-green-500/10 text-green-500">
                                            Online
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </TabsContent>

                    {/* Contract State Tab */}
                    <TabsContent value="contract" className="space-y-4 animate-fade-in">
                        <Card className="unified-card p-6">
                            <h3 className="text-xl font-semibold mb-4">Smart Contract Info</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">APP ID:</span>
                                    <span className="font-mono">754320381</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Network:</span>
                                    <Badge variant="outline">TestNet</Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Contract Balance:</span>
                                    <span className="font-mono">5.0 ALGO</span>
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full mt-4"
                                    onClick={() => window.open('https://testnet.explorer.perawallet.app/application/754320381/', '_blank')}
                                >
                                    View on Explorer
                                </Button>
                            </div>
                        </Card>
                    </TabsContent>

                    {/* Analytics Tab */}
                    <TabsContent value="analytics" className="space-y-4 animate-fade-in">
                        <Card className="unified-card p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                <h3 className="text-xl font-semibold">Platform Analytics</h3>
                            </div>
                            <div className="h-64 flex items-center justify-center text-muted-foreground">
                                Analytics charts coming soon...
                            </div>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
