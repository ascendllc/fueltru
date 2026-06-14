import { Router } from "express";

const router = Router();

interface PlacesResult {
  name: string;
  formatted_address: string;
  place_id: string;
}

interface PlacesResponse {
  results?: PlacesResult[];
  status: string;
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
    const query = encodeURIComponent(`electric vehicle car dealership near ${zip}`);
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      return res.json([]);
    }

    const data = (await response.json()) as PlacesResponse;
    const results = (data.results ?? []).slice(0, 3).map((r) => ({
      name: r.name,
      address: r.formatted_address,
      mapsUrl: `https://www.google.com/maps/place/?q=place_id:${r.place_id}`,
    }));

    return res.json(results);
  } catch {
    return res.json([]);
  }
});

export default router;
