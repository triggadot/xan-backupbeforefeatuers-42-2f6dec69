import React from 'react';
import { ErrorDisplay } from './ui/ErrorDisplay';

interface ValidationDisplayProps {
  validation: {
    isValid: boolean;
    errors: string[];
  } | null;
}

export function ValidationDisplay({ validation }: ValidationDisplayProps) {
  if (!validation || validation.isValid) {
    return null;
  }

  return (
    <ErrorDisplay
      errors={validation.errors}
      title="Validation Errors"
      severity="warning"
    />
  );
}
