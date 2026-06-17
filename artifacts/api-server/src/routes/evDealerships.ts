import { Router } from "express";

const router = Router();

interface PlacesResult {
  name: string;
  formatted_address: string;
  place_id: string;
  geometry?: { location: { lat: number; lng: number } };
}

interface PlacesResponse {
  results?: PlacesResult[];
  status: string;
}

interface GeocodeResponse {
  results?: Array<{ geometry: { location: { lat: number; lng: number } } }>;
  status: string;
}

function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

router.get("/ev-dealerships", async (req, res) => {
  const zip = req.query.zip as string;
  if (!zip || !/^\d{5}$/.test(zip)) {
    return res.status(400).json({ error: "A valid ZIP code is required." });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Google Maps API key not configured." });
  }

  try {
    // Stage 1: geocode ZIP to get coordinates for location-biased searches
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${zip}&key=${apiKey}`;
    const geocodeData = await fetch(geocodeUrl).then((r) => r.json()) as GeocodeResponse;
    const zipLocation = geocodeData.results?.[0]?.geometry?.location;

    // Build location bias param (250 km radius covers most of a state)
    const locParam = zipLocation
      ? `&location=${zipLocation.lat},${zipLocation.lng}&radius=250000`
      : "";

    // Stage 2: all searches in parallel, now with location bias
    const base = "https://maps.googleapis.com/maps/api/place/textsearch/json";
    const [teslaData, rivianData, polestarData, evData] = await Promise.all([
      fetch(`${base}?query=${encodeURIComponent("Tesla dealership")}${locParam}&key=${apiKey}`).then((r) => r.json()) as Promise<PlacesResponse>,
      fetch(`${base}?query=${encodeURIComponent("Rivian dealership")}${locParam}&key=${apiKey}`).then((r) => r.json()) as Promise<PlacesResponse>,
      fetch(`${base}?query=${encodeURIComponent("Polestar dealership")}${locParam}&key=${apiKey}`).then((r) => r.json()) as Promise<PlacesResponse>,
      fetch(`${base}?query=${encodeURIComponent("electric vehicle car dealership")}${locParam}&key=${apiKey}`).then((r) => r.json()) as Promise<PlacesResponse>,
    ]);

    function closestByDistance(results: PlacesResult[], brandKeyword: string): PlacesResult | null {
      const matches = results.filter((r) => r.name.toLowerCase().includes(brandKeyword));
      const pool = matches.length > 0 ? matches : results;
      if (pool.length === 0) return null;
      if (!zipLocation) return pool[0];
      return pool.reduce((best, r) => {
        const bLoc = best.geometry?.location;
        const rLoc = r.geometry?.location;
        if (!rLoc) return best;
        if (!bLoc) return r;
        const dBest = haversineMiles(zipLocation.lat, zipLocation.lng, bLoc.lat, bLoc.lng);
        const dR = haversineMiles(zipLocation.lat, zipLocation.lng, rLoc.lat, rLoc.lng);
        return dR < dBest ? r : best;
      });
    }

    function buildBrandDealer(result: PlacesResult | null, flag: Record<string, boolean>) {
      if (!result) return null;
      const loc = result.geometry?.location;
      const distanceMiles =
        zipLocation && loc
          ? Math.round(haversineMiles(zipLocation.lat, zipLocation.lng, loc.lat, loc.lng) * 10) / 10
          : undefined;
      return {
        name: result.name,
        address: result.formatted_address,
        mapsUrl: `https://www.google.com/maps/place/?q=place_id:${result.place_id}`,
        distanceMiles,
        ...flag,
      };
    }

    const teslaDealer = buildBrandDealer(closestByDistance(teslaData.results ?? [], "tesla"), { isTesla: true });
    const rivianDealer = buildBrandDealer(closestByDistance(rivianData.results ?? [], "rivian"), { isRivian: true });
    const polestarDealer = buildBrandDealer(closestByDistance(polestarData.results ?? [], "polestar"), { isPolestar: true });

    const brandNames = new Set(["tesla", "rivian", "polestar"]);
    const generalDealers = (evData.results ?? [])
      .filter((r) => !brandNames.has(r.name.toLowerCase().split(" ")[0]))
      .slice(0, 3)
      .map((r) => ({
        name: r.name,
        address: r.formatted_address,
        mapsUrl: `https://www.google.com/maps/place/?q=place_id:${r.place_id}`,
      }));

    const combined = [
      ...(teslaDealer ? [teslaDealer] : []),
      ...(rivianDealer ? [rivianDealer] : []),
      ...(polestarDealer ? [polestarDealer] : []),
      ...generalDealers,
    ].slice(0, 6);

    return res.json(combined);
  } catch {
    return res.json([]);
  }
});

export default router;
