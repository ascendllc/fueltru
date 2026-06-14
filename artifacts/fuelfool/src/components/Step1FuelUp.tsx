import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CheckCircle2 } from "lucide-react";
import { useGetGasPrice, getGetGasPriceQueryKey } from "@workspace/api-client-react";

const formSchema = z.object({
  zip: z.string().regex(/^\d{5}$/, "That ZIP doesn't look right — try 5 digits."),
});

interface Step1Props {
  isActive: boolean;
  isComplete: boolean;
  onComplete: (price: number) => void;
}

export function Step1FuelUp({ isActive, isComplete, onComplete }: Step1Props) {
  const [submittedZip, setSubmittedZip] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      zip: "",
    },
  });

  const { data: gasPriceData, isLoading, error } = useGetGasPrice(
    { zip: submittedZip! },
    { query: { enabled: !!submittedZip, queryKey: getGetGasPriceQueryKey({ zip: submittedZip! }) } }
  );

  function onSubmit(values: z.infer<typeof formSchema>) {
    setSubmittedZip(values.zip);
  }

  useEffect(() => {
    if (gasPriceData && isActive && !isComplete) {
      onComplete(gasPriceData.price);
    }
  }, [gasPriceData, isActive, isComplete]);

  if (!isActive && !isComplete) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative rounded-xl border bg-card p-6 shadow-sm transition-all duration-300 ${
        isActive && !isComplete ? "border-ring shadow-active" : "border-card-border"
      } ${isComplete ? "bg-card/50" : ""}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">
          <span className="mr-2 text-muted-foreground">1.</span> First, the bad news on gas prices.
        </h2>
        {isComplete && <CheckCircle2 className="h-6 w-6 text-success" />}
      </div>

      {!isComplete ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="zip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Where are you filling up?</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter 5-digit ZIP" {...field} data-testid="input-zip" className="max-w-xs" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && (
              <p className="text-sm text-destructive" data-testid="error-gas-price">
                Could not fetch gas price for this ZIP.
              </p>
            )}
            <Button
              type="submit"
              disabled={isLoading}
              className="hover-elevate hover:brightness-110 active:scale-95 transition-all"
              data-testid="button-submit-step1"
            >
              {isLoading ? "Checking..." : "Find Gas Price"}
            </Button>
          </form>
        </Form>
      ) : (
        <div className="flex flex-col space-y-2">
          <div className="text-sm text-muted-foreground">Local Gas Price (ZIP: {submittedZip})</div>
          <div className="text-3xl font-bold text-foreground" data-testid="display-gas-price">
            ${gasPriceData?.price.toFixed(2)}<span className="text-lg text-muted-foreground font-normal">/gal</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {gasPriceData?.state} • Source: U.S. Energy Information Administration
          </div>
        </div>
      )}
    </motion.div>
  );
}
