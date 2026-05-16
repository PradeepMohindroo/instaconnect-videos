import { useEffect } from "react";
import { useGetStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Video, LayoutTemplate, Activity, ShoppingBag, Home } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  useEffect(() => {
    fetch('https://shop-video-link.replit.app/api/stats')
      .then(r => { console.log('[TEST] status:', r.status); return r.json(); })
      .then(d => console.log('[TEST] data:', d))
      .catch(e => console.error('[TEST] error:', e));
  }, []);

  const { data: stats, isLoading, isError } = useGetStats();

  if (isError) {
    return (
      <div className="p-8">
        <div className="text-destructive font-medium">Failed to load dashboard data.</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-2">Your video content at a glance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Videos"
          value={stats?.totalVideos}
          icon={Video}
          isLoading={isLoading}
        />
        <StatCard
          title="Total Widgets"
          value={stats?.totalWidgets}
          icon={LayoutTemplate}
          isLoading={isLoading}
        />
        <StatCard
          title="Product Page Widgets"
          value={stats?.productPageWidgets}
          icon={ShoppingBag}
          isLoading={isLoading}
        />
        <StatCard
          title="Homepage Widgets"
          value={stats?.homepageWidgets}
          icon={Home}
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recently Added Videos</CardTitle>
            <Link href="/videos" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : stats?.recentVideos && stats.recentVideos.length > 0 ? (
              <div className="space-y-4">
                {stats.recentVideos.map(video => (
                  <div key={video.id} className="flex items-center gap-4 rounded-md border p-3 bg-card hover:bg-muted/50 transition-colors">
                    {video.thumbnailUrl ? (
                      <img src={video.thumbnailUrl} alt={video.title} className="h-12 w-12 object-cover rounded bg-muted" />
                    ) : (
                      <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                        <Video className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{video.title}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(video.createdAt), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No videos added yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Widget Status</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Activity className="h-4 w-4 text-green-500" />
                      Active Widgets
                    </span>
                    <span className="font-bold">{stats?.activeWidgets || 0}</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full" 
                      style={{ width: `${stats?.totalWidgets ? ((stats.activeWidgets || 0) / stats.totalWidgets) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      Inactive Widgets
                    </span>
                    <span className="font-bold">{((stats?.totalWidgets || 0) - (stats?.activeWidgets || 0))}</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-muted-foreground rounded-full" 
                      style={{ width: `${stats?.totalWidgets ? (((stats.totalWidgets || 0) - (stats.activeWidgets || 0)) / stats.totalWidgets) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, isLoading }: { title: string, value?: number, icon: any, isLoading: boolean }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-3xl font-bold">{value || 0}</div>
        )}
      </CardContent>
    </Card>
  );
}