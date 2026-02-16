import { useEffect, useState } from "react";
import { useWallet } from "@/providers/WalletProvider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wallet, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { betYes, betNo, hasOptedIn, optInToContract } from "@/lib/algorand";
import { supabase } from "@/integrations/supabase/client";


interface MarketBettingProps {
    marketId: string;
    appId: number;
    yesPool: number;
    noPool: number;
    onBetComplete?: () => void;
}

export function MarketBetting({ marketId, appId, yesPool, noPool, onBetComplete }: MarketBettingProps) {
    const { isConnected, address, connect, peraWallet } = useWallet();
    const [amount, setAmount] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [outcome, setOutcome] = useState<"yes" | "no" | null>(null);
    const [isOptedIn, setIsOptedIn] = useState(false);
    const [checkingOptIn, setCheckingOptIn] = useState(false);

    const totalPool = yesPool + noPool;
    const yesProb = totalPool === 0 ? 50 : (noPool / totalPool) * 100;
    const noProb = totalPool === 0 ? 50 : (yesPool / totalPool) * 100;

    // Check opt-in status when wallet connects
    useEffect(() => {
        console.log("🔍 Wallet status:", { isConnected, address, peraWallet: !!peraWallet });

        if (address && isConnected && peraWallet && appId) {
            setCheckingOptIn(true);
            hasOptedIn(appId, address)
                .then((opted) => {
                    console.log("✅ Opt-in check result:", opted);
                    setIsOptedIn(opted);
                })
                .catch(console.error)
                .finally(() => setCheckingOptIn(false));
        }
    }, [address, isConnected, peraWallet, appId]);

    const handleOptIn = async () => {
        console.log("🎯 handleOptIn called");
        console.log("📊 State:", { address, peraWallet: !!peraWallet, appId });

        if (!appId) {
            toast.error("Contract not deployed", {
                description: "This market does not have a smart contract yet."
            });
            return;
        }

        if (!address) {
            toast.error("No wallet address", {
                description: "Try disconnecting and reconnecting wallet"
            });
            return;
        }

        if (!peraWallet) {
            toast.error("Wallet not initialized");
            return;
        }

        setIsSubmitting(true);
        try {
            await optInToContract(appId, address, peraWallet);
            setIsOptedIn(true);
            toast.success("Opted in successfully!");
        } catch (error: any) {
            console.error("❌ handleOptIn error:", error);

            // Handle specific "already opted in" error
            const errorMessage = error?.message || String(error);
            if (errorMessage.includes("already opted in")) {
                setIsOptedIn(true);
                toast.success("Already opted in! You can now bet.");
                return;
            }

            toast.error("Opt-in failed", {
                description: errorMessage
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBet = async (side: "yes" | "no") => {
        if (!appId) {
            toast.error("Contract not deployed");
            return;
        }
        if (!amount || Number(amount) <= 0) {
            toast.error("Invalid amount");
            return;
        }

        if (!address || !peraWallet) {
            toast.error("Wallet not connected");
            return;
        }

        if (!isOptedIn) {
            toast.error("Please opt in first");
            return;
        }

        setOutcome(side);
        setIsSubmitting(true);

        try {
            const amountMicroAlgo = Math.floor(Number(amount) * 1_000_000);

            const txId = side === "yes"
                ? await betYes(appId, address, amountMicroAlgo, peraWallet)
                : await betNo(appId, address, amountMicroAlgo, peraWallet);

            // Save position to database
            console.log('💾 Saving position to database:', { marketId, address, side, amountMicroAlgo, txId });

            try {
                const { error: dbError } = await (supabase as any)
                    .from('positions')
                    .insert({
                        market_id: marketId,
                        user_address: address,
                        side: side,
                        amount: amountMicroAlgo,
                        tx_id: txId
                    });

                if (dbError) {
                    console.error('❌ Failed to save position to database:', dbError);
                } else {
                    console.log('✅ Position saved to database successfully!');
                }
            } catch (dbErr) {
                console.error('❌ Database error:', dbErr);
            }

            toast.success(`Bet placed: ${amount} ALGO on ${side.toUpperCase()}`, {
                description: `Tx: ${txId.slice(0, 12)}...`,
                action: {
                    label: "View",
                    onClick: () => window.open(`https://testnet.explorer.perawallet.app/tx/${txId}`, '_blank')
                }
            });
            setAmount("");

            // Refresh market data
            if (onBetComplete) {
                console.log('🔄 Refreshing market data in 2 seconds...');
                setTimeout(() => {
                    console.log('🔄 Fetching updated blockchain data...');
                    onBetComplete();
                }, 2000);
            }
        } catch (error: any) {
            console.error(error);
            toast.error("Transaction failed", {
                description: error?.message || "Check console"
            });
        } finally {
            setIsSubmitting(false);
            setOutcome(null);
        }
    };

    if (!isConnected) {
        return (
            <Card className="unified-card p-6">
                <div className="text-center space-y-4">
                    <Wallet className="h-12 w-12 mx-auto text-muted-foreground" />
                    <div>
                        <h3 className="font-semibold mb-2">Connect Wallet</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Connect your Pera Wallet to start trading
                        </p>
                    </div>
                    <Button onClick={connect} className="w-full btn-primary">
                        Connect Pera Wallet
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <Card className="unified-card p-6 space-y-6">
            {/* Wallet Info */}
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
                <div>
                    <p className="text-xs text-muted-foreground">Connected</p>
                    <p className="font-mono text-sm">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                    </p>
                </div>
                {checkingOptIn ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : isOptedIn ? (
                    <Badge variant="outline" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Opted In
                    </Badge>
                ) : (
                    <Badge variant="secondary" className="gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Not Opted In
                    </Badge>
                )}
            </div>

            {/* Opt-in Required */}
            {!isOptedIn && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                    <h4 className="text-sm font-medium mb-2">Action Required</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                        {appId ? "Opt into the contract to enable betting (one-time action)." : "Contract not deployed yet."}
                    </p>
                    <Button
                        onClick={handleOptIn}
                        disabled={isSubmitting || !address || !appId}
                        size="sm"
                        className="w-full"
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (appId ? "Opt In Now" : "Waiting for Contract")}
                    </Button>
                </div>
            )}

            {/* Odds Display */}
            <div className="space-y-3">
                <h3 className="font-semibold">Current Odds</h3>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">YES</p>
                        <p className="text-2xl font-bold text-green-500">{yesProb.toFixed(1)}%</p>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">NO</p>
                        <p className="text-2xl font-bold text-red-500">{noProb.toFixed(1)}%</p>
                    </div>
                </div>
            </div>

            {/* Betting Input */}
            <div className="space-y-3">
                <label className="text-sm font-medium">Bet Amount (ALGO)</label>
                <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={isSubmitting || !isOptedIn}
                    className="text-lg font-mono"
                    min="0"
                    step="0.1"
                />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
                <Button
                    onClick={() => handleBet("yes")}
                    disabled={isSubmitting || !isOptedIn || !amount}
                    className="bg-green-600 hover:bg-green-700"
                >
                    {isSubmitting && outcome === "yes" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        "Bet YES"
                    )}
                </Button>
                <Button
                    onClick={() => handleBet("no")}
                    disabled={isSubmitting || !isOptedIn || !amount}
                    className="bg-red-600 hover:bg-red-700"
                >
                    {isSubmitting && outcome === "no" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        "Bet NO"
                    )}
                </Button>
            </div>

            {/* Contract Info */}
            <div className="pt-4 border-t border-border/40">
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Contract</span>
                    <a
                        href={`https://testnet.explorer.perawallet.app/application/${appId}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary underline"
                    >
                        {appId}
                    </a>
                </div>
            </div>
        </Card>
    );
}
