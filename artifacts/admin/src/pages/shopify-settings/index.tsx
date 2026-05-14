import { useState } from "react";
import { Store, CheckCircle2, Circle, ExternalLink, Unplug, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetShopifyConnection,
  useListShopifyThemes,
  useInstallShopifyTheme,
  useDisconnectShopify,
} from "@workspace/api-client-react";

export default function ShopifySettings() {
  const [shop, setShop] = useState("");
  const [selectedThemeId, setSelectedThemeId] = useState<number | null>(null);
  const [installedThemeId, setInstalledThemeId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const justConnected = new URLSearchParams(window.location.search).get("connected") === "true";

  const { data: connection, isLoading: connectionLoading } = useGetShopifyConnection();
  const { data: themesData, isLoading: themesLoading } = useListShopifyThemes();

  const installMutation = useInstallShopifyTheme({
    mutation: {
      onSuccess: (data, variables) => {
        setInstalledThemeId(variables.themeId);
        toast({ title: "Snippet installed", description: data.message });
      },
      onError: () => {
        toast({
          title: "Installation failed",
          description: "Could not install snippet in that theme.",
          variant: "destructive",
        });
      },
    },
  });

  const disconnectMutation = useDisconnectShopify({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries();
        setInstalledThemeId(null);
        setSelectedThemeId(null);
        toast({ title: "Disconnected", description: "Shopify store has been disconnected." });
      },
    },
  });

  function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!shop.trim()) return;
    let domain = shop.trim().toLowerCase();
    if (!domain.includes(".myshopify.com")) {
      domain = `${domain}.myshopify.com`;
    }
    window.location.href = `/api/shopify/auth?shop=${encodeURIComponent(domain)}`;
  }

  const themes = themesData?.themes ?? [];
  const selectedTheme = themes.find((t) => t.id === selectedThemeId);

  if (connectionLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-40 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Shopify</h1>
        <p className="text-muted-foreground mt-1">
          Connect your store and install the video widget into a theme.
        </p>
      </div>

      {/* Connection card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Store connection</CardTitle>
            </div>
            {connection?.connected ? (
              <Badge variant="secondary" className="gap-1 text-green-700 bg-green-100">
                <CheckCircle2 className="h-3 w-3" /> Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-muted-foreground">
                <Circle className="h-3 w-3" /> Not connected
              </Badge>
            )}
          </div>
          {connection?.connected && (
            <CardDescription className="mt-1">{connection.shop}</CardDescription>
          )}
        </CardHeader>

        <CardContent>
          {connection?.connected ? (
            <div className="flex items-center gap-3">
              {justConnected && (
                <p className="text-sm text-green-700 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Successfully authorized
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                className="ml-auto gap-1 text-destructive hover:text-destructive"
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
              >
                <Unplug className="h-4 w-4" />
                Disconnect
              </Button>
            </div>
          ) : (
            <form onSubmit={handleConnect} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="shop">Store domain</Label>
                <div className="flex gap-2">
                  <Input
                    id="shop"
                    placeholder="your-store.myshopify.com"
                    value={shop}
                    onChange={(e) => setShop(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!shop.trim()}>
                    Connect
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  You'll be redirected to Shopify to authorize the app.
                </p>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Theme selection — only when connected */}
      {connection?.connected && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Install widget snippet</CardTitle>
            <CardDescription>
              Select a theme to upload the{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">shoppable-videos.liquid</code>{" "}
              snippet into. Once installed, add the render tag to your product or homepage template.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {themesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : themes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No themes found in your store.</p>
            ) : (
              <div className="space-y-2">
                {themes.map((theme) => {
                  const isSelected = selectedThemeId === theme.id;
                  const isInstalled = installedThemeId === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSelectedThemeId(theme.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{theme.name}</span>
                          {theme.role === "main" && (
                            <Badge variant="secondary" className="text-xs">
                              Live
                            </Badge>
                          )}
                          {theme.role === "unpublished" && (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              Draft
                            </Badge>
                          )}
                        </div>
                        {isInstalled && (
                          <p className="text-xs text-green-700 mt-0.5 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Snippet installed
                          </p>
                        )}
                      </div>
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            <Button
              onClick={() => selectedThemeId && installMutation.mutate({ themeId: selectedThemeId })}
              disabled={!selectedThemeId || installMutation.isPending}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {installMutation.isPending ? "Installing…" : "Install snippet"}
            </Button>

            {/* Usage instructions */}
            {(installedThemeId ?? selectedThemeId) && (
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <p className="text-sm font-medium">Add this tag to your template:</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Product page (under Buy Now button)
                    </p>
                    <code className="block text-xs bg-background border rounded p-2 font-mono">
                      {"{% render 'shoppable-videos', widget_id: 1 %}"}
                    </code>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Homepage section</p>
                    <code className="block text-xs bg-background border rounded p-2 font-mono">
                      {"{% render 'shoppable-videos', widget_id: 2 %}"}
                    </code>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Replace the widget ID with the actual ID from your{" "}
                  <a href="/widgets" className="underline underline-offset-2">
                    Widgets
                  </a>{" "}
                  page.
                  {selectedTheme && connection?.shop && (
                    <>
                      {" "}Edit your theme in the{" "}
                      <a
                        href={`https://${connection.shop}/admin/themes/${selectedTheme.id}/editor`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 underline underline-offset-2"
                      >
                        Shopify editor <ExternalLink className="h-3 w-3" />
                      </a>
                      .
                    </>
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
