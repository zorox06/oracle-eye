# APOLY - Decentralized Prediction Market Platform

## 🎉 Platform Complete & Live on TestNet!

**Oracle Eye (APOLY)** is a fully functional decentralized prediction market platform built on Algorand blockchain with real-time trading capabilities.

---

## ✅ What's Working

### Core Features
- ✅ **Pera Wallet Integration** - Seamless wallet connection and signing
- ✅ **Smart Contract Interaction** - Opt-in, betting (YES/NO), claiming winnings
- ✅ **Real-time Market Data** - Auto-refreshing prices, volumes, and pools
- ✅ **Admin Dashboard** - Market creation and management
- ✅ **Oracle System** - Multi-source price feeds (CoinGecko, Binance, CryptoCompare)
- ✅ **Database Integration** - Supabase for market storage and real-time updates
- ✅ **Authentication** - Supabase Auth with email/password

### Trading Features
- ✅ **Live Orderbook** - Real-time YES/NO order display
- ✅ **Market Stats** - Live prices, volumes, and pool sizes
- ✅ **Price Charts** - Visual representation of market prices
- ✅ **Market Depth** - Liquidity distribution visualization
- ✅ **Auto-refresh** - Data updates every 3 seconds
- ✅ **Real-time Subscriptions** - Instant updates on new trades

### Technical Stack
- **Frontend**: React + TypeScript + Vite
- **Styling**: TailwindCSS + shadcn/ui
- **Blockchain**: Algorand (TestNet)
- **Smart Contract**: PyTeal
- **Database**: Supabase (PostgreSQL)
- **Wallet**: Pera Wallet Connect
- **Oracle**: Edge Functions (Deno)

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Environment Variables
Create `.env.local`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_ALGORAND_APP_ID=754320381
VITE_ADMIN_ACCESS_KEY=oracle-admin-host-key

```

### 3. Run Development Server
```bash
npm run dev
```

Platform runs on: **http://localhost:8081**

---

## 📱 Key Pages

### Homepage (`/`)
- Market overview
- Live oracle price feeds
- Quick navigation

### Markets (`/markets`)
- Browse all active markets
- Filter by status
- Quick trade access

### Trade (`/trade/:id`)
- **Real-time orderbook**
- **Live YES/NO prices**
- **Market stats & volume**
- **Price charts**
- **Betting interface**
- **Market depth visualization**

### Admin (`/admin`)
- **Create Tab** - New market creation form
- **Markets Tab** - Manage existing markets
- **Oracle Tab** - Monitor oracle health
- **Contract Tab** - View contract info
- **Analytics Tab** - Platform statistics

---

## 🎮 How to Use

### For Traders

1. **Connect Wallet**
   - Click "Connect Pera Wallet"
   - Approve connection in Pera Wallet app

2. **Get TestNet ALGO**
   - Click "Get TestNet ALGO" button
   - Or use: https://bank.testnet.algorand.network/

3. **Opt into Contract** (One-time)
   - Go to any market
   - Click "Opt In Now"
   - Approve transaction (~0.1 ALGO fee)

4. **Place a Bet**
   - Enter amount in ALGO
   - Click "Bet YES" or "Bet NO"
   - Approve transaction in Pera Wallet
   - Watch your position appear in orderbook!

5. **View Real-time Data**
   - Prices update automatically
   - See all orders in orderbook
   - Monitor pool sizes
   - Track market depth

### For Admins

1. **Access Dashboard**
   - Go to `/admin`
   - Enter the **Host Key** (default: `oracle-admin-host-key`)
   - Or configure your own key via environment variables

2. **Create Market**
   - Click "Create" tab
   - Fill in:
     - Title
     - Description
     - Asset (BTC/ETH/ALGO)
     - Strike Price
     - Expiry Date
   - Click "Create Market"

3. **Monitor Markets**
   - View all markets
   - Check oracle status
   - View contract balance
   - See platform analytics

---

## 🔧 Smart Contract Details

**App ID**: `754320381` (TestNet)

### Contract Functions
- `opt_in()` - User opts into contract
- `bet_yes(payment)` - Place YES bet
- `bet_no(payment)` - Place NO bet
- `resolve(price)` - Admin resolves market
- `claim()` - Winners claim earnings

### State Structure
```python
Global:
- yes_pool: Total ALGO in YES pool
- no_pool: Total ALGO in NO pool
- resolved: Boolean
- winning_side: 0=NO, 1=YES

