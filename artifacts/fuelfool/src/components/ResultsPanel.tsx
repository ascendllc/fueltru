import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useCostCounter } from "@/hooks/use-cost-counter";
import { useGetEvDealerships, getGetEvDealershipsQueryKey } from "@workspace/api-client-react";
import { Zap, MapPin, ExternalLink, Car } from "lucide-react";

interface ResultsPanelProps {
  gasPrice: number;
  mpg: number;
  distance: number;
  duration: string;
  zip: string;
  onReset: () => void;
}

const COMPARISONS = [
  { name: "gas station hot dogs", price: 2.50 },
  { name: "coffees", price: 6.00 },
  { name: "fancy lattes", price: 8.00 },
  { name: "carwashes", price: 12.00 },
  { name: "pizzas", price: 14.00 },
  { name: "movie tickets", price: 16.00 },
];

const EV_MPGE = 100;
const KWH_PER_GALLON_EQUIV = 33.7;
const ELECTRICITY_COST_PER_KWH = 0.16;
const EV_COST_PER_MILE = (KWH_PER_GALLON_EQUIV / EV_MPGE) * ELECTRICITY_COST_PER_KWH;

export function ResultsPanel({ gasPrice, mpg, distance, duration, zip, onReset }: ResultsPanelProps) {
  const gallons = distance / mpg;
  const cost = gallons * gasPrice;
  const animatedCost = useCostCounter(cost);

  const evTripCost = distance * EV_COST_PER_MILE;
  const evSavings = cost - evTripCost;

  const { data: dealerships = [] } = useGetEvDealerships(
    { zip },
    { query: { queryKey: getGetEvDealershipsQueryKey({ zip }), staleTime: 1000 * 60 * 10 } }
  );

  const comparison = COMPARISONS.reduce((prev, curr) => {
    const qty = cost / curr.price;
    if (qty >= 0.5 && qty <= 10) return curr;
    return prev;
  }, COMPARISONS[0]);

  const comparisonQty = (cost / comparison.price).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="mt-8 space-y-6"
      data-testid="results-panel"
    >
      {/* Main cost card */}
      <div className="rounded-xl border border-ring bg-card p-8 shadow-xl text-center">
        <h2 className="text-3xl font-display font-bold text-foreground mb-6">The Damage</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 text-sm">
          <div className="p-4 bg-background rounded-lg border border-card-border">
            <div className="text-muted-foreground mb-1">Distance</div>
            <div className="font-bold text-foreground text-lg">{distance} mi</div>
          </div>
          <div className="p-4 bg-background rounded-lg border border-card-border">
            <div className="text-muted-foreground mb-1">Drive Time</div>
            <div className="font-bold text-foreground text-lg">{duration}</div>
          </div>
          <div className="p-4 bg-background rounded-lg border border-card-border">
            <div className="text-muted-foreground mb-1">Your MPG</div>
            <div className="font-bold text-foreground text-lg">{mpg}</div>
          </div>
          <div className="p-4 bg-background rounded-lg border border-card-border">
            <div className="text-muted-foreground mb-1">Gas Price</div>
            <div className="font-bold text-foreground text-lg">${gasPrice.toFixed(2)}</div>
          </div>
          <div className="p-4 bg-background rounded-lg border border-card-border">
            <div className="text-muted-foreground mb-1">Gallons Used</div>
            <div className="font-bold text-foreground text-lg">{gallons.toFixed(2)}</div>
          </div>
        </div>

        <div className="mb-6">
          <div className="text-lg text-muted-foreground mb-2">Estimated Trip Cost</div>
          <div className="text-7xl font-bold text-primary tracking-tight font-display" data-testid="display-total-cost">
            ${animatedCost.toFixed(2)}
          </div>
        </div>

        <div className="text-lg text-foreground mb-8 bg-secondary/50 p-4 rounded-lg inline-block">
          That's roughly <span className="font-bold text-primary">{comparisonQty} {comparison.name}</span> you're burning per trip.
        </div>

        <div>
          <Button
            onClick={onReset}
            variant="outline"
            size="lg"
            className="hover-elevate transition-all"
            data-testid="button-start-over"
          >
            Start Over
          </Button>
        </div>
      </div>

      {/* EV comparison card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
        className="rounded-xl border border-success/40 bg-card p-8 shadow-lg"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/15">
            <Zap className="h-5 w-5 text-success" />
          </div>
          <h3 className="text-2xl font-display font-bold text-foreground">What If You Drove Electric?</h3>
        </div>

        <p className="text-muted-foreground mb-6 leading-relaxed">
          Electric vehicles average <strong className="text-foreground">{EV_MPGE} MPGe</strong> — nearly{" "}
          <strong className="text-foreground">{Math.round(EV_MPGE / mpg)}× more efficient</strong> than your{" "}
          {mpg} MPG vehicle. At the national average electricity rate of{" "}
          <strong className="text-foreground">${ELECTRICITY_COST_PER_KWH}/kWh</strong>, EVs cost about{" "}
          <strong className="text-foreground">{(EV_COST_PER_MILE * 100).toFixed(1)}¢ per mile</strong> to
          run — a fraction of what gasoline costs. They also have{" "}
          <strong className="text-foreground">far fewer moving parts</strong>, meaning dramatically lower
          maintenance: no oil changes, no transmission service, no exhaust repairs.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-background rounded-lg border border-card-border text-center">
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">This Trip in Your Car</div>
            <div className="text-2xl font-bold text-primary">${cost.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground mt-1">{mpg} MPG · gas</div>
          </div>
          <div className="p-4 bg-background rounded-lg border border-success/30 text-center">
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Same Trip in an EV</div>
            <div className="text-2xl font-bold text-success">${evTripCost.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground mt-1">{EV_MPGE} MPGe · electric</div>
          </div>
          <div className="p-4 bg-background rounded-lg border border-success/50 bg-success/5 text-center">
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">You'd Save</div>
            <div className="text-2xl font-bold text-success">${evSavings.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground mt-1">per trip</div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground italic">
          Over 15,000 miles/year that's roughly{" "}
          <strong className="text-foreground not-italic">
            ${Math.round((EV_COST_PER_MILE - gasPrice / mpg) * -15000).toLocaleString()} in annual fuel savings
          </strong>{" "}
          compared to your current vehicle.
        </p>
      </motion.div>

      {/* Dealerships + CarGurus card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
        className="rounded-xl border border-card-border bg-card p-8 shadow-lg"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
            <Car className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-2xl font-display font-bold text-foreground">Ready to Go Electric?</h3>
        </div>

        {dealerships.length > 0 && (
          <>
            <p className="text-muted-foreground mb-4">
              Here are EV dealerships near ZIP <strong className="text-foreground">{zip}</strong>:
            </p>
            <div className="space-y-3 mb-6">
              {dealerships.map((d, i) => (
                <a
                  key={i}
                  href={d.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-start gap-3 p-4 rounded-lg border transition-all group ${
                    d.isTesla
                      ? "bg-primary/5 border-primary/40 hover:border-primary hover:bg-primary/10"
                      : "bg-background border-card-border hover:border-primary/50 hover:bg-primary/5"
                  }`}
                >
                  <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">{d.name}</span>
                      {d.isTesla && (
                        <span className="text-xs font-bold text-primary border border-primary/40 rounded px-1.5 py-0.5 shrink-0">Closest Tesla</span>
                      )}
                      {d.distanceMiles !== undefined && (
                        <span className="text-xs text-muted-foreground shrink-0">({d.distanceMiles} mi away)</span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">{d.address}</div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                </a>
              ))}
            </div>
          </>
        )}

        <div className="border-t border-card-border pt-5">
          <p className="text-muted-foreground mb-4 text-sm">
            Search and compare thousands of electric vehicles — new and used — all in one place:
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://www.autotrader.com/cars-for-sale/electric"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:brightness-110 active:scale-95 transition-all shadow-md"
            >
              <ExternalLink className="h-4 w-4" />
              AutoTrader
            </a>
            <a
              href="https://www.cargurus.com/shop/electric-cars"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:brightness-110 active:scale-95 transition-all shadow-md"
            >
              <ExternalLink className="h-4 w-4" />
              CarGurus
            </a>
            <a
              href="https://www.cars.com/electric-cars/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:brightness-110 active:scale-95 transition-all shadow-md"
            >
              <ExternalLink className="h-4 w-4" />
              Cars.com
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
