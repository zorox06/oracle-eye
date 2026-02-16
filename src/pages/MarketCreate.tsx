import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";

import { useIsAdmin } from "@/hooks/use-is-admin";
import { useWallet } from "@/providers/WalletProvider";
import { deployContract } from "@/lib/algorand";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  title: z.string().trim().min(6).max(120),
  description: z.string().trim().max(600).optional(),
  asset_symbol: z.string().trim().min(2).max(10).default("BTC"),
  strike_price: z.coerce.number().positive().max(1_000_000_000),
  expiry_at: z.string().min(1), // datetime-local string
  app_id: z.coerce.number().optional(),
});

type Values = z.infer<typeof schema>;

export default function MarketCreate() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const { isConnected, address, peraWallet } = useWallet();
  const [isDeploying, setIsDeploying] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "Will BTC price be ≥ $105,000 at expiry?",
      description: "Resolves YES if AlgoOracle aggregated price is greater than or equal to the strike at expiry time.",
      asset_symbol: "BTC",
      strike_price: 105000,
      expiry_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    },
  });

  const onSubmit = async (values: Values) => {
    if (!user) return;
    if (!isAdmin.data) {
      toast({ title: "Admin required", description: "Only admins can create markets.", variant: "destructive" });
      return;
    }

    if (!isConnected || !address || !peraWallet) {
      toast({ title: "Wallet required", description: "Please connect your wallet to deploy the contract.", variant: "destructive" });
      return;
    }

    setIsDeploying(true);
    let appId = null;

    try {
      const expiryTimestamp = Math.floor(new Date(values.expiry_at).getTime() / 1000);

      toast({ title: "Deploying Contract", description: "Please sign the transaction in your wallet..." });

      appId = await deployContract(
        values.asset_symbol,
        values.strike_price,
        expiryTimestamp,
        address,
        peraWallet
      );

      toast({ title: "Contract Deployed!", description: `App ID: ${appId}` });

    } catch (e: any) {
      console.error("Deploy failed:", e);
      toast({ title: "Deployment Failed", description: e.message || "Unknown error", variant: "destructive" });
      setIsDeploying(false);
      return;
    }

    const expiryIso = new Date(values.expiry_at).toISOString();

    const { error } = await supabase.from("markets").insert({
      title: values.title,
      description: values.description ?? null,
      asset_symbol: values.asset_symbol.toUpperCase(),
      strike_price: values.strike_price,
      expiry_at: expiryIso,
      created_by: user.id,
      app_id: appId
    });

    if (error) {
      toast({ title: "Create failed", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Market created", description: "Market is now open (order book wiring comes next)." });
    navigate("/markets");
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Admin</p>
            <h1 className="text-3xl font-semibold tracking-tight">Create Market</h1>
            <p className="text-sm text-muted-foreground">Scalar market (YES if oracle price ≥ strike at expiry).</p>
          </div>
          <Button asChild variant="secondary">
            <Link to="/markets">Back</Link>
          </Button>
        </header>

        {!isAdmin.isLoading && !isAdmin.data ? (
          <Card className="mt-6 border-border/60 bg-card/50 p-5 text-sm text-muted-foreground">
            You’re signed in, but not an admin. Ask an existing admin to grant your account the <span className="font-medium text-foreground">admin</span> role.
          </Card>
        ) : null}

        <Card className="mt-6 border-border/60 bg-card/50 p-6 backdrop-blur supports-[backdrop-filter]:bg-card/40">
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Will BTC price be ≥ $105,000 at expiry?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={4} placeholder="Resolution details, context, and edge cases…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="asset_symbol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset</FormLabel>
                      <FormControl>
                        <Input placeholder="BTC" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="strike_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Strike price (USD)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="expiry_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry (UTC)</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="app_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>App ID (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Leave empty to auto-deploy new contract"
                        type="number"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={!isAdmin.data || isDeploying}>
                {isDeploying ? (
                  <>Deploying Contract...</>
                ) : (
                  "Create market & Deploy Contract"
                )}
              </Button>
            </form>
          </Form>
        </Card>
      </main>
    </div>
  );
}
