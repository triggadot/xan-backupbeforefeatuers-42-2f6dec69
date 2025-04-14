/**
 * Component for displaying a paginated list of Telegram media messages.
 */
import React from 'react';
import { useMediaMessages } from '@/hooks/telegram';
import { MediaMessage } from '@/types/telegram/messages';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MediaMessageCard } from './MediaMessageCard';

interface MediaMessageListProps {
  chatId?: number;
  mediaType?: string;
  withCaption?: boolean;
  onSelectMessage?: (message: MediaMessage) => void;
  title?: string;
}

/**
 * Displays a paginated list of Telegram media messages with filtering options.
 */
export function MediaMessageList({
  chatId,
  mediaType,
  withCaption = true,
  onSelectMessage,
  title = 'Media Messages',
}: MediaMessageListProps) {
  const [page, setPage] = React.useState(1);
  const pageSize = 12; // Grid of 3x4 looks good on most screens
  
  const {
    mediaMessages,
    isLoading,
    error,
    pagination,
    refetch,
  } = useMediaMessages({
    limitToChat: chatId,
    mediaType,
    withCaption,
    page,
    pageSize,
  });
  
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };
  
  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center">
            <p className="text-red-500 mb-4">Error loading media messages</p>
            <Button onClick={() => refetch()}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{title}</span>
          <span className="text-sm font-normal text-muted-foreground">
            {pagination.totalPages > 0 && `Page ${page} of ${pagination.totalPages}`}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: pageSize }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-[200px] w-full rounded-md" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : mediaMessages.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {mediaMessages.map((message) => (
                <MediaMessageCard
                  key={message.id}
                  message={message}
                  onClick={() => onSelectMessage?.(message)}
                />
              ))}
            </div>
            
            {pagination.totalPages > 1 && (
              <div className="flex justify-center mt-6 space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                
                {/* Show limited page numbers for better UX */}
                {Array.from(
                  { length: Math.min(5, pagination.totalPages) },
                  (_, i) => {
                    // Logic to show pages around current page
                    let pageNum = i + 1;
                    if (pagination.totalPages > 5) {
                      if (page > 3) {
                        pageNum = page - 3 + i;
                      }
                      if (pageNum > pagination.totalPages) {
                        pageNum = pagination.totalPages - (4 - i);
                      }
                    }
                    return (
                      <Button
                        key={i}
                        variant={page === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  }
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No media messages found</p>
            <Button onClick={() => refetch()}>Refresh</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
