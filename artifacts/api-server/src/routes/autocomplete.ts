import { Router } from "express";

const router = Router();

interface PlacesAutocompleteSuggestion {
  placePrediction?: {
    text?: { text: string };
    placeId?: string;
  };
}

interface PlacesAutocompleteResponse {
  suggestions?: PlacesAutocompleteSuggestion[];
}

router.get("/autocomplete", async (req, res) => {
  const input = req.query.q as string;
  if (!input || input.trim().length < 2) {
    return res.json([]);
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Google Maps API key not configured." });
  }

  try {
    const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
      },
      body: JSON.stringify({ input: input.trim() }),
    });

    if (!response.ok) {
      return res.json([]);
    }

    const data = (await response.json()) as PlacesAutocompleteResponse;
    const suggestions = (data.suggestions ?? [])
      .filter((s) => s.placePrediction?.text?.text)
      .slice(0, 6)
      .map((s) => ({
        description: s.placePrediction!.text!.text,
        placeId: s.placePrediction!.placeId ?? "",
      }));

    return res.json(suggestions);
  } catch {
    return res.json([]);
  }
});

export default router;
