import { Router } from "express";

const router = Router();

type DistanceMatrixResponse = {
  rows?: {
    elements?: {
      status: string;
      distance?: { value: number; text: string };
      duration?: { value: number; text: string };
    }[];
  }[];
  status?: string;
};

router.get("/distance", async (req, res) => {
  const origin = req.query.origin as string;
  const destination = req.query.destination as string;

  if (!origin || !destination) {
    return res.status(400).json({ error: "Origin and destination are required." });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Google Maps API key not configured." });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&units=imperial&key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(500).json({ error: "Failed to reach Google Maps API." });
    }

    const data = await response.json() as DistanceMatrixResponse;
    const element = data?.rows?.[0]?.elements?.[0];

    if (!element || element.status !== "OK") {
      return res.status(400).json({
        error: "We couldn't find a driving route between those two locations. Check your addresses and try again.",
      });
    }

    const meters = element.distance?.value ?? 0;
    const miles = parseFloat((meters / 1609.34).toFixed(1));
    const duration = element.duration?.text ?? "Unknown";

    return res.json({ miles, duration });
  } catch {
    return res.status(500).json({ error: "Failed to calculate trip distance. Please try again." });
  }
});

export default router;
