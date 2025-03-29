import { ReactNode } from 'react';
import { Spinner } from './spinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';

interface RelatedDataDisplayProps<T> {
  /**
   * The title of the related data section
   */
  title: string;
  
  /**
   * Optional description for the related data
   */
  description?: string;
  
  /**
   * The data to display
   */
  data: T[] | null | undefined;
  
  /**
   * Whether the data is loading
   */
  isLoading: boolean;
  
  /**
   * Error message if there was an error loading the data
   */
  error?: Error | null;
  
  /**
   * Function to render each item in the data array
   */
  renderItem: (item: T, index: number) => ReactNode;
  
  /**
   * Message to display when there is no data
   */
  emptyMessage?: string;
  
  /**
   * Optional className for styling
   */
  className?: string;
}

/**
 * A reusable component for displaying related data with loading, error, and empty states
 */
export function RelatedDataDisplay<T>({
  title,
  description,
  data,
  isLoading,
  error,
  renderItem,
  emptyMessage = 'No data available',
  className = '',
}: RelatedDataDisplayProps<T>) {
  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-red-500 p-4 bg-red-50 rounded-md">
            Error loading data: {error.message}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="text-gray-500 text-center py-8">{emptyMessage}</div>
        ) : (
          <div className="space-y-4">
            {data.map((item, index) => (
              <div key={index} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                {renderItem(item, index)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Component for displaying a single related record with loading, error, and empty states
 */
export function RelatedRecordDisplay<T>({
  title,
  description,
  data,
  isLoading,
  error,
  renderContent,
  emptyMessage = 'No data available',
  className = '',
}: Omit<RelatedDataDisplayProps<T>, 'renderItem' | 'data'> & {
  data: T | null | undefined;
  renderContent: (data: T) => ReactNode;
}) {
  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-red-500 p-4 bg-red-50 rounded-md">
            Error loading data: {error.message}
          </div>
        ) : !data ? (
          <div className="text-gray-500 text-center py-8">{emptyMessage}</div>
        ) : (
          <div>{renderContent(data)}</div>
        )}
      </CardContent>
    </Card>
  );
}