Local:
- yes: User's YES position (microALGO)
- no: User's NO position (microALGO)
```

---

## 📊 Real-Time Features

### Market Data Hook (`useRealtimeMarketData`)
```typescript
const { marketData, positions, loading, refresh } = useRealtimeMarketData(marketId, 3000);
```

**Returns:**
- `marketData` - YES/NO prices, pools, volume
- `positions` - Recent orders with user, side, amount
- `loading` - Loading state
- `refresh()` - Manual refresh function

**Features:**
- ✅ Auto-refresh every 3 seconds
- ✅ Contract state polling
- ✅ Database subscriptions
- ✅ Real-time position updates

###OrderBook Component
Shows:
- YES/NO volume totals
- Recent orders (last 20)
- User addresses (truncated)
- Prices and timestamps
- Live badge indicator

### Market Stats
- Current YES price (in cents)
- Current NO price (in cents)
- Total volume (ALGO + USD)
- Pool sizes for both sides

---

## 🗄️ Database Schema

### `markets`
```sql
- id: UUID
- title: TEXT
- description: TEXT
- asset_symbol: TEXT
- strike_price: NUMERIC
- expiry_at: TIMESTAMPTZ
- status: TEXT (open/closed/resolved)
- created_at: TIMESTAMPTZ
```

### `blockchain_positions`
```sql
- id: UUID
- market_id: UUID
- user_address: TEXT
- position_type: TEXT (YES/NO)
- amount: BIGINT (microALGO)
- entry_price: NUMERIC
- tx_id: TEXT
- created_at: TIMESTAMPTZ
```

### `oracle_submissions`
```sql
- id: UUID
- market_id: UUID
- oracle_node: TEXT
- price: NUMERIC
- confidence: NUMERIC
- timestamp: TIMESTAMPTZ
```

---

## 🎨 Design Features

- **120fps animations** - Buttery smooth interactions
- **Dark mode** - Professional trading interface
- **Glassmorphism** - Modern card designs
- **Responsive** - Works on all devices
- **Real-time updates** - Live data everywhere
- **Visual feedback** - Loading states, toasts, badges

---

## 🔐 Security

- ✅ Row Level Security (RLS) on all tables
- ✅ Admin email verification
- ✅ Wallet signature verification
- ✅ Transaction confirmation waiting
- ✅ Input validation
- ✅ CORS protection

---

## 📈 Next Steps

### Production Deployment
1. Deploy contract to MainNet
2. Update `VITE_ALGORAND_APP_ID`
3. Set up production Supabase project
4. Configure custom domain
5. Enable real USD oracle feeds

### Feature Enhancements
- Historical price charts
- User portfolio page
- Leaderboard
- Market categories
- Advanced order types
- Liquidity pools
- Governance token

---

## 🐛 Troubleshooting

### "Opt-in failed"
- Check wallet balance (need ~0.1 ALGO)
- Ensure wallet is connected
- Try disconnecting/reconnecting wallet

### "Market not found"
- Create a market first in `/admin`
- Check market ID in URL

### Real-time data not updating
- Verify database tables created (run migration SQL)
- Check browser console for errors
- Refresh the page

### Contract errors
- Verify APP_ID in `.env.local`
- Check contract exists on TestNet
- Ensure wallet has ALGO

---

## 📞 Support

- **Smart Contract**: `754320381` on Algorand TestNet
- **Admin Email**: newarcstyle@gmail.com
- **Explorer**: https://testnet.explorer.perawallet.app/

---

**Built with ❤️ using Algorand, React, and Supabase**

Platform is **LIVE** and **FULLY FUNCTIONAL** on Algorand TestNet! 🚀
