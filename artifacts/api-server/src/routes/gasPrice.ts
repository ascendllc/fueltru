import { Router } from "express";

const router = Router();

const STATE_TO_EIA_SERIES: Record<string, string> = {
  AL: "EMM_EPMR_PTE_SAL3_DPG",
  AK: "EMM_EPMR_PTE_SAK3_DPG",
  AZ: "EMM_EPMR_PTE_SAZ3_DPG",
  AR: "EMM_EPMR_PTE_SAR3_DPG",
  CA: "EMM_EPMR_PTE_SCA3_DPG",
  CO: "EMM_EPMR_PTE_SCO3_DPG",
  CT: "EMM_EPMR_PTE_SCT3_DPG",
  DE: "EMM_EPMR_PTE_SDE3_DPG",
  FL: "EMM_EPMR_PTE_SFL3_DPG",
  GA: "EMM_EPMR_PTE_SGA3_DPG",
  HI: "EMM_EPMR_PTE_SHI3_DPG",
  ID: "EMM_EPMR_PTE_SID3_DPG",
  IL: "EMM_EPMR_PTE_SIL3_DPG",
  IN: "EMM_EPMR_PTE_SIN3_DPG",
  IA: "EMM_EPMR_PTE_SIA3_DPG",
  KS: "EMM_EPMR_PTE_SKS3_DPG",
  KY: "EMM_EPMR_PTE_SKY3_DPG",
  LA: "EMM_EPMR_PTE_SLA3_DPG",
  ME: "EMM_EPMR_PTE_SME3_DPG",
  MD: "EMM_EPMR_PTE_SMD3_DPG",
  MA: "EMM_EPMR_PTE_SMA3_DPG",
  MI: "EMM_EPMR_PTE_SMI3_DPG",
  MN: "EMM_EPMR_PTE_SMN3_DPG",
  MS: "EMM_EPMR_PTE_SMS3_DPG",
  MO: "EMM_EPMR_PTE_SMO3_DPG",
  MT: "EMM_EPMR_PTE_SMT3_DPG",
  NE: "EMM_EPMR_PTE_SNE3_DPG",
  NV: "EMM_EPMR_PTE_SNV3_DPG",
  NH: "EMM_EPMR_PTE_SNH3_DPG",
  NJ: "EMM_EPMR_PTE_SNJ3_DPG",
  NM: "EMM_EPMR_PTE_SNM3_DPG",
  NY: "EMM_EPMR_PTE_SNY3_DPG",
  NC: "EMM_EPMR_PTE_SNC3_DPG",
  ND: "EMM_EPMR_PTE_SND3_DPG",
  OH: "EMM_EPMR_PTE_SOH3_DPG",
  OK: "EMM_EPMR_PTE_SOK3_DPG",
  OR: "EMM_EPMR_PTE_SOR3_DPG",
  PA: "EMM_EPMR_PTE_SPA3_DPG",
  RI: "EMM_EPMR_PTE_SRI3_DPG",
  SC: "EMM_EPMR_PTE_SSC3_DPG",
  SD: "EMM_EPMR_PTE_SSD3_DPG",
  TN: "EMM_EPMR_PTE_STN3_DPG",
  TX: "EMM_EPMR_PTE_STX3_DPG",
  UT: "EMM_EPMR_PTE_SUT3_DPG",
  VT: "EMM_EPMR_PTE_SVT3_DPG",
  VA: "EMM_EPMR_PTE_SVA3_DPG",
  WA: "EMM_EPMR_PTE_SWA3_DPG",
  WV: "EMM_EPMR_PTE_SWV3_DPG",
  WI: "EMM_EPMR_PTE_SWI3_DPG",
  WY: "EMM_EPMR_PTE_SWY3_DPG",
  DC: "EMM_EPMR_PTE_SDC3_DPG",
};

const PADD_REGION_SERIES: Record<string, string> = {
  PADD1: "EMM_EPMR_PTE_R10_DPG",
  PADD2: "EMM_EPMR_PTE_R20_DPG",
  PADD3: "EMM_EPMR_PTE_R30_DPG",
  PADD4: "EMM_EPMR_PTE_R40_DPG",
  PADD5: "EMM_EPMR_PTE_R50_DPG",
};

const STATE_TO_PADD: Record<string, string> = {
  CT: "PADD1", DE: "PADD1", ME: "PADD1", MD: "PADD1", MA: "PADD1",
  NH: "PADD1", NJ: "PADD1", NY: "PADD1", PA: "PADD1", RI: "PADD1",
  VT: "PADD1", DC: "PADD1", VA: "PADD1", WV: "PADD1", NC: "PADD1",
  SC: "PADD1", GA: "PADD1", FL: "PADD1",
  IL: "PADD2", IN: "PADD2", IA: "PADD2", KS: "PADD2", KY: "PADD2",
  MI: "PADD2", MN: "PADD2", MO: "PADD2", NE: "PADD2", ND: "PADD2",
  OH: "PADD2", SD: "PADD2", TN: "PADD2", WI: "PADD2", OK: "PADD2",
  AL: "PADD3", AR: "PADD3", LA: "PADD3", MS: "PADD3", NM: "PADD3",
  TX: "PADD3",
  CO: "PADD4", ID: "PADD4", MT: "PADD4", UT: "PADD4", WY: "PADD4",
  AK: "PADD5", AZ: "PADD5", CA: "PADD5", HI: "PADD5", NV: "PADD5",
  OR: "PADD5", WA: "PADD5",
};

async function fetchEiaPrice(seriesId: string, apiKey: string): Promise<number | null> {
  const url = `https://api.eia.gov/v2/seriesid/${seriesId}?api_key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json() as { response?: { data?: { value: number | null }[] } };
  const data = json?.response?.data;
  if (!data || data.length === 0) return null;
  const price = data[0]?.value;
  return typeof price === "number" ? price : null;
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

    const stateSeries = STATE_TO_EIA_SERIES[state.toUpperCase()];
    let price: number | null = null;

    if (stateSeries) {
      price = await fetchEiaPrice(stateSeries, apiKey);
    }

    if (price === null) {
      const padd = STATE_TO_PADD[state.toUpperCase()];
      if (padd) {
        const paddSeries = PADD_REGION_SERIES[padd];
        price = await fetchEiaPrice(paddSeries, apiKey);
      }
    }

    if (price === null) {
      price = await fetchEiaPrice("EMM_EPMR_PTE_NUS_DPG", apiKey);
    }

    if (price === null) {
      return res.status(404).json({ error: "We couldn't find gas prices for that ZIP. Try a nearby ZIP code." });
    }

    return res.json({
      price,
      state: state.toUpperCase(),
      source: "EIA Weekly Average",
    });
  } catch {
    return res.status(500).json({ error: "Failed to fetch gas prices. Please try again." });
  }
});

export default router;
