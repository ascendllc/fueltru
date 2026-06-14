import { useEffect } from "react";
import { Link } from "wouter";
import { JsonLd } from "@/components/JsonLd";
import mapBg from "@assets/IMG_0122_1781468294605.jpeg";

const faqs = [
  {
    q: "What is FuelFool?",
    a: "FuelFool is a free gas trip cost calculator that tells you exactly how much you'll spend on fuel for any road trip. Enter your ZIP code to fetch live local gas prices, select your vehicle to pull its EPA-rated MPG, and enter your start and destination addresses. FuelFool calculates the total fuel cost — including round trips — in seconds.",
  },
  {
    q: "How does FuelFool calculate gas cost?",
    a: "FuelFool uses a straightforward formula: Gas Cost = (Trip Distance in miles ÷ Vehicle MPG) × Local Gas Price per gallon. Distance comes from Google Maps (actual driving distance, not straight-line), MPG comes from the U.S. Department of Energy's FuelEconomy.gov database, and gas price comes from the U.S. Energy Information Administration (EIA) weekly survey for your region.",
  },
  {
    q: "What data sources does FuelFool use?",
    a: "FuelFool pulls from three official sources: (1) U.S. Energy Information Administration (EIA) for weekly regional gas prices, (2) FuelEconomy.gov (U.S. Department of Energy) for EPA-rated fuel economy by year, make, model, and trim, and (3) Google Maps Distance Matrix API for real driving distance and route data.",
  },
  {
    q: "How much does a typical road trip cost in gas?",
    a: "A typical U.S. road trip of 500 miles in a car averaging 28 MPG at a national average gas price of around $3.30/gallon costs roughly $59 one-way, or $118 round-trip. Costs vary significantly by vehicle fuel economy and local gas prices — a large SUV at 18 MPG over the same route would cost around $92 one-way.",
  },
  {
    q: "How do I calculate gas cost for a road trip?",
    a: "To calculate gas cost manually: (1) Find the total driving distance in miles, (2) Look up your vehicle's MPG, (3) Check the current gas price per gallon in your area, (4) Divide miles by MPG to get gallons needed, (5) Multiply gallons by price per gallon. Formula: Cost = (Miles ÷ MPG) × Price/Gallon. FuelFool automates all of these steps for you.",
  },
  {
    q: "What is considered good gas mileage (MPG)?",
    a: "For passenger cars, 30–40 MPG is considered good fuel economy. Compact cars and sedans often achieve 32–38 MPG combined. SUVs and trucks typically average 18–26 MPG. Hybrids range from 40–60 MPG, and plug-in hybrid electric vehicles (PHEVs) can exceed 80 MPGe. The U.S. fleet average is around 28 MPG as of 2024.",
  },
  {
    q: "How much does gas cost per mile to drive?",
    a: "At $3.30/gallon and 28 MPG (a common midsize sedan), gas costs about $0.118 per mile — roughly 12 cents per mile. A fuel-efficient compact at 38 MPG costs about $0.087 per mile. A large pickup at 18 MPG costs about $0.183 per mile. These numbers scale directly with gas price.",
  },
  {
    q: "Is it cheaper to drive or fly for a long trip?",
    a: "Driving is often cheaper for trips under 400–600 miles when traveling with 2 or more people. For a solo traveler driving a car at 28 MPG, a 500-mile trip costs roughly $59 in gas — comparable to a budget airline ticket before fees. Flying saves time but driving saves money at lower distances, especially for families or groups splitting gas costs.",
  },
  {
    q: "How much does an EV cost to drive compared to a gas car?",
    a: "Electric vehicles cost significantly less per mile to fuel than gasoline vehicles. At the national average electricity rate of $0.16/kWh and an EV efficiency of 3 miles/kWh (roughly 100 MPGe), electricity costs about $0.054 per mile — roughly 3–4× cheaper than gas at $3.30/gallon in a 28 MPG car ($0.118/mile). A 500-mile road trip costs about $27 in electricity vs. $59 in gasoline.",
  },
  {
    q: "How do gas prices vary by state?",
    a: "Gas prices in the U.S. vary significantly by state due to state fuel taxes, distance from refineries, and local regulations. California consistently has the highest gas prices (often $0.50–$1.00+ above the national average) due to its unique fuel blend requirements and high taxes. Gulf Coast states like Texas and Louisiana typically have the lowest prices. FuelFool uses your ZIP code to pull the EIA's regional price closest to you.",
  },
  {
    q: "Does FuelFool calculate round-trip gas cost?",
    a: "Yes. FuelFool includes a round-trip toggle (enabled by default) that doubles the one-way driving distance to give you the total fuel cost for driving there and back. You can uncheck the round-trip option to calculate one-way cost only.",
  },
  {
    q: "How often are gas prices updated in FuelFool?",
    a: "FuelFool uses the U.S. Energy Information Administration (EIA) weekly retail gasoline survey, which is updated every Monday. The prices reflect the most recent weekly average for your region (e.g., East Coast, Midwest, Gulf Coast, Rocky Mountain, West Coast).",
  },
  {
    q: "Can FuelFool calculate fuel cost for trucks and SUVs?",
    a: "Yes. FuelFool supports any vehicle in the FuelEconomy.gov database, including trucks, SUVs, minivans, sports cars, and hybrids. Select your vehicle's year, make, model, and trim to get the correct EPA-rated MPG for your specific vehicle configuration.",
  },
  {
    q: "What is the difference between city and highway MPG?",
    a: "City MPG measures fuel economy in stop-and-go urban driving conditions, while highway MPG measures efficiency at steady highway speeds. Highway MPG is typically 20–40% higher than city MPG because there's less idling and braking. FuelFool uses the combined MPG figure (a weighted average of roughly 55% city / 45% highway) from the EPA, which most closely reflects real-world driving.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: f.a,
    },
  })),
};

export default function FAQ() {
  useEffect(() => {
    document.title = "FAQ — FuelFool Gas Trip Cost Calculator";
    const desc = document.querySelector('meta[name="description"]');
    if (desc)
      desc.setAttribute(
        "content",
        "Frequently asked questions about FuelFool — how gas cost is calculated, what data sources are used, MPG averages, EV comparisons, and road trip fuel cost tips.",
      );
    return () => {
      document.title = "FuelFool — Don't be Fooled By How Much Fuel";
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
      <JsonLd data={faqSchema} />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="text-xs text-muted-foreground/60 hover:text-muted-foreground mb-10 block transition-colors">
          ← Back to FuelFool
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-2">
          Frequently Asked Questions
        </h1>
        <p className="text-muted-foreground mb-12 text-sm">
          Everything you need to know about calculating gas costs for road trips.
        </p>

        <div className="space-y-8">
          {faqs.map((faq) => (
            <div key={faq.q} className="border-b border-card-border pb-8">
              <h2 className="text-base font-semibold text-foreground mb-3">
                {faq.q}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>

        <footer className="mt-16 text-center text-xs text-muted-foreground/50 border-t border-card-border pt-8">
          Data provided by U.S. Energy Information Administration, FuelEconomy.gov, and Google Maps.
          {" · "}
          <Link href="/how-it-works" className="hover:text-muted-foreground underline underline-offset-2 transition-colors">How It Works</Link>
          {" · "}
          <Link href="/contact" className="hover:text-muted-foreground underline underline-offset-2 transition-colors">Contact</Link>
          {" · "}
          <Link href="/" className="hover:text-muted-foreground underline underline-offset-2 transition-colors">Calculator</Link>
        </footer>
      </div>
    </div>
  );
}
