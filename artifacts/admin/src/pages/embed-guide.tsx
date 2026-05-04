import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

export default function EmbedGuide() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Shopify Embed Guide</h1>
        <p className="text-muted-foreground mt-2">How to install your widgets onto your Shopify theme.</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>1. Include the Script</CardTitle>
            <CardDescription>Add this script tag to your theme.liquid just before the closing &lt;/head&gt; tag.</CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock code={`<script src="https://your-app-domain.com/shoppable-video.js" defer></script>`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Product Page Setup</CardTitle>
            <CardDescription>To show the relevant product widget, add this div where you want the videos to appear in main-product.liquid.</CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock code={`<div 
  class="shoppable-video-widget" 
  data-widget-type="product_page" 
  data-shopify-context="{{ product.handle }}">
</div>`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Homepage Setup</CardTitle>
            <CardDescription>To show a homepage widget, add this div to your index.liquid or homepage section.</CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock code={`<div 
  class="shoppable-video-widget" 
  data-widget-type="homepage"
  data-widget-id="YOUR_WIDGET_ID_HERE">
</div>`} />
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-primary">API Endpoint Reference</CardTitle>
            <CardDescription>The script will automatically fetch data from this endpoint.</CardDescription>
          </CardHeader>
          <CardContent>
            <code className="px-2 py-1 bg-background rounded border text-sm">
              GET /api/embed/:widgetId
            </code>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono border">
        <code>{code}</code>
      </pre>
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-2 right-2 h-8 w-8 bg-background/50 backdrop-blur hover:bg-background"
        onClick={copyToClipboard}
      >
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
      </Button>
    </div>
  );
}