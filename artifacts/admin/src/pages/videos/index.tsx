import { useListVideos, useDeleteVideo, getListVideosQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Plus, MoreVertical, Pencil, Trash2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function VideosList() {
  const { data, isLoading } = useListVideos({ page: 1, limit: 100 });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Video Library</h1>
          <p className="text-muted-foreground mt-2">Manage your shoppable Instagram videos.</p>
        </div>
        <Button asChild>
          <Link href="/videos/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Video
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
              <Skeleton className="aspect-[9/16] w-full rounded-none" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : data?.videos.length === 0 ? (
        <div className="text-center py-24 border rounded-xl bg-card">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No videos yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Add your first Instagram video to start building shoppable widgets for your store.
          </p>
          <Button asChild>
            <Link href="/videos/new">Add Video</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data?.videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}

function VideoCard({ video }: { video: any }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const deleteMutation = useDeleteVideo({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListVideosQueryKey() });
        toast({ title: "Video deleted successfully" });
        setDeleteOpen(false);
      },
      onError: () => {
        toast({ title: "Failed to delete video", variant: "destructive" });
      }
    }
  });

  return (
    <div className="group rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col">
      <div className="relative aspect-[9/16] bg-muted w-full overflow-hidden">
        {video.thumbnailUrl ? (
          <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            No thumbnail
          </div>
        )}
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow-sm bg-white/90 dark:bg-black/90 hover:bg-white dark:hover:bg-black">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <a href={video.instagramUrl} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Original
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 cursor-pointer">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this video?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will also remove the video from any widgets it is currently assigned to.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteMutation.mutate({ id: video.id })}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleteMutation.isPending ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold leading-tight line-clamp-1 mb-1" title={video.title}>{video.title}</h3>
        <p className="text-xs text-muted-foreground mb-3">Added {format(new Date(video.createdAt), 'MMM d, yyyy')}</p>
        
        {video.tags && video.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto">
            {video.tags.slice(0, 3).map((tag: string, i: number) => (
              <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">{tag}</Badge>
            ))}
            {video.tags.length > 3 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">+{video.tags.length - 3}</Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}