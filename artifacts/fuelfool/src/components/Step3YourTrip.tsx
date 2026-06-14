import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useGetTripDistance, getGetTripDistanceQueryKey } from "@workspace/api-client-react";

interface Step3Props {
  isActive: boolean;
  isComplete: boolean;
  onComplete: (distance: number, duration: string) => void;
}

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (
      typeof google !== "undefined" &&
      typeof google.maps !== "undefined" &&
      typeof google.maps.places !== "undefined"
    ) {
      resolve();
      return;
    }
    const existing = document.getElementById("google-maps-script");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

type Prediction = { description: string; place_id: string };

function useAddressAutocomplete(mapsLoaded: boolean) {
  const serviceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const [suggestions, setSuggestions] = useState<Prediction[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (mapsLoaded && !serviceRef.current && typeof google !== "undefined") {
      serviceRef.current = new google.maps.places.AutocompleteService();
    }
  }, [mapsLoaded]);

  const fetchSuggestions = useCallback((input: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!input || input.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      if (!serviceRef.current) return;
      serviceRef.current.getPlacePredictions(
        { input, types: ["geocode", "establishment"] },
        (predictions, status) => {
          if (
            status === (google.maps.places.PlacesServiceStatus as any).OK &&
            predictions
          ) {
            setSuggestions(predictions.slice(0, 6).map((p) => ({ description: p.description, place_id: p.place_id })));
            setOpen(true);
          } else {
            setSuggestions([]);
            setOpen(false);
          }
        }
      );
    }, 220);
  }, []);

  const clear = useCallback(() => {
    setSuggestions([]);
    setOpen(false);
  }, []);

  return { suggestions, open, fetchSuggestions, clear };
}

export function Step3YourTrip({ isActive, isComplete, onComplete }: Step3Props) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [submittedParams, setSubmittedParams] = useState<{ origin: string; destination: string } | null>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [isRoundTrip, setIsRoundTrip] = useState(true);

  const originAC = useAddressAutocomplete(mapsLoaded);
  const destAC = useAddressAutocomplete(mapsLoaded);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

  useEffect(() => {
    if (!isActive || isComplete || !apiKey) return;
    loadGoogleMapsScript(apiKey)
      .then(() => setMapsLoaded(true))
      .catch(() => setMapsLoaded(false));
  }, [isActive, isComplete, apiKey]);

  const { data: tripData, isLoading, error } = useGetTripDistance(
    submittedParams!,
    { query: { enabled: !!submittedParams, queryKey: getGetTripDistanceQueryKey(submittedParams!) } }
  );

  const effectiveMiles = tripData ? (isRoundTrip ? tripData.miles * 2 : tripData.miles) : 0;

  const handleSubmit = () => {
    if (origin && destination) {
      setSubmittedParams({ origin, destination });
    }
  };

  useEffect(() => {
    if (tripData && isActive && !isComplete) {
      onComplete(effectiveMiles, tripData.duration);
    }
  }, [tripData, isActive, isComplete, isRoundTrip]);

  if (!isActive && !isComplete) return null;

  const RoundTripToggle = (
    <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
      <Checkbox
        id="round-trip"
        checked={isRoundTrip}
        onCheckedChange={(checked) => setIsRoundTrip(checked === true)}
        className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />
      <span className="text-sm font-medium text-foreground">Round Trip</span>
    </label>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative rounded-xl border bg-card p-6 shadow-sm transition-all duration-300 ${
        isActive && !isComplete ? "border-ring shadow-active" : "border-card-border"
      } ${isComplete ? "bg-card/50" : ""}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">
          <span className="mr-2 text-muted-foreground">3.</span> Where's the money going?
        </h2>
        {isComplete && <CheckCircle2 className="h-6 w-6 text-success" />}
      </div>

      {!isComplete ? (
        <div className="space-y-4">
          <AddressField
            id="origin"
            label="Starting from..."
            value={origin}
            placeholder="123 Main St, City, State"
            testId="input-origin"
            suggestions={originAC.suggestions}
            open={originAC.open}
            onChange={(val) => { setOrigin(val); originAC.fetchSuggestions(val); }}
            onSelect={(val) => { setOrigin(val); originAC.clear(); }}
            onBlur={() => setTimeout(originAC.clear, 150)}
          />
          <AddressField
            id="destination"
            label="Destination"
            value={destination}
            placeholder="456 Pizza Blvd, City, State"
            testId="input-destination"
            suggestions={destAC.suggestions}
            open={destAC.open}
            onChange={(val) => { setDestination(val); destAC.fetchSuggestions(val); }}
            onSelect={(val) => { setDestination(val); destAC.clear(); }}
            onBlur={() => setTimeout(destAC.clear, 150)}
          />
          {RoundTripToggle}
          {error && (
            <p className="text-sm text-destructive" data-testid="error-trip">
              We couldn't find a driving route between those two locations. Check your addresses and try again.
            </p>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!origin || !destination || isLoading}
            className="hover-elevate hover:brightness-110 active:scale-95 transition-all"
            data-testid="button-submit-step3"
          >
            {isLoading ? "Calculating..." : "Calculate My Trip"}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col space-y-3">
          <div className="text-sm text-muted-foreground truncate">{origin} → {destination}</div>
          <div className="flex items-end gap-4">
            <div>
              <div className="text-3xl font-bold text-foreground" data-testid="display-distance">
                {effectiveMiles} <span className="text-lg text-muted-foreground font-normal">miles</span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {isRoundTrip ? `${tripData?.miles} mi each way` : "one way"} · Est. {tripData?.duration}
              </div>
            </div>
          </div>
          {RoundTripToggle}
        </div>
      )}
    </motion.div>
  );
}

interface AddressFieldProps {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  testId: string;
  suggestions: Prediction[];
  open: boolean;
  onChange: (val: string) => void;
  onSelect: (val: string) => void;
  onBlur: () => void;
}

function AddressField({ id, label, value, placeholder, testId, suggestions, open, onChange, onSelect, onBlur }: AddressFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          data-testid={testId}
          autoComplete="off"
        />
        <AnimatePresence>
          {open && suggestions.length > 0 && (
            <motion.ul
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg overflow-hidden"
            >
              {suggestions.map((s) => (
                <li
                  key={s.place_id}
                  onMouseDown={() => onSelect(s.description)}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm text-popover-foreground cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-primary opacity-70" />
                  <span className="truncate">{s.description}</span>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
