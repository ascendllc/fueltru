import { useEffect } from "react";
import { Link } from "wouter";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader } from "@/components/PageHeader";
import mapBg from "@assets/IMG_0122_1781468294605.jpeg";

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Calculate Gas Cost for a Road Trip Using FuelTru",
  description:
    "FuelTru calculates the exact fuel cost for any road trip in three steps: enter your ZIP code for live local gas prices, select your vehicle for EPA-rated MPG, and enter your route for real driving distance. Results include gas cost, EV cost comparison, carbon footprint, estimated trade-in value, and local EV dealerships.",
  totalTime: "PT2M",
  estimatedCost: {
    "@type": "MonetaryAmount",
    currency: "USD",
    value: "0",
  },
  supply: [
    { "@type": "HowToSupply", name: "Your ZIP code" },
    { "@type": "HowToSupply", name: "Your vehicle year, make, model, and trim" },
    { "@type": "HowToSupply", name: "Starting address" },
    { "@type": "HowToSupply", name: "Destination address" },
  ],
  step: [
    {
      "@type": "HowToStep",
      name: "Enter your ZIP code to get local gas prices",
      text: "Type your 5-digit ZIP code. FuelTru queries the U.S. Energy Information Administration (EIA) weekly retail gasoline survey to retrieve the current average gas price for your region. Gas prices are updated every Monday and reflect real pump prices near you.",
      position: 1,
    },
    {
      "@type": "HowToStep",
      name: "Select your vehicle to get its EPA fuel economy (MPG)",
      text: "Choose your vehicle's year, make, model, and trim from the dropdown menus. FuelTru queries the U.S. Department of Energy's FuelEconomy.gov API to retrieve the EPA-rated combined MPG for your exact vehicle configuration. Combined MPG is a weighted average of city and highway driving (roughly 55% city, 45% highway).",
      position: 2,
    },
    {
      "@type": "HowToStep",
      name: "Enter your start and destination to calculate driving distance",
      text: "Type your starting point and destination. FuelTru uses the Google Maps Distance Matrix API to calculate the actual driving distance — using real roads, not straight-line distance. Enable the round-trip toggle (on by default) to include the return trip in your total cost.",
      position: 3,
    },
    {
      "@type": "HowToStep",
      name: "See your full results",
      text: "FuelTru calculates: Gas Cost = (Miles ÷ MPG) × Price per Gallon. Results include your total fuel cost, gallons used, an EV cost comparison with per-trip and annual savings, a carbon footprint comparison in kg CO₂, an estimated trade-in value for your current vehicle toward an EV down payment, and nearby EV dealerships sorted by distance.",
      position: 4,
    },
  ],
};

const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "FuelTru",
  url: "https://www.fueltru.com/",
  description:
    "Free gas trip cost calculator. Enter your ZIP for live gas prices, pick your vehicle for EPA MPG, enter your route for driving distance, and uncover the true cost of your daily drive.",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any web browser",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Live regional gas prices from EIA",
    "EPA-rated MPG for any vehicle year/make/model/trim",
    "Real driving distance via Google Maps",
    "Round-trip fuel cost calculation",
    "Electric vehicle cost comparison with per-mile and annual savings",
    "Carbon footprint comparison between gas and EV (kg CO₂ and trees equivalent)",
    "Estimated vehicle trade-in value toward an EV down payment",
    "Local EV dealership lookup (Tesla, Rivian, Polestar, and more)",
  ],
};

const steps = [
  {
    number: "01",
    title: "Enter your ZIP code",
    subtitle: "Live gas prices, not stale averages",
    body: "FuelTru queries the U.S. Energy Information Administration (EIA) weekly retail survey — the same source the government uses to track energy prices — to pull the current average gas price for your region. Prices update every Monday.",
    source: "Source: U.S. EIA Weekly Retail Gasoline Prices",
  },
  {
    number: "02",
    title: "Select your vehicle",
    subtitle: "EPA fuel economy for your exact trim",
    body: "Choose your vehicle's year, make, model, and trim. FuelTru connects to FuelEconomy.gov — the U.S. Department of Energy's official fuel economy database — to retrieve the EPA-rated combined MPG for your specific configuration. Different trims can have meaningfully different fuel economy.",
    source: "Source: FuelEconomy.gov / U.S. Dept. of Energy",
  },
  {
    number: "03",
    title: "Enter your route",
    subtitle: "Real roads, real distance",
    body: "Type your start and destination. FuelTru uses Google Maps to calculate the actual driving distance along real roads — not a straight-line estimate. Toggle round-trip on or off depending on whether you're calculating a one-way or return journey.",
    source: "Source: Google Maps Distance Matrix API",
  },
  {
    number: "04",
    title: "See your full results",
    subtitle: "Gas cost, EV comparison, trade-in estimate, and more",
    body: "FuelTru shows your total trip fuel cost, an EV comparison (per-trip savings and annual projection at your state's electricity rate), a carbon footprint breakdown in kg CO₂ with a tree-equivalent, an estimated trade-in value for your current vehicle toward an EV down payment, and nearby EV dealerships sorted by driving distance.",
    source: "Sources: EIA electricity rates, EPA emissions data, Google Places API",
  },
];

