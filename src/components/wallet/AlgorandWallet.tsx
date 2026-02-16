import { useState, useEffect } from "react";
import { useWallet } from "@/providers/WalletProvider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Copy, ExternalLink, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function AlgorandWallet() {
    const { isConnected, address, connect, disconnect } = useWallet();
    const [balance, setBalance] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (address && isConnected) {
            fetchBalance();
        } else {
            setBalance(null);
        }
    }, [address, isConnected]);

    const fetchBalance = async () => {
        if (!address) return;

        setLoading(true);
        try {
            // Using public Algorand TestNet API
            const response = await fetch(`https://testnet-api.algonode.cloud/v2/accounts/${address}`);

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            const algoBalance = data.amount / 1_000_000; // Convert microALGO to ALGO
            setBalance(algoBalance);

            console.log("✅ Balance fetched:", algoBalance, "ALGO");
        } catch (error) {
            console.error("❌ Failed to fetch balance:", error);
            toast.error("Failed to fetch balance", {
                description: "Check console for details"
            });
            setBalance(0);
        } finally {
            setLoading(false);
        }
    };

    const copyAddress = () => {
        if (address) {
            navigator.clipboard.writeText(address);
            setCopied(true);
            toast.success("Address copied!");
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const openExplorer = () => {
        if (address) {
            window.open(`https://testnet.explorer.perawallet.app/address/${address}`, '_blank');
        }
    };

    if (!isConnected) {
        return (
            <Card className="unified-card p-4">
                <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                        <Wallet className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-sm">Algorand Wallet</p>
                        <p className="text-xs text-muted-foreground">Not connected</p>
                    </div>
                    <Button onClick={connect} size="sm" className="btn-primary">
                        Connect
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <Card className="unified-card p-4">
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="rounded-full bg-green-500/10 p-2">
                            <Wallet className="h-4 w-4 text-green-500" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm">Algorand Wallet</p>
                            <Badge variant="outline" className="text-xs gap-1 mt-1">
                                <CheckCircle className="h-3 w-3" />
                                TestNet
                            </Badge>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={fetchBalance}
                        disabled={loading}
                        title="Refresh balance"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>

                {/* Balance */}
                <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Balance</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold font-mono">
                            {loading ? (
                                <span className="text-muted-foreground">Loading...</span>
                            ) : balance !== null ? (
                                `${balance.toFixed(4)} ALGO`
                            ) : (
                                <span className="text-muted-foreground">--- ALGO</span>
                            )}
                        </p>
                        {balance === 0 && !loading && (
                            <AlertCircle className="h-4 w-4 text-yellow-500" title="No balance - get TestNet ALGO" />
                        )}
                    </div>
                    {balance !== null && balance > 0 && (
                        <p className="text-xs text-muted-foreground">
                            ≈ ${(balance * 0.25).toFixed(2)} USD
                        </p>
                    )}
                </div>

                {/* Address */}
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Address</p>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs bg-background/50 rounded px-2 py-1.5 font-mono truncate">
                            {address}
                        </code>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={copyAddress}
                            className="shrink-0"
                            title="Copy address"
                        >
                            {copied ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                                <Copy className="h-4 w-4" />
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={openExplorer}
                            className="shrink-0"
                            title="View on explorer"
                        >
                            <ExternalLink className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-border/40 flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open('https://bank.testnet.algorand.network/', '_blank')}
                        className="flex-1"
                    >
                        Get TestNet ALGO
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={disconnect}
                        className="flex-1"
                    >
                        Disconnect
                    </Button>
                </div>
            </div>
        </Card>
    );
}
