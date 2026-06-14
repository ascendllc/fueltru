import { useState } from "react";
import { Link } from "wouter";
import { FuelGaugeLogo } from "./FuelGaugeLogo";
import { motion } from "framer-motion";

const quotes = [
  "Because that pizza run isn't free, Karen.",
  "Your library book just cost you $2.14 in gas.",
  "Soccer practice: the $4.11 commute you never thought about.",
];

interface PageHeaderProps {
  backHref?: string;
  backLabel?: string;
}

export function PageHeader({ backHref = "/", backLabel = "Back to FuelFool" }: PageHeaderProps) {
  const [quote] = useState(quotes[Math.floor(Math.random() * quotes.length)]);

  return (
    <>
      <Link
        href={backHref}
        className="text-sm font-bold text-primary hover:brightness-125 transition-colors flex items-center gap-1.5 mb-10"
      >
        ← {backLabel}
      </Link>

      <header className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-3 mb-4"
        >
          <FuelGaugeLogo size={80} />
          <h1 className="text-5xl md:text-6xl font-display font-bold text-primary">
            FuelFool
          </h1>
        </motion.div>
        <p className="text-xl md:text-2xl text-foreground font-display mb-4">
          Don't be Fooled By How Much Fuel
        </p>
        <p className="text-md text-muted-foreground italic">
          "{quote}"
        </p>
      </header>
    </>
  );
}
