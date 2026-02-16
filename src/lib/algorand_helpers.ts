export async function getContractState(appId: number) {
    try {
        const info = await algodClient.getApplicationByID(appId).do();

        if (!info || !info.params) {
            console.warn('No app info found for:', appId);
            return {};
        }

        const state = info.params['global-state'];

        if (!state || !Array.isArray(state)) {
            console.warn('No global state found for app:', appId);
            return {};
        }

        const decoded: Record<string, any> = {};
        state.forEach((item: any) => {
            try {
                const key = Buffer.from(item.key, 'base64').toString();
                const val = item.value;
                decoded[key] = val.type === 1
                    ? Buffer.from(val.bytes, 'base64').toString()
                    : val.uint;
            } catch (err) {
                console.warn('Failed to decode state item:', err);
            }
        });

        return decoded;
    } catch (error) {
        console.error('getContractState error:', error);
        return {};
    }
}
