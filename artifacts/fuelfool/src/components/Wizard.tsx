import { useState } from "react";
import { Step1FuelUp } from "./Step1FuelUp";
import { Step2YourRide } from "./Step2YourRide";
import { Step3YourTrip } from "./Step3YourTrip";
import { ResultsPanel } from "./ResultsPanel";
import { FuelGaugeLogo } from "./FuelGaugeLogo";
import { motion } from "framer-motion";

export function Wizard() {
  const [resetKey, setResetKey] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [gasPrice, setGasPrice] = useState<number | null>(null);
  const [zip, setZip] = useState<string | null>(null);
  const [mpg, setMpg] = useState<number | null>(null);
  const [distanceData, setDistanceData] = useState<{ distance: number; duration: string } | null>(null);

  const reset = () => {
    setResetKey((k) => k + 1);
    setCurrentStep(1);
    setGasPrice(null);
    setZip(null);
    setMpg(null);
    setDistanceData(null);
  };

  const quotes = [
    "Because that pizza run isn't free, Karen.",
    "Your library book just cost you $2.14 in gas.",
    "Soccer practice: the $4.11 commute you never thought about."
  ];
  
  const [quote] = useState(quotes[Math.floor(Math.random() * quotes.length)]);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12">
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

      <div className="flex items-center justify-center space-x-4 mb-8">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-bold transition-colors ${
              currentStep > step ? "border-success bg-success text-success-foreground" :
              currentStep === step ? "border-ring bg-ring/20 text-ring" :
              "border-muted text-muted-foreground"
            }`}>
              {currentStep > step ? "✓" : step}
            </div>
            {step < 3 && (
              <div className={`h-1 w-12 mx-2 rounded ${currentStep > step ? "bg-success" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="space-y-6" key={resetKey}>
        <Step1FuelUp 
          isActive={currentStep === 1} 
          isComplete={currentStep > 1}
          onComplete={(price, zipCode) => { setGasPrice(price); setZip(zipCode); setCurrentStep(2); }}
        />
        
        <Step2YourRide 
          isActive={currentStep === 2} 
          isComplete={currentStep > 2}
          onComplete={(val) => { setMpg(val); setCurrentStep(3); }}
        />

        <Step3YourTrip 
          isActive={currentStep === 3} 
          isComplete={currentStep > 3}
          onComplete={(dist, dur) => { setDistanceData({ distance: dist, duration: dur }); setCurrentStep(4); }}
        />
      </div>

      {currentStep === 4 && gasPrice && mpg && distanceData && zip && (
        <ResultsPanel
          gasPrice={gasPrice}
          mpg={mpg}
          distance={distanceData.distance}
          duration={distanceData.duration}
          zip={zip}
          onReset={reset}
        />
      )}

      <footer className="mt-16 text-center text-xs text-muted-foreground/50 border-t border-card-border pt-8">
        Data provided by U.S. Energy Information Administration, FuelEconomy.gov, and Google Maps.
        {" · "}
        <a href="/how-it-works" className="hover:text-muted-foreground underline underline-offset-2 transition-colors">How It Works</a>
        {" · "}
        <a href="/faq" className="hover:text-muted-foreground underline underline-offset-2 transition-colors">FAQ</a>
      </footer>
    </div>
  );
}
