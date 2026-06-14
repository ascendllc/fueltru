import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Wizard } from "@/components/Wizard";
import mapBg from "@assets/IMG_0122_1781468294605.jpeg";

const queryClient = new QueryClient();

function Home() {
  return (
    <div className="relative min-h-[100dvh] w-full bg-background text-foreground overflow-x-hidden selection:bg-primary/30">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${mapBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.045,
          mixBlendMode: "luminosity",
        }}
        aria-hidden="true"
      />
      <div className="relative z-10">
        <Wizard />
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
