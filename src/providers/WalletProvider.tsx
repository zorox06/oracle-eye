import { PeraWalletConnect } from "@perawallet/connect";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";

interface WalletContextType {
    isConnected: boolean;
    address: string | null;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    peraWallet: PeraWalletConnect | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Initialize PeraWalletConnect
let _peraWallet: PeraWalletConnect | null = null;

function getPeraWallet() {
    if (!_peraWallet) {
        try {
            _peraWallet = new PeraWalletConnect({
                chainId: 416002, // TestNet
                shouldShowSignTxnToast: true,
            });
        } catch (error) {
            console.error("Failed to initialize PeraWalletConnect", error);
        }
    }
    return _peraWallet;
}

export function WalletProvider({ children }: { children: ReactNode }) {
    const [address, setAddress] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const wallet = getPeraWallet();
        if (!wallet) return;

        // Reconnect to session on mount
        wallet
            .reconnectSession()
            .then((accounts) => {
                wallet.connector?.on("disconnect", handleDisconnect);

                if (accounts.length) {
                    console.log("✅ Reconnected to wallet:", accounts[0]);
                    setAddress(accounts[0]);
                }
            })
            .catch((e) => console.error("Reconnect error:", e));

        return () => {
            wallet.connector?.off("disconnect");
        };
    }, []);

    const handleDisconnect = () => {
        setAddress(null);
        toast({ title: "Disconnected", description: "Wallet disconnected successfully" });
    };

    const connect = async () => {
        const wallet = getPeraWallet();
        if (!wallet) {
            toast({ title: "Error", description: "Wallet not initialized", variant: "destructive" });
            return;
        }

        try {
            const accounts = await wallet.connect();
            wallet.connector?.on("disconnect", handleDisconnect);

            if (accounts.length > 0) {
                setAddress(accounts[0]);
                console.log("✅ Connected wallet:", accounts[0]);
                toast({ title: "Connected", description: `Wallet connected: ${accounts[0].slice(0, 8)}...` });
            }
        } catch (error: any) {
            console.error("Connection error:", error);
            if (error?.message?.includes("Session currently connected")) {
                toast({ title: "Already connected", description: "Wallet is already connected" });
            } else {
                toast({ title: "Connection failed", description: error.message, variant: "destructive" });
            }
        }
    };

    const disconnect = async () => {
        const wallet = getPeraWallet();
        if (wallet) {
            await wallet.disconnect();
        }
        handleDisconnect();
    };

    const value: WalletContextType = {
        isConnected: !!address,
        address,
        connect,
        disconnect,
        peraWallet: getPeraWallet(),
    };

    console.log("📦 WalletProvider value:", value);

    return (
        <WalletContext.Provider value={value}>
            {children}
        </WalletContext.Provider>
    );
}

export function useWallet(): WalletContextType {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error("useWallet must be used within a WalletProvider");
    }
    console.log("🔌 useWallet returning:", context);
    return context;
}
