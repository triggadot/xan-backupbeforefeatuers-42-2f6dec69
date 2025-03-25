
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface DetailCardProps {
  title: string;
  icon?: LucideIcon;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

/**
 * A standardized card component for entity detail sections
 */
export function DetailCard({
  title,
  icon: Icon,
  description,
  children,
  footer,
  className = ""
}: DetailCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5" />}
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
      {footer && (
        <CardFooter className="border-t">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}
