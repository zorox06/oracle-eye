import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export type OracleDataMode = "backend" | "browser";

export function OracleDataModeDialog({
  mode,
  onModeChange,
  cryptoCompareKey,
  onCryptoCompareKeyChange,
}: {
  mode: OracleDataMode;
  onModeChange: (mode: OracleDataMode) => void;
  cryptoCompareKey: string;
  onCryptoCompareKeyChange: (key: string) => void;
}) {
  const [draftKey, setDraftKey] = useState(cryptoCompareKey);
  const keyHint = useMemo(() => {
    if (!draftKey) return "Not set";
    if (draftKey.length <= 8) return "Set";
    return `${draftKey.slice(0, 4)}…${draftKey.slice(-4)}`;
  }, [draftKey]);

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open) setDraftKey(cryptoCompareKey);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">Data source</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Oracle data source</DialogTitle>
          <DialogDescription>
            Browser mode uses your own CryptoCompare key stored in this browser’s localStorage. It may be blocked by CORS or rate limits.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => onModeChange(v as OracleDataMode)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="backend">Backend</TabsTrigger>
            <TabsTrigger value="browser">Browser</TabsTrigger>
          </TabsList>

          <TabsContent value="backend" className="mt-4">
            <div className="rounded-lg border border-border/60 bg-card/40 p-4 text-sm text-muted-foreground">
              Recommended. Keeps API keys private and avoids CORS issues.
            </div>
          </TabsContent>

          <TabsContent value="browser" className="mt-4">
            <div className="grid gap-2">
              <Label htmlFor="cc-key">CryptoCompare API key</Label>
              <Input
                id="cc-key"
                value={draftKey}
                onChange={(e) => setDraftKey(e.target.value)}
                placeholder="Paste your CryptoCompare API key"
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">Current: {keyHint}</p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="secondary"
            onClick={() => {
              onCryptoCompareKeyChange("");
              setDraftKey("");
            }}
          >
            Clear key
          </Button>
          <Button
            onClick={() => {
              onCryptoCompareKeyChange(draftKey.trim());
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