export default function HowItWorks() {
  useEffect(() => {
    document.title = "How It Works — FuelTru Gas Trip Cost Calculator";
    const desc = document.querySelector('meta[name="description"]');
    if (desc)
      desc.setAttribute(
        "content",
        "FuelTru calculates gas costs in three steps: live EIA gas prices by ZIP, EPA-rated MPG by vehicle, and real driving distance from Google Maps. Results include trip cost, EV comparison, carbon footprint, trade-in estimate, and local EV dealers.",
      );
    return () => {
      document.title = "FuelTru — Uncover the True Cost of Your Daily Drive";
    };
  }, []);

  return (
    <div className="relative min-h-[100dvh] w-full bg-background text-foreground overflow-x-hidden">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${mapBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.09,
          mixBlendMode: "luminosity",
        }}
        aria-hidden="true"
      />
      <JsonLd data={howToSchema} />
      <JsonLd data={webAppSchema} />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-16">
        <PageHeader />

        <h2 className="text-3xl font-bold text-foreground mb-2">
          How FuelTru Works
        </h2>
        <p className="text-muted-foreground mb-4 text-sm">
          Three data sources. One accurate answer. Four insights you didn't know you needed.
        </p>

        <div className="rounded-xl border border-card-border bg-card/60 backdrop-blur-sm px-6 py-5 mb-12">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="text-primary font-semibold">The formula:</span>{" "}
            Gas Cost = (Miles ÷ MPG) × Price per Gallon. FuelTru automates every
            variable using official government and mapping data — so you get an
            accurate number, not a rough guess. Then it goes further: EV cost
            comparison, carbon footprint, estimated trade-in value, and nearby EV dealers.
          </p>
        </div>

        <div className="space-y-10">
          {steps.map((step) => (
            <div key={step.number} className="flex gap-6">
              <div className="flex-shrink-0 w-10 h-10 rounded-full border border-primary/40 flex items-center justify-center">
                <span className="text-primary text-xs font-bold">{step.number}</span>
              </div>
              <div className="flex-1 pb-10 border-b border-card-border">
                <h2 className="text-base font-semibold text-foreground mb-1">
                  {step.title}
                </h2>
                <p className="text-xs text-primary/80 mb-3">{step.subtitle}</p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  {step.body}
                </p>
                <p className="text-xs text-muted-foreground/50">{step.source}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-xl border border-card-border bg-card/60 backdrop-blur-sm px-6 py-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">Why the numbers matter</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>· Using the wrong MPG (e.g. city vs. highway) can skew your estimate by 20–40%.</li>
            <li>· Gas prices vary by up to $1.50/gallon across U.S. states — a national average is often misleading.</li>
            <li>· Straight-line distance can underestimate driving distance by 20–30% in mountainous or winding terrain.</li>
            <li>· Round trips are obvious to forget — FuelTru defaults to round-trip to prevent surprises.</li>
            <li>· EV fuel cost is roughly 50% less per mile — but most drivers never run the numbers until they see them side by side.</li>
            <li>· Your car's trade-in value is real money toward an EV down payment — and most people underestimate it.</li>
          </ul>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:brightness-110 active:scale-95 transition-all shadow-md"
          >
            Try the Calculator →
          </Link>
        </div>

        <footer className="mt-16 text-center text-xs text-muted-foreground/50 border-t border-card-border pt-8">
          Data provided by U.S. Energy Information Administration, FuelEconomy.gov, and Google Maps.
          {" · "}
          <Link href="/faq" className="hover:text-muted-foreground underline underline-offset-2 transition-colors">FAQ</Link>
          {" · "}
          <Link href="/contact" className="hover:text-muted-foreground underline underline-offset-2 transition-colors">Contact</Link>
          {" · "}
          <Link href="/" className="hover:text-muted-foreground underline underline-offset-2 transition-colors">Calculator</Link>
        </footer>
      </div>
    </div>
  );
}
