import { Router } from "express";

const router = Router();

const STATE_TO_DUOAREA: Record<string, string> = {
  AL: "SAL", AK: "SAK", AZ: "SAZ", AR: "SAR", CA: "SCA",
  CO: "SCO", CT: "SCT", DE: "SDE", FL: "SFL", GA: "SGA",
  HI: "SHI", ID: "SID", IL: "SIL", IN: "SIN", IA: "SIA",
  KS: "SKS", KY: "SKY", LA: "SLA", ME: "SME", MD: "SMD",
  MA: "SMA", MI: "SMI", MN: "SMN", MS: "SMS", MO: "SMO",
  MT: "SMT", NE: "SNE", NV: "SNV", NH: "SNH", NJ: "SNJ",
  NM: "SNM", NY: "SNY", NC: "SNC", ND: "SND", OH: "SOH",
  OK: "SOK", OR: "SOR", PA: "SPA", RI: "SRI", SC: "SSC",
  SD: "SSD", TN: "STN", TX: "STX", UT: "SUT", VT: "SVT",
  VA: "SVA", WA: "SWA", WV: "SWV", WI: "SWI", WY: "SWY",
  DC: "SDC",
};

const STATE_TO_PADD_AREA: Record<string, string> = {
  CT: "R10", DE: "R10", ME: "R10", MD: "R10", MA: "R10",
  NH: "R10", NJ: "R10", NY: "R10", PA: "R10", RI: "R10",
  VT: "R10", DC: "R10", VA: "R10", WV: "R10", NC: "R10",
  SC: "R10", GA: "R10", FL: "R10",
  IL: "R20", IN: "R20", IA: "R20", KS: "R20", KY: "R20",
  MI: "R20", MN: "R20", MO: "R20", NE: "R20", ND: "R20",
  OH: "R20", SD: "R20", TN: "R20", WI: "R20", OK: "R20",
  AL: "R30", AR: "R30", LA: "R30", MS: "R30", NM: "R30",
  TX: "R30",
  CO: "R40", ID: "R40", MT: "R40", UT: "R40", WY: "R40",
  AK: "R50", AZ: "R50", CA: "R50", HI: "R50", NV: "R50",
  OR: "R50", WA: "R50",
};

async function fetchEiaPriceByArea(duoarea: string, apiKey: string): Promise<number | null> {
  const params = new URLSearchParams({
    api_key: apiKey,
    frequency: "weekly",
    "data[0]": "value",
    "facets[product][]": "EPM0",
    "facets[duoarea][]": duoarea,
    "sort[0][column]": "period",
    "sort[0][direction]": "desc",
    length: "1",
  });

  const url = `https://api.eia.gov/v2/petroleum/pri/gnd/data/?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const json = await res.json() as {
    response?: { data?: { value: string | number | null }[] };
  };

  const row = json?.response?.data?.[0];
  if (!row) return null;

  const price = typeof row.value === "string" ? parseFloat(row.value) : row.value;
  return typeof price === "number" && !isNaN(price) ? price : null;
}

router.get("/gas-price", async (req, res) => {
  const zip = req.query.zip as string;

  if (!zip || !/^\d{5}$/.test(zip)) {
    return res.status(400).json({ error: "Please enter a valid 5-digit ZIP code." });
  }

  try {
    const zipRes = await fetch(`https://api.zippopotam.us/us/${zip}`);
    if (!zipRes.ok) {
      return res.status(404).json({ error: "We couldn't find that ZIP code. Try a nearby one." });
    }
    const zipData = await zipRes.json() as { places?: { "state abbreviation": string }[] };
    const state = zipData?.places?.[0]?.["state abbreviation"];
    if (!state) {
      return res.status(404).json({ error: "We couldn't find gas prices for that ZIP. Try a nearby ZIP code." });
    }

    const apiKey = process.env.EIA_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "EIA API key not configured." });
    }

    const stateUpper = state.toUpperCase();
    let price: number | null = null;

    const stateDuoarea = STATE_TO_DUOAREA[stateUpper];
    if (stateDuoarea) {
      price = await fetchEiaPriceByArea(stateDuoarea, apiKey);
    }

    if (price === null) {
      const paddArea = STATE_TO_PADD_AREA[stateUpper];
      if (paddArea) {
        price = await fetchEiaPriceByArea(paddArea, apiKey);
      }
    }

    if (price === null) {
      price = await fetchEiaPriceByArea("NUS", apiKey);
    }

    if (price === null) {
      return res.status(404).json({ error: "We couldn't find gas prices for that ZIP. Try a nearby ZIP code." });
    }

    return res.json({
      price,
      state: stateUpper,
      source: "EIA Weekly Average",
    });
  } catch {
    return res.status(500).json({ error: "Failed to fetch gas prices. Please try again." });
  }
});

export default router;
