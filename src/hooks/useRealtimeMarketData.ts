import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getContractState } from '@/lib/algorand';

interface MarketData {
    yesPool: number;
    noPool: number;
    totalVolume: number;
    yesPrice: number;
    noPrice: number;
    lastUpdate: Date;
}

interface Position {
    id: string;
    user_address: string;
    side: 'yes' | 'no';
    amount: number;
    created_at: string;
}

export function useRealtimeMarketData(marketId: string, appId: number, refreshInterval = 5000) {
    const [marketData, setMarketData] = useState<MarketData>({
        yesPool: 0,
        noPool: 0,
        totalVolume: 0,
        yesPrice: 0.5,
        noPrice: 0.5,
        lastUpdate: new Date()
    });
    const [positions, setPositions] = useState<Position[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch contract state from the blockchain
    const fetchContractData = async () => {
        try {
            if (!appId) {
                console.warn('No App ID provided');
                return;
            }

            const state = await getContractState(appId);

            if (!state || typeof state !== 'object') {
                console.warn('Invalid contract state');
                return;
            }

            const yesPool = state.pool_yes || 0;
            const noPool = state.pool_no || 0;
            const totalVolume = yesPool + noPool;

            const yesPrice = totalVolume > 0 ? noPool / totalVolume : 0.5;
            const noPrice = totalVolume > 0 ? yesPool / totalVolume : 0.5;

            setMarketData({
                yesPool: yesPool / 1_000_000,
                noPool: noPool / 1_000_000,
                totalVolume: totalVolume / 1_000_000,
                yesPrice,
                noPrice,
                lastUpdate: new Date()
            });
        } catch (error) {
            console.error('Failed to fetch contract data:', error);
        }
    };

    // Fetch positions from database
    const fetchPositions = async () => {
        try {
            console.log('🔍 Fetching positions for market:', marketId);

            const { data, error } = await (supabase as any)
                .from('positions')
                .select('*')
                .eq('market_id', marketId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('❌ Failed to fetch positions:', error);
                return;
            }

            console.log('✅ Raw positions from DB:', data);

            // Transform database positions to match OrderBook interface
            const transformedPositions = (data || []).map((pos: any) => ({
                user: `${pos.user_address.slice(0, 6)}...${pos.user_address.slice(-4)}`,
                side: pos.side.toUpperCase() as 'YES' | 'NO',
                amount: pos.amount / 1_000_000, // Convert microALGO to ALGO
                timestamp: new Date(pos.created_at),
                price: 0.5 // Default price, could calculate from pool ratios
            }));

            console.log('✅ Transformed positions:', transformedPositions);
            setPositions(transformedPositions);
        } catch (error) {
            console.error('❌ Failed to fetch positions:', error);
        }
    };

    const refresh = async () => {
        await Promise.all([fetchContractData(), fetchPositions()]);
    };

    // Initial load
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await refresh();
            setLoading(false);
        };
        loadData();
    }, [marketId, appId]);

    // Auto-refresh
    useEffect(() => {
        const interval = setInterval(() => {
            refresh();
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [marketId, appId, refreshInterval]);

    // Real-time subscription for positions
    useEffect(() => {
        const channel = supabase
            .channel(`market-${marketId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'positions',
                    filter: `market_id=eq.${marketId}`
                },
                () => {
                    fetchPositions();
                    fetchContractData(); // Also refresh contract data when new bet is placed
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [marketId]);

    return {
        marketData,
        positions,
        loading,
        refresh
    };
}
