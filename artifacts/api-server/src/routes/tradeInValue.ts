import { Router } from "express";

const router = Router();
const FE_BASE = "https://www.fueleconomy.gov/ws/rest/vehicle";

const LUXURY_MAKES = new Set([
  "acura", "alfa romeo", "aston martin", "audi", "bentley", "bmw",
  "cadillac", "ferrari", "genesis", "infiniti", "jaguar", "lamborghini",
  "land rover", "lexus", "lincoln", "maserati", "mercedes-benz", "mercedes",
  "porsche", "rolls-royce", "volvo",
]);

const SEGMENT_BASE_MSRP_2024: Record<string, number> = {
  "minicompact cars": 24000,
  "subcompact cars": 26000,
  "compact cars": 29000,
  "midsize cars": 35000,
  "large cars": 45000,
  "small sport utility vehicle 2wd": 33000,
  "small sport utility vehicle 4wd": 35000,
  "standard sport utility vehicle 2wd": 50000,
  "standard sport utility vehicle 4wd": 54000,
  "small pickup trucks 2wd": 36000,
  "small pickup trucks 4wd": 39000,
  "standard pickup trucks 2wd": 48000,
  "standard pickup trucks 4wd": 52000,
  "minivan - 2wd": 36000,
  "minivan - 4wd": 40000,
  "cargo van": 36000,
  "passenger van": 40000,
  "special purpose vehicle": 38000,
  "special purpose vehicle 2wd": 38000,
  "special purpose vehicle 4wd": 42000,
  "two seaters": 38000,
};

// Rough inflation index: average new-car price relative to 2024 by model year
const YEAR_PRICE_FACTOR: Record<number, number> = {
  2026: 1.02, 2025: 1.00, 2024: 0.98, 2023: 0.97, 2022: 1.00,
  2021: 0.92, 2020: 0.83, 2019: 0.80, 2018: 0.78, 2017: 0.75,
  2016: 0.73, 2015: 0.71, 2014: 0.69, 2013: 0.67, 2012: 0.65,
  2011: 0.63, 2010: 0.61, 2009: 0.59, 2008: 0.57,
};

// Annual depreciation rates (fraction of current value lost each year)
const DEPRECIATION_RATES = [0.20, 0.15, 0.13, 0.12, 0.11, 0.09, 0.08, 0.08, 0.07, 0.07];

function estimateMsrp(vclass: string, makeNorm: string, modelYear: number): number {
  const classKey = vclass.toLowerCase();
  let base = SEGMENT_BASE_MSRP_2024[classKey] ?? 35000;
  const yearFactor = YEAR_PRICE_FACTOR[modelYear] ?? (modelYear < 2008 ? 0.54 : 0.57);
  base *= yearFactor;
  if (LUXURY_MAKES.has(makeNorm)) base *= 1.75;
  return Math.round(base);
}

function applyDepreciation(msrp: number, ageYears: number): number {
  let value = msrp;
  const years = Math.max(0, Math.round(ageYears));
  for (let i = 0; i < years; i++) {
    const rate = i < DEPRECIATION_RATES.length ? DEPRECIATION_RATES[i] : 0.06;
    value *= (1 - rate);
  }
  return value;
}

router.get("/trade-in-value", async (req, res) => {
  const vehicleId = req.query.vehicleId as string;
  const yearStr = req.query.year as string;
  const make = req.query.make as string;

  if (!vehicleId || !yearStr || !make) {
    return res.status(400).json({ error: "vehicleId, year, and make are required." });
  }

  const modelYear = parseInt(yearStr, 10);
  if (isNaN(modelYear)) return res.status(400).json({ error: "Invalid year." });

  try {
    const epaRes = await fetch(`${FE_BASE}/${encodeURIComponent(vehicleId)}`, {
      headers: { Accept: "application/json" },
    });
    const epaData = epaRes.ok ? (await epaRes.json() as { VClass?: string }) : null;

    const vclass = epaData?.VClass ?? "Midsize Cars";
    const makeNorm = make.toLowerCase().trim();
    const currentYear = new Date().getFullYear();
    const ageYears = currentYear - modelYear;

    const msrp = estimateMsrp(vclass, makeNorm, modelYear);
    const retailValue = applyDepreciation(msrp, ageYears);

    // Trade-in is typically 10–20% below private-party retail
    const tradeInAvg = Math.round(retailValue * 0.87);
    const tradeInLow = Math.round(tradeInAvg * 0.88);
    const tradeInHigh = Math.round(tradeInAvg * 1.12);

    const avgMilesPerYear = 12500;
    const estimatedMileage = Math.round(ageYears * avgMilesPerYear);

    const segmentLabel = vclass.replace(/ 2wd| 4wd/i, "").trim();

    return res.json({
      estimatedLow: tradeInLow,
      estimatedHigh: tradeInHigh,
      estimatedAvg: tradeInAvg,
      estimatedMileage,
      vehicleAge: ageYears,
      segment: segmentLabel,
    });
  } catch {
    return res.status(500).json({ error: "Failed to estimate trade-in value." });
  }
});

export default router;
