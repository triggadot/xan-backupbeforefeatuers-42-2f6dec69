import React, { ReactNode, ErrorInfo } from 'react';
import { GlMapping } from '@/types/glsync';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface SyncContainerProps {
  children: ReactNode;
  className?: string;
  mapping?: GlMapping;
  onSyncComplete?: () => void;
  title?: string;
  description?: string;
}

interface SyncContainerState {
  hasError: boolean;
  error: Error | null;
}

/**
 * SyncContainer - A container component for sync-related UI elements
 * Includes error boundary functionality to catch and display errors
 */
class SyncContainer extends React.Component<SyncContainerProps, SyncContainerState> {
  constructor(props: SyncContainerProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): SyncContainerState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to console
    console.error('SyncContainer caught an error:', error, errorInfo);
  }

  render() {
    const { children, className = '', mapping, onSyncComplete, title, description } = this.props;
    
    // If there was an error, show error UI
    if (this.state.hasError) {
      return (
        <div className={`space-y-6 bg-white rounded-lg shadow-sm p-6 ${className}`}>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <h3 className="font-medium">Something went wrong</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {this.state.error?.message || 'An unexpected error occurred in the sync container.'}
          </p>
          <button 
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </button>
        </div>
      );
    }

    // If title and description are provided, render them in a Card header
    if (title) {
      return (
        <Card className={`${className}`}>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
          <CardContent>
            {children}
          </CardContent>
        </Card>
      );
    }

    // Normal render
    return (
      <div className={`space-y-6 bg-white rounded-lg shadow-sm p-6 ${className}`}>
        {children}
      </div>
    );
  }
}

export default SyncContainer;
