import { algosdk } from "./src/lib/algorand";
import { getContractState } from "./src/lib/algorand";

const APP_ID = 754320381;

async function checkState() {
    console.log("Fetching state for App ID:", APP_ID);
    try {
        const state = await getContractState(APP_ID);
        console.log("Global State:", state);

        if (state.expiry) {
            console.log("Expiry Timestamp:", state.expiry);
            console.log("Expiry Date:", new Date(Number(state.expiry) * 1000).toLocaleString());
            console.log("Current Date:", new Date().toLocaleString());
        } else {
            console.warn("⚠️ 'expiry' key not found in global state!");
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

checkState();
