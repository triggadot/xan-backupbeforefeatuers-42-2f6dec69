import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ColumnDef } from '@/types';

interface TableRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  record: Record<string, any>;
  fields: ColumnDef[];
  onSubmit: (values: Record<string, any>) => void;
}

export default function TableRecordDialog({
  open,
  onOpenChange,
  title,
  record,
  fields,
  onSubmit
}: TableRecordDialogProps) {
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  
  // Initialize form values when record changes
  useEffect(() => {
    setFormValues({...record});
  }, [record]);
  
  // Filter out read-only fields
  const editableFields = useMemo(() => {
    return fields.filter(field => {
      const fieldName = field.accessorKey as string;
      // Skip id, created_at, updated_at fields
      return fieldName !== 'id' && 
             fieldName !== 'created_at' && 
             fieldName !== 'updated_at' &&
             fieldName !== 'glide_row_id';
    });
  }, [fields]);
  
  const handleChange = (field: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Remove ID and other read-only fields for create operations
    const submitValues = {...formValues};
    if (!record.id) {
      delete submitValues.id;
      delete submitValues.created_at;
      delete submitValues.updated_at;
    }
    
    onSubmit(submitValues);
  };
  
  const renderFieldInput = (field: ColumnDef) => {
    const fieldName = field.accessorKey as string;
    const fieldValue = formValues[fieldName];
    const fieldId = `field-${fieldName}`;
    
    // Format field label
    const fieldLabel = fieldName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    // Determine field type based on field name and value
    let fieldType = 'text';
    if (fieldName.includes('date') || fieldName.includes('_at')) {
      fieldType = 'datetime-local';
    } else if (typeof fieldValue === 'number') {
      fieldType = 'number';
    } else if (typeof fieldValue === 'boolean') {
      fieldType = 'checkbox';
    } else if (fieldName.includes('email')) {
      fieldType = 'email';
    } else if (fieldName.includes('password')) {
      fieldType = 'password';
    } else if (fieldName.includes('url') || fieldName.includes('link')) {
      fieldType = 'url';
    } else if (typeof fieldValue === 'string' && fieldValue.length > 100) {
      fieldType = 'textarea';
    }
    
    return (
      <div key={fieldId} className="mb-4">
        {fieldType === 'checkbox' ? (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={fieldId}
              checked={!!fieldValue}
              onCheckedChange={(checked) => handleChange(fieldName, Boolean(checked))}
            />
            <Label htmlFor={fieldId}>{fieldLabel}</Label>
          </div>
        ) : fieldType === 'textarea' ? (
          <div className="grid gap-2">
            <Label htmlFor={fieldId}>{fieldLabel}</Label>
            <Textarea
              id={fieldId}
              value={fieldValue || ''}
              onChange={(e) => handleChange(fieldName, e.target.value)}
              rows={5}
              placeholder={`Enter ${fieldLabel}`}
            />
          </div>
        ) : (
          <div className="grid gap-2">
            <Label htmlFor={fieldId}>{fieldLabel}</Label>
            <Input
              id={fieldId}
              type={fieldType}
              value={fieldValue === null ? '' : fieldValue}
              onChange={(e) => {
                const value = fieldType === 'number' 
                  ? e.target.value ? Number(e.target.value) : null
                  : e.target.value;
                handleChange(fieldName, value);
              }}
              placeholder={`Enter ${fieldLabel}`}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="mt-6">
          <div className="grid gap-4 py-4">
            {editableFields.map(renderFieldInput)}
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
