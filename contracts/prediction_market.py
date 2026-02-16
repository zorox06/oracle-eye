from algopy import (
    ARC4Contract,
    Global,
    Local,
    Txn,
    UInt64,
    arc4,
    gtxn,
    itxn,
    op,
    subroutine,
)

class PredictionMarket(ARC4Contract):
    def __init__(self) -> None:
        self.asset_symbol = ""
        self.strike_price = UInt64(0)  # USD cents
        self.expiry = UInt64(0)        # Unix timestamp
        self.pool_yes = UInt64(0)      # Total microAlgos
        self.pool_no = UInt64(0)       # Total microAlgos
        self.resolved = False
        self.outcome = False           # True = YES, False = NO
        self.oracle_address = Global.creator_address 

    @arc4.abimethod(allow_actions=["NoOp"], onCreate="require")
    def create(self, asset: str, strike: UInt64, expiry: UInt64) -> None:
        self.asset_symbol = asset
        self.strike_price = strike
        self.expiry = expiry
        self.pool_yes = UInt64(0)
        self.pool_no = UInt64(0)
        self.resolved = False

    @arc4.abimethod(allow_actions=["OptIn"])
    def opt_in(self) -> None:
        # User opts in to local state storage for their bets
        pass

    @arc4.abimethod
    def bet_yes(self, payment: gtxn.PaymentTransaction) -> None:
        assert not self.resolved, "Market already resolved"
        assert Global.latest_timestamp < self.expiry, "Market expired"
        assert payment.receiver == Global.current_application_address
        assert payment.amount > 0, "Bet amount must be positive"
        assert op.App.opted_in(Txn.sender, Global.current_application_id), "Must opt-in first"
        
        # Record bet in local state
        # storage schema: 0: yes_amount, 1: no_amount
        current_yes = op.App.local_get_ex(Txn.sender, Global.current_application_id, b"yes")
        iso_yes = current_yes[0] if current_yes[1] else UInt64(0)
        op.App.local_put(Txn.sender, b"yes", iso_yes + payment.amount)

        self.pool_yes += payment.amount

    @arc4.abimethod
    def bet_no(self, payment: gtxn.PaymentTransaction) -> None:
        assert not self.resolved, "Market already resolved"
        assert Global.latest_timestamp < self.expiry, "Market expired"
        assert payment.receiver == Global.current_application_address
        assert payment.amount > 0
        assert op.App.opted_in(Txn.sender, Global.current_application_id), "Must opt-in first"
        
        current_no = op.App.local_get_ex(Txn.sender, Global.current_application_id, b"no")
        iso_no = current_no[0] if current_no[1] else UInt64(0)
        op.App.local_put(Txn.sender, b"no", iso_no + payment.amount)
        
        self.pool_no += payment.amount

    @arc4.abimethod
    def resolve(self, price: UInt64) -> None:
        assert Txn.sender == self.oracle_address, "Only oracle can resolve"
        assert Global.latest_timestamp >= self.expiry, "Not yet expired"
        assert not self.resolved, "Already resolved"

        self.resolved = True
        self.outcome = price >= self.strike_price

    @arc4.abimethod
    def claim(self) -> UInt64:
        assert self.resolved, "Market not resolved"
        
        # Get user bets
        user_yes_ex = op.App.local_get_ex(Txn.sender, Global.current_application_id, b"yes")
        user_no_ex = op.App.local_get_ex(Txn.sender, Global.current_application_id, b"no")
        user_yes = user_yes_ex[0] if user_yes_ex[1] else UInt64(0)
        user_no = user_no_ex[0] if user_no_ex[1] else UInt64(0)
        
        payout = UInt64(0)

        # Winner takes proportional share of losing pool + their own bet
        if self.outcome: # YES Wins
            if user_yes > 0 and self.pool_yes > 0:
                # Share = (user_yes / pool_yes) * (pool_yes + pool_no)
                payout = (user_yes * (self.pool_yes + self.pool_no)) // self.pool_yes
             
             # Reset local state to prevent double claim
            op.App.local_put(Txn.sender, b"yes", UInt64(0))

        else: # NO Wins
            if user_no > 0 and self.pool_no > 0:
                 payout = (user_no * (self.pool_yes + self.pool_no)) // self.pool_no
            
            op.App.local_put(Txn.sender, b"no", UInt64(0))

        if payout > 0:
             itxn.Payment(
                 receiver=Txn.sender,
                 amount=payout,
                 fee=0 # Contract covers fee, or deduct? For min viable, contract covers.
             ).submit()

        return payout
