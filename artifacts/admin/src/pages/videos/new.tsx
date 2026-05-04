import { useCreateVideo, getListVideosQueryKey } from "@workspace/api-client-react";
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
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  instagramUrl: z.string().url("Must be a valid URL"),
  videoUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  thumbnailUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  instagramPageUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  tags: z.string().optional()
});

export default function VideoNew() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      instagramUrl: "",
      videoUrl: "",
      thumbnailUrl: "",
      instagramPageUrl: "",
      description: "",
      tags: ""
    },
  });

  const createMutation = useCreateVideo({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListVideosQueryKey() });
        toast({ title: "Video added successfully" });
        setLocation("/videos");
      },
      onError: (error) => {
        toast({ title: "Failed to add video", variant: "destructive" });
      }
    }
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createMutation.mutate({
      data: {
        ...values,
        tags: values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        videoUrl: values.videoUrl || null,
        thumbnailUrl: values.thumbnailUrl || null,
        instagramPageUrl: values.instagramPageUrl || null,
        description: values.description || null,
      }
    });
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/videos">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Video</h1>
          <p className="text-muted-foreground mt-1">Add a new Instagram video to your library.</p>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Summer Collection Promo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="instagramUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instagram Post URL *</FormLabel>
                  <FormControl>
                    <Input placeholder="https://instagram.com/p/..." {...field} />
                  </FormControl>
                  <FormDescription>The URL of the original Instagram reel/post.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="videoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Direct Video URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormDescription>Optional. Direct mp4 URL for custom player.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="thumbnailUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thumbnail URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormDescription>Optional. Image URL to use as cover.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="instagramPageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instagram Page Link</FormLabel>
                  <FormControl>
                    <Input placeholder="https://instagram.com/yourbrand" {...field} />
                  </FormControl>
                  <FormDescription>Optional. Where clicking the profile should lead.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Video description or caption..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input placeholder="summer, fashion, promo (comma separated)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Adding..." : "Add Video"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}