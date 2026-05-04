import { useCreateWidget, getListWidgetsQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["product_page", "homepage"]),
  shopifyContext: z.string().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

export default function WidgetNew() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "product_page",
      shopifyContext: "",
      isActive: true,
    },
  });

  const createMutation = useCreateWidget({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListWidgetsQueryKey() });
        toast({ title: "Widget created successfully" });
        setLocation(`/widgets/${data.id}`);
      },
      onError: () => {
        toast({ title: "Failed to create widget", variant: "destructive" });
      }
    }
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createMutation.mutate({
      data: {
        ...values,
        shopifyContext: values.shopifyContext || null,
      }
    });
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/widgets">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Widget</h1>
          <p className="text-muted-foreground mt-1">Configure a new widget for your storefront.</p>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Widget Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Homepage Hero Videos" {...field} />
                  </FormControl>
                  <FormDescription>Internal name to identify this widget.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Widget Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="product_page">Product Page (3-4 videos)</SelectItem>
                      <SelectItem value="homepage">Homepage (6-7 videos)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shopifyContext"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shopify Context</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. summer-collection-2024" {...field} />
                  </FormControl>
                  <FormDescription>Optional. Product handle or page handle this belongs to.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <FormDescription>
                      If inactive, the widget will not render on the storefront.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create & Add Videos"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}