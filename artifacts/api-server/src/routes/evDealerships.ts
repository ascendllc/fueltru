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
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${zip}&key=${apiKey}`;
    const teslaUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(`Tesla dealership near ${zip}`)}&key=${apiKey}`;
    const evUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(`electric vehicle car dealership near ${zip}`)}&key=${apiKey}`;

    const [geocodeRes, teslaRes, evRes] = await Promise.all([
      fetch(geocodeUrl),
      fetch(teslaUrl),
      fetch(evUrl),
    ]);

    const [geocodeData, teslaData, evData] = await Promise.all([
      geocodeRes.json() as Promise<GeocodeResponse>,
      teslaRes.json() as Promise<PlacesResponse>,
      evRes.json() as Promise<PlacesResponse>,
    ]);

    const zipLocation = geocodeData.results?.[0]?.geometry?.location;

    const teslaResults = teslaData.results ?? [];
    const closestTesla = teslaResults.find((r) =>
      r.name.toLowerCase().includes("tesla")
    ) ?? teslaResults[0];

    const teslaDealer = closestTesla
      ? (() => {
          const loc = closestTesla.geometry?.location;
          const distanceMiles =
            zipLocation && loc
              ? Math.round(haversineMiles(zipLocation.lat, zipLocation.lng, loc.lat, loc.lng) * 10) / 10
              : undefined;
          return {
            name: closestTesla.name,
            address: closestTesla.formatted_address,
            mapsUrl: `https://www.google.com/maps/place/?q=place_id:${closestTesla.place_id}`,
            distanceMiles,
            isTesla: true,
          };
        })()
      : null;

    const generalDealers = (evData.results ?? [])
      .filter((r) => !r.name.toLowerCase().includes("tesla"))
      .slice(0, 4)
      .map((r) => ({
        name: r.name,
        address: r.formatted_address,
        mapsUrl: `https://www.google.com/maps/place/?q=place_id:${r.place_id}`,
      }));

    const combined = [
      ...(teslaDealer ? [teslaDealer] : []),
      ...generalDealers,
    ];

    return res.json(combined);
  } catch {
    return res.json([]);
  }
});

export default router;
