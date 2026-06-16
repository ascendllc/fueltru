import { Router } from "express";

const router = Router();

async function fetchEiaElectricityRate(stateId: string, apiKey: string): Promise<number | null> {
  const params = new URLSearchParams({
    api_key: apiKey,
    frequency: "monthly",
    "data[0]": "price",
    "facets[stateid][]": stateId,
    "facets[sectorName][]": "residential",
    "sort[0][column]": "period",
    "sort[0][direction]": "desc",
    length: "1",
  });

  const url = `https://api.eia.gov/v2/electricity/retail-sales/data/?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const json = await res.json() as {
    response?: { data?: { price: string | number | null }[] };
  };

  const row = json?.response?.data?.[0];
  if (!row) return null;

  const priceCents = typeof row.price === "string" ? parseFloat(row.price) : row.price;
  if (typeof priceCents !== "number" || isNaN(priceCents)) return null;

  return priceCents / 100;
}

router.get("/electricity-rate", async (req, res) => {
  const zip = req.query.zip as string;

  if (!zip || !/^\d{5}$/.test(zip)) {
    return res.status(400).json({ error: "Please enter a valid 5-digit ZIP code." });
  }

  const apiKey = process.env.EIA_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "EIA API key not configured." });
  }

  try {
    const zipRes = await fetch(`https://api.zippopotam.us/us/${zip}`);
    if (!zipRes.ok) {
      return res.status(404).json({ error: "Could not resolve that ZIP code." });
    }
    const zipData = await zipRes.json() as { places?: { "state abbreviation": string }[] };
    const state = zipData?.places?.[0]?.["state abbreviation"]?.toUpperCase();

    if (!state) {
      return res.status(404).json({ error: "Could not determine state from ZIP." });
    }

    let rate = await fetchEiaElectricityRate(state, apiKey);

    if (rate === null) {
      rate = await fetchEiaElectricityRate("US", apiKey);
    }

    if (rate === null) {
      rate = 0.16;
    }

    return res.json({ rate, state, source: "EIA Residential Retail Sales" });
  } catch {
    return res.status(500).json({ error: "Failed to fetch electricity rate." });
  }
});

export default router;
