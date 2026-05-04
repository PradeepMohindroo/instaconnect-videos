import { 
  useGetWidget, 
  useUpdateWidget, 
  useListVideos, 
  useSetWidgetVideos,
  getGetWidgetQueryKey,
  getListWidgetsQueryKey 
} from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ArrowLeft, Save, Plus, X, GripVertical } from "lucide-react";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  shopifyContext: z.string().optional().or(z.literal('')),
  isActive: z.boolean(),
});

export default function WidgetEdit() {
  const { id } = useParams<{ id: string }>();
  const widgetId = Number(id);
  const { data: widget, isLoading } = useGetWidget(widgetId, { query: { enabled: !!widgetId, queryKey: getGetWidgetQueryKey(widgetId) } });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedVideos, setSelectedVideos] = useState<any[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      shopifyContext: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (widget) {
      form.reset({
        name: widget.name,
        shopifyContext: widget.shopifyContext || "",
        isActive: widget.isActive,
      });
      setSelectedVideos(widget.videos || []);
    }
  }, [widget, form]);

  const updateMutation = useUpdateWidget({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetWidgetQueryKey(widgetId) });
        queryClient.invalidateQueries({ queryKey: getListWidgetsQueryKey() });
        toast({ title: "Widget updated successfully" });
      }
    }
  });

  const setVideosMutation = useSetWidgetVideos({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetWidgetQueryKey(widgetId) });
        toast({ title: "Videos updated successfully" });
      }
    }
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    updateMutation.mutate({
      id: widgetId,
      data: {
        name: values.name,
        shopifyContext: values.shopifyContext || null,
        isActive: values.isActive,
      }
    });
  }

  const handleAddVideo = (video: any) => {
    const maxVideos = widget?.type === 'homepage' ? 7 : 4;
    if (selectedVideos.length >= maxVideos) {
      toast({ title: `Maximum ${maxVideos} videos allowed for this widget type`, variant: "destructive" });
      return;
    }
    if (!selectedVideos.find(v => v.id === video.id)) {
      const newVideos = [...selectedVideos, video];
      setSelectedVideos(newVideos);
      setVideosMutation.mutate({ id: widgetId, data: { videoIds: newVideos.map(v => v.id) } });
    }
  };

  const handleRemoveVideo = (videoId: number) => {
    const newVideos = selectedVideos.filter(v => v.id !== videoId);
    setSelectedVideos(newVideos);
    setVideosMutation.mutate({ id: widgetId, data: { videoIds: newVideos.map(v => v.id) } });
  };

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (!widget) return <div className="p-8">Widget not found.</div>;

  const maxVideos = widget.type === 'homepage' ? 7 : 4;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/widgets">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Edit Widget</h1>
          <p className="text-muted-foreground mt-1 capitalize">{widget.type.replace('_', ' ')} Widget</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Settings</h2>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
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
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </form>
            </Form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Assigned Videos</h2>
                <p className="text-sm text-muted-foreground">{selectedVideos.length} of {maxVideos} videos selected</p>
              </div>
              <VideoSelector onSelect={handleAddVideo} disabled={selectedVideos.length >= maxVideos} existingIds={selectedVideos.map(v=>v.id)} />
            </div>

            <div className="space-y-3">
              {selectedVideos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  No videos assigned. Add some videos to preview the widget.
                </div>
              ) : (
                selectedVideos.map((video, index) => (
                  <div key={video.id} className="flex items-center gap-4 bg-muted/50 p-2 rounded-lg border">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                    <div className="h-12 w-10 bg-black rounded overflow-hidden flex-shrink-0 relative">
                      {video.thumbnailUrl && <img src={video.thumbnailUrl} className="w-full h-full object-cover" alt="" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{video.title}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleRemoveVideo(video.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Preview</h2>
            <div className="bg-muted rounded-xl p-4 overflow-hidden border flex items-center justify-center min-h-[300px]">
               {selectedVideos.length === 0 ? (
                 <div className="text-muted-foreground text-sm">Preview available after adding videos</div>
               ) : (
                 <div className="flex gap-4 overflow-x-auto pb-4 max-w-full custom-scrollbar">
                   {selectedVideos.map(video => (
                     <div key={video.id} className="w-40 aspect-[9/16] bg-black rounded-lg overflow-hidden relative shadow-lg flex-shrink-0 flex items-center justify-center">
                       {video.thumbnailUrl ? (
                         <img src={video.thumbnailUrl} className="w-full h-full object-cover opacity-80" alt="" />
                       ) : (
                         <span className="text-white/50 text-xs">No Thumb</span>
                       )}
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                       <div className="absolute bottom-2 left-2 right-2 text-white text-xs font-medium line-clamp-2">
                         {video.title}
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VideoSelector({ onSelect, disabled, existingIds }: { onSelect: (v: any) => void, disabled: boolean, existingIds: number[] }) {
  const { data } = useListVideos({ page: 1, limit: 100 });
  const [open, setOpen] = useState(false);

  const availableVideos = data?.videos.filter(v => !existingIds.includes(v.id)) || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={disabled}>
          <Plus className="h-4 w-4 mr-2" /> Add Video
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Video</DialogTitle>
        </DialogHeader>
        <div className="overflow-auto flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4">
          {availableVideos.length === 0 ? (
             <div className="col-span-full text-center py-8 text-muted-foreground">
               No more videos available to add.
             </div>
          ) : (
            availableVideos.map(video => (
              <div 
                key={video.id} 
                className="relative aspect-[9/16] rounded-lg overflow-hidden border cursor-pointer group"
                onClick={() => {
                  onSelect(video);
                  setOpen(false);
                }}
              >
                {video.thumbnailUrl ? (
                  <img src={video.thumbnailUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="" />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">No thumb</div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button variant="secondary" size="sm">Select</Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}