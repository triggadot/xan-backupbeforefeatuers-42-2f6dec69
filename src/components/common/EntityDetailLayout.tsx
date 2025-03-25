
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

export interface EntityDetailLayoutProps {
  title: React.ReactNode;
  status?: {
    label: string;
    variant: "default" | "destructive" | "outline" | "secondary" | "success" | "warning";
  };
  actions?: React.ReactNode;
  children: React.ReactNode;
  isLoading?: boolean;
  notFoundMessage?: string;
  backLink?: string;
}

/**
 * A standardized layout component for entity detail pages
 */
export function EntityDetailLayout({
  title,
  status,
  actions,
  children,
  isLoading = false,
  notFoundMessage = "The requested item could not be found.",
  backLink
}: EntityDetailLayoutProps) {
  const navigate = useNavigate();
  
  const handleGoBack = () => {
    if (backLink) {
      navigate(backLink);
    } else {
      navigate(-1);
    }
  };
  
  if (isLoading) {
    return (
      <div className="container max-w-6xl py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }
  
  if (!title && !isLoading) {
    return (
      <div className="container max-w-6xl py-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Item Not Found</h1>
        </div>
        <div className="mt-6 p-6 border rounded-lg bg-card text-center">
          <p className="text-muted-foreground">{notFoundMessage}</p>
          <Button onClick={handleGoBack} className="mt-4">Go Back</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container max-w-6xl py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{title}</h1>
          {status && (
            <Badge variant={status.variant} className="capitalize ml-2">
              {status.label}
            </Badge>
          )}
        </div>
        {actions && (
          <div className="flex gap-2">
            {actions}
          </div>
        )}
      </div>
      
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}
