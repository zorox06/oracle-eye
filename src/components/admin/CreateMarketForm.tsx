import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export function CreateMarketForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        assetSymbol: "BTC",
        strikePrice: "",
        expiryDate: undefined as Date | undefined,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.expiryDate) {
            toast.error("Please select an expiry date");
            return;
        }

        setIsSubmitting(true);

        try {
            const { data, error } = await supabase.functions.invoke("market-create", {
                body: {
                    title: formData.title,
                    description: formData.description,
                    assetSymbol: formData.assetSymbol,
                    strikePrice: Number(formData.strikePrice),
                    expiryDate: formData.expiryDate.toISOString(),
                }
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            toast.success("Market created successfully!", {
                description: `${formData.title} is now live`,
            });

            // Reset form
            setFormData({
                title: "",
                description: "",
                assetSymbol: "BTC",
                strikePrice: "",
                expiryDate: undefined,
            });
        } catch (error) {
            console.error(error);
            toast.error("Failed to create market", {
                description: "Please try again",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="unified-card p-6">
            <h3 className="text-xl font-semibold mb-6">Create New Market</h3>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                    <Label htmlFor="title">Market Title *</Label>
                    <Input
                        id="title"
                        placeholder="e.g., Will BTC hit $100k by Dec 2025?"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                    />
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        placeholder="Market details and resolution criteria..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                    />
                </div>

                {/* Asset & Strike Price Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="asset">Asset *</Label>
                        <Select
                            value={formData.assetSymbol}
                            onValueChange={(value) => setFormData({ ...formData, assetSymbol: value })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                                <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                                <SelectItem value="ALGO">Algorand (ALGO)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="strike">Strike Price (USD) *</Label>
                        <Input
                            id="strike"
                            type="number"
                            placeholder="100000"
                            value={formData.strikePrice}
                            onChange={(e) => setFormData({ ...formData, strikePrice: e.target.value })}
                            required
                        />
                    </div>
                </div>

                {/* Expiry Date */}
                <div className="space-y-2">
                    <Label>Expiry Date & Time *</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !formData.expiryDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formData.expiryDate ? (
                                    format(formData.expiryDate, "PPP")
                                ) : (
                                    <span>Pick a date</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={formData.expiryDate}
                                onSelect={(date) => setFormData({ ...formData, expiryDate: date })}
                                initialFocus
                                disabled={(date) => date < new Date()}
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Submit Button */}
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full btn-primary"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Market...
                        </>
                    ) : (
                        "Create Market"
                    )}
                </Button>
            </form>
        </Card>
    );
}
