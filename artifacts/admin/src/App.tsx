import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/layout/Shell";

import Dashboard from "@/pages/dashboard";
import VideosList from "@/pages/videos/index";
import VideoNew from "@/pages/videos/new";
import WidgetsList from "@/pages/widgets/index";
import WidgetNew from "@/pages/widgets/new";
import WidgetEdit from "@/pages/widgets/edit";
import EmbedGuide from "@/pages/embed-guide";
import ShopifySettings from "@/pages/shopify-settings";

import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <AppShell>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/videos" component={VideosList} />
        <Route path="/videos/new" component={VideoNew} />
        <Route path="/widgets" component={WidgetsList} />
        <Route path="/widgets/new" component={WidgetNew} />
        <Route path="/widgets/:id" component={WidgetEdit} />
        <Route path="/embed-guide" component={EmbedGuide} />
        <Route path="/shopify" component={ShopifySettings} />
        <Route component={NotFound} />
      </Switch>
    </AppShell>
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