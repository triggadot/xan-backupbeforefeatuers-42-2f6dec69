import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ConfidenceLevel } from '@/types/telegram/product-matching';

interface ConfidenceScoreBadgeProps {
  score?: number;
  confidenceLevel?: ConfidenceLevel;
}

export const ConfidenceScoreBadge: React.FC<ConfidenceScoreBadgeProps> = ({ 
  score, 
  confidenceLevel 
}) => {
  // Determine confidence level from score if not provided
  const level = confidenceLevel || (
    score !== undefined
      ? score >= 90 ? 'high' : score >= 70 ? 'medium' : 'low'
      : undefined
  );

  if (!level) return null;

  const variantMap: Record<ConfidenceLevel, "default" | "destructive" | "outline" | "secondary" | "success"> = {
    high: 'success',
    medium: 'secondary',
    low: 'destructive'
  };

  return (
    <Badge variant={variantMap[level]} className="whitespace-nowrap">
      {score !== undefined ? `${Math.round(score)}% ` : ''}
      {level === 'high' ? 'High' : 
       level === 'medium' ? 'Medium' : 'Low'}
    </Badge>
  );
};
