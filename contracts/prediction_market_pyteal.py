"""
Algorand Prediction Market Smart Contract - PyTeal Implementation

This contract manages binary prediction markets where users bet on whether
an asset price will be above or below a strike price at expiry.

Features:
- Non-custodial escrow (all ALGO held by contract)
- Local state tracking per user
- Oracle-triggered resolution
- Proportional winner payouts
"""

from pyteal import *

def approval_program():
    # Global state keys
    asset_symbol_key = Bytes("asset")
    strike_price_key = Bytes("strike")
    expiry_key = Bytes("expiry")
    pool_yes_key = Bytes("pool_yes")
    pool_no_key = Bytes("pool_no")
    resolved_key = Bytes("resolved")
    outcome_key = Bytes("outcome")
    oracle_key = Bytes("oracle")

    # Local state keys
    yes_amount_key = Bytes("yes")
    no_amount_key = Bytes("no")

    # Initialize on creation
    on_creation = Seq([
        App.globalPut(asset_symbol_key, Txn.application_args[0]),
        App.globalPut(strike_price_key, Btoi(Txn.application_args[1])),
        App.globalPut(expiry_key, Btoi(Txn.application_args[2])),
        App.globalPut(pool_yes_key, Int(0)),
        App.globalPut(pool_no_key, Int(0)),
        App.globalPut(resolved_key, Int(0)),
        App.globalPut(outcome_key, Int(0)),
        App.globalPut(oracle_key, Txn.sender()),
        Approve()
    ])

    # User opts in (required for local state)
    on_opt_in = Seq([
        App.localPut(Txn.sender(), yes_amount_key, Int(0)),
        App.localPut(Txn.sender(), no_amount_key, Int(0)),
        Approve()
    ])

    # Bet YES - must be grouped with payment transaction
    bet_yes = Seq([
        Assert(App.globalGet(resolved_key) == Int(0)),
        Assert(Global.latest_timestamp() < App.globalGet(expiry_key)),
        Assert(Gtxn[Txn.group_index() - Int(1)].type_enum() == TxnType.Payment),
        Assert(Gtxn[Txn.group_index() - Int(1)].receiver() == Global.current_application_address()),
        Assert(Gtxn[Txn.group_index() - Int(1)].amount() > Int(0)),
        
        App.localPut(
            Txn.sender(),
            yes_amount_key,
            App.localGet(Txn.sender(), yes_amount_key) + Gtxn[Txn.group_index() - Int(1)].amount()
        ),
        App.globalPut(
            pool_yes_key,
            App.globalGet(pool_yes_key) + Gtxn[Txn.group_index() - Int(1)].amount()
        ),
        Approve()
    ])

    # Bet NO - must be grouped with payment transaction
    bet_no = Seq([
        Assert(App.globalGet(resolved_key) == Int(0)),
        Assert(Global.latest_timestamp() < App.globalGet(expiry_key)),
        Assert(Gtxn[Txn.group_index() - Int(1)].type_enum() == TxnType.Payment),
        Assert(Gtxn[Txn.group_index() - Int(1)].receiver() == Global.current_application_address()),
        Assert(Gtxn[Txn.group_index() - Int(1)].amount() > Int(0)),
        
        App.localPut(
            Txn.sender(),
            no_amount_key,
            App.localGet(Txn.sender(), no_amount_key) + Gtxn[Txn.group_index() - Int(1)].amount()
        ),
        App.globalPut(
            pool_no_key,
            App.globalGet(pool_no_key) + Gtxn[Txn.group_index() - Int(1)].amount()
        ),
        Approve()
    ])

    # Resolve market (oracle only, after expiry)
    resolve = Seq([
        Assert(Txn.sender() == App.globalGet(oracle_key)),
        Assert(Global.latest_timestamp() >= App.globalGet(expiry_key)),
        Assert(App.globalGet(resolved_key) == Int(0)),
        
        App.globalPut(resolved_key, Int(1)),
        App.globalPut(
            outcome_key,
            If(
                Btoi(Txn.application_args[1]) >= App.globalGet(strike_price_key),
                Int(1),  # YES wins
                Int(0)   # NO wins
            )
        ),
        Approve()
    ])

    # Claim winnings
    user_yes = App.localGet(Txn.sender(), yes_amount_key)
    user_no = App.localGet(Txn.sender(), no_amount_key)
    pool_yes = App.globalGet(pool_yes_key)
    pool_no = App.globalGet(pool_no_key)
    total_pool = pool_yes + pool_no
    outcome = App.globalGet(outcome_key)

    payout = If(
        outcome == Int(1),  # YES won
        If(
            And(user_yes > Int(0), pool_yes > Int(0)),
            (user_yes * total_pool) / pool_yes,
            Int(0)
        ),
        If(  # NO won
            And(user_no > Int(0), pool_no > Int(0)),
            (user_no * total_pool) / pool_no,
            Int(0)
        )
    )

    claim = Seq([
        Assert(App.globalGet(resolved_key) == Int(1)),
        Assert(payout > Int(0)),
        
        # Reset user state to prevent double claims
        App.localPut(Txn.sender(), yes_amount_key, Int(0)),
        App.localPut(Txn.sender(), no_amount_key, Int(0)),
        
        # Send payout
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.Payment,
            TxnField.receiver: Txn.sender(),
            TxnField.amount: payout,
            TxnField.fee: Int(0)
        }),
        InnerTxnBuilder.Submit(),
        Approve()
    ])

    # Router
    program = Cond(
        [Txn.application_id() == Int(0), on_creation],
        [Txn.on_completion() == OnComplete.OptIn, on_opt_in],
        [Txn.on_completion() == OnComplete.CloseOut, Approve()],
        [Txn.on_completion() == OnComplete.UpdateApplication, Reject()],
        [Txn.on_completion() == OnComplete.DeleteApplication, Reject()],
        [Txn.application_args[0] == Bytes("bet_yes"), bet_yes],
        [Txn.application_args[0] == Bytes("bet_no"), bet_no],
        [Txn.application_args[0] == Bytes("resolve"), resolve],
        [Txn.application_args[0] == Bytes("claim"), claim],
    )

    return program

def clear_state_program():
    return Approve()

if __name__ == "__main__":
    with open("contracts/approval.teal", "w") as f:
        compiled = compileTeal(approval_program(), mode=Mode.Application, version=8)
        f.write(compiled)
    
    with open("contracts/clear.teal", "w") as f:
        compiled = compileTeal(clear_state_program(), mode=Mode.Application, version=8)
        f.write(compiled)
    
    print("✅ Compiled to TEAL successfully!")
    print("   - contracts/approval.teal")
    print("   - contracts/clear.teal")
