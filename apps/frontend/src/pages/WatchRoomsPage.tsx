import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button.tsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/Card.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { Skeleton } from '../components/ui/Skeleton.tsx';
import { Copy, ExternalLink, ChevronLeft, ChevronRight, Calendar, Users } from 'lucide-react';
import { toast } from 'sonner';
import { getMyWatchrooms } from '../api/queries/watchroom.ts';
import type { Watchroom } from '../api/types/watchroom.ts';
import { CreateWatchRoomModal } from '../components/CreateWatchRoomModal.tsx';
import { AuthContext } from '../context/AuthContext.tsx';
import { config } from '../config.ts';
import { SeriesContext } from '../context/SeriesContext.tsx';
import { useSEO } from '../hooks/useSEO.ts';

export default function WatchRoomsPage() {
  useSEO({
    title: 'Watch Rooms - ShowSync',
    description: 'Create watch rooms to get smart show suggestions. Invite friends or discover shows for solo binging.',
    keywords: ['watch rooms', 'group recommendations', 'watch party', 'show recommendations', 'watch together'],
  });

  const [rooms, setRooms] = useState<Watchroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const pageSize = 20;
  const navigate = useNavigate();
  const { userData } = useContext(AuthContext);
  const { totalCount } = useContext(SeriesContext);

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      const response = await getMyWatchrooms(page, pageSize);
      setRooms(response.data);
      setTotal(response.metadata.total);
      setTotalPages(Math.ceil(response.metadata.total / pageSize));
    } catch {
      toast.error('Could not load watch rooms. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderSkeletons = () => (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card
          key={i}
          className="flex flex-col h-full border-2"
        >
          <CardHeader className="px-6 pb-4">
            <Skeleton className="h-6 w-3/4 mb-3" />
            <div className="flex items-center flex-wrap gap-2 mb-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-14" />
            </div>
            <Skeleton className="h-4 w-32" />
          </CardHeader>

          <CardContent className="grow px-6 py-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </CardContent>

          <CardFooter className="px-6 py-4 pt-0">
            <div className="w-full flex items-center gap-2">
              <Skeleton className="h-9 flex-1" />
              <Skeleton className="h-9 flex-1" />
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  useEffect(() => {
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const canCreateRoom = totalCount >= config.series.minRatedShowsToCreateWatchRoom;
  const disabledReason = !canCreateRoom
    ? `To create a watch room, you need at least ${config.series.minRatedShowsToCreateWatchRoom} rated shows. You have: ${totalCount} total.`
    : undefined;

  const handleCopyLink = (publicLinkId: string) => {
    const link = `${window.location.origin}/watchrooms/public/${publicLinkId}`;
    navigator.clipboard.writeText(link);
    toast.success('Room link copied to clipboard!');
  };

  const handleOpenWatchRoom = (roomId: string) => {
    navigate(`/watchrooms/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-size-[4rem_4rem]" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center space-y-6">
              <div className="space-y-3">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
                  Watch Rooms
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Get personalized recommendations for your group or just for yourself
                </p>
              </div>
              <div>
                <CreateWatchRoomModal
                  onRoomCreated={fetchRooms}
                  disabled={!canCreateRoom}
                  disabledReason={disabledReason}
                />
              </div>
            </div>

            {/* Loading State */}
            {isLoading && renderSkeletons()}

            {/* Empty State */}
            {!isLoading && rooms.length === 0 && (
              <Card className="border-2 border-dashed hover:border-primary/30 transition-colors">
                <CardContent className="text-center py-20 px-6">
                  <div className="max-w-md mx-auto space-y-6">
                    <div className="w-20 h-20 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
                      <Users className="w-10 h-10 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-foreground">No watch rooms yet</h3>
                      <p className="text-base text-muted-foreground leading-relaxed">
                        Create your first room to get personalized show recommendations
                      </p>
                    </div>
                    <CreateWatchRoomModal
                      onRoomCreated={fetchRooms}
                      disabled={!canCreateRoom}
                      disabledReason={disabledReason}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Rooms Grid */}
            {!isLoading && rooms.length > 0 && (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rooms.map((room) => {
                    const isOwner = userData?.id === room.ownerId;
                    return (
                      <Card
                        key={room.id}
                        className="flex flex-col h-full border-2 hover:border-primary/50 hover:shadow-lg transition-all duration-300 group overflow-hidden"
                      >
                        <CardHeader className="px-6 py-5 space-y-4 border-b border-border/40">
                          <CardTitle className="text-xl font-bold truncate group-hover:text-primary transition-colors">
                            {room.name}
                          </CardTitle>
                          <div className="flex items-center flex-wrap gap-2">
                            <Badge
                              variant="secondary"
                              className="shrink-0 text-xs bg-secondary/50 font-medium"
                            >
                              <Users className="w-3 h-3 mr-1.5" />
                              {room.participants.length}/{config.watchroom.maxParticipants}
                            </Badge>
                            {isOwner && (
                              <Badge className="shrink-0 bg-primary/10 text-primary border border-primary/20 font-medium text-xs whitespace-nowrap">
                                Owner
                              </Badge>
                            )}
                            <div className="flex items-center text-xs text-muted-foreground ml-auto">
                              <Calendar className="w-3 h-3 mr-1.5 shrink-0" />
                              <span className="whitespace-nowrap">
                                {new Date(room.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="grow px-6 py-4">
                          {room.description ? (
                            <CardDescription className="line-clamp-4 text-sm leading-relaxed">
                              {room.description}
                            </CardDescription>
                          ) : (
                            <p className="text-sm text-muted-foreground/50 italic">No description yet</p>
                          )}
                        </CardContent>

                        <CardFooter className="px-6 py-4 pt-0">
                          <div className="w-full flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleOpenWatchRoom(room.id)}
                              className="flex-1 shadow-sm hover:shadow-md transition-all"
                            >
                              Open
                              <ExternalLink className="w-4 h-4 ml-2" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyLink(room.publicLinkId)}
                              className="flex-1 shadow-sm hover:shadow-md transition-all"
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Share
                            </Button>
                          </div>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    <p className="text-sm text-muted-foreground">
                      Showing {rooms.length} of {total} {total === 1 ? 'room' : 'rooms'}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous
                      </Button>
                      <span className="text-sm px-3">
                        Page {page} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
