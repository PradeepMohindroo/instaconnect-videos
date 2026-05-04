import { useListWidgets, useDeleteWidget, getListWidgetsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Plus, MoreHorizontal, Pencil, Trash2, LayoutTemplate } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function WidgetsList() {
  const { data, isLoading } = useListWidgets();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Widgets</h1>
          <p className="text-muted-foreground mt-2">Manage your shoppable video widgets across your store.</p>
        </div>
        <Button asChild>
          <Link href="/widgets/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Widget
          </Link>
        </Button>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Context</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : data?.widgets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <LayoutTemplate className="h-8 w-8 mb-4 text-muted-foreground/50" />
                    <p>No widgets found. Create one to get started.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data?.widgets.map((widget) => (
                <WidgetRow key={widget.id} widget={widget} />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function WidgetRow({ widget }: { widget: any }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const deleteMutation = useDeleteWidget({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListWidgetsQueryKey() });
        toast({ title: "Widget deleted successfully" });
        setDeleteOpen(false);
      },
      onError: () => {
        toast({ title: "Failed to delete widget", variant: "destructive" });
      }
    }
  });

  return (
    <TableRow>
      <TableCell className="font-medium">
        <Link href={`/widgets/${widget.id}`} className="hover:underline text-primary">
          {widget.name}
        </Link>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="capitalize">
          {widget.type.replace('_', ' ')}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {widget.shopifyContext || "—"}
      </TableCell>
      <TableCell>
        {widget.isActive ? (
          <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">Active</Badge>
        ) : (
          <Badge variant="secondary">Inactive</Badge>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {format(new Date(widget.createdAt), 'MMM d, yyyy')}
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/widgets/${widget.id}`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 cursor-pointer">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete widget?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This widget will no longer appear on your Shopify store.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate({ id: widget.id })}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteMutation.isPending ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}