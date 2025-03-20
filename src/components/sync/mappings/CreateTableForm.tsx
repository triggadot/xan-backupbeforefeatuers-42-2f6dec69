
import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2 } from 'lucide-react';

// Define schema for form validation
const createTableSchema = z.object({
  tableName: z.string().min(3, 'Table name must be at least 3 characters'),
  columns: z.array(
    z.object({
      name: z.string().min(1, 'Column name is required'),
      type: z.string().min(1, 'Column type is required'),
      required: z.boolean().optional(),
      isPrimaryKey: z.boolean().optional(),
      isForeignKey: z.boolean().optional(),
      referencesTable: z.string().optional(),
      referencesColumn: z.string().optional(),
    })
  ).min(1, 'At least one column is required'),
});

// Define form values type
type CreateTableFormValues = z.infer<typeof createTableSchema>;

// Column types available in Supabase
const columnTypes = [
  'text',
  'integer',
  'bigint',
  'numeric',
  'boolean',
  'timestamp with time zone',
  'date',
  'jsonb',
  'uuid',
];

interface CreateTableFormProps {
  onSubmit: (values: CreateTableFormValues) => Promise<boolean>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const CreateTableForm: React.FC<CreateTableFormProps> = ({ 
  onSubmit, 
  onCancel,
  isSubmitting
}) => {
  const [existingTables, setExistingTables] = useState<string[]>([]);
  
  // Initialize form with default values
  const form = useForm<CreateTableFormValues>({
    resolver: zodResolver(createTableSchema),
    defaultValues: {
      tableName: '',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          required: true,
          isPrimaryKey: true,
          isForeignKey: false,
        },
        {
          name: 'created_at',
          type: 'timestamp with time zone',
          required: false,
          isPrimaryKey: false,
          isForeignKey: false,
        },
        {
          name: 'updated_at',
          type: 'timestamp with time zone',
          required: false,
          isPrimaryKey: false,
          isForeignKey: false,
        },
        {
          name: 'glide_row_id',
          type: 'text',
          required: true,
          isPrimaryKey: false,
          isForeignKey: false,
        }
      ],
    },
  });

  const handleAddColumn = () => {
    const currentColumns = form.getValues().columns;
    form.setValue('columns', [
      ...currentColumns,
      {
        name: '',
        type: 'text',
        required: false,
        isPrimaryKey: false,
        isForeignKey: false,
      },
    ]);
  };

  const handleRemoveColumn = (index: number) => {
    const currentColumns = form.getValues().columns;
    // Don't allow removing the first 4 default columns
    if (index < 4) return;
    
    const updatedColumns = [...currentColumns];
    updatedColumns.splice(index, 1);
    form.setValue('columns', updatedColumns);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="tableName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Table Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter table name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Columns</h3>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={handleAddColumn}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Column
            </Button>
          </div>

          <div className="space-y-4">
            {form.watch('columns').map((column, index) => (
              <div key={index} className="p-4 border rounded-md">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Column #{index + 1}</h4>
                  {index >= 4 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveColumn(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`columns.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Column Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter column name" 
                            {...field} 
                            disabled={index < 4}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`columns.${index}.type`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Type</FormLabel>
                        <Select
                          disabled={index < 4}
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select data type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {columnTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name={`columns.${index}.required`}
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={index < 4}
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer">Required</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`columns.${index}.isPrimaryKey`}
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              if (checked) {
                                // If this becomes a primary key, ensure it's required
                                form.setValue(`columns.${index}.required`, true);
                              }
                            }}
                            disabled={index < 4 || index > 0}
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer">Primary Key</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`columns.${index}.isForeignKey`}
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                            }}
                            disabled={index < 4}
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer">Foreign Key</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                {form.watch(`columns.${index}.isForeignKey`) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <FormField
                      control={form.control}
                      name={`columns.${index}.referencesTable`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>References Table</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select table" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {existingTables.map((table) => (
                                <SelectItem key={table} value={table}>
                                  {table}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`columns.${index}.referencesColumn`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>References Column</FormLabel>
                          <Input 
                            placeholder="Usually 'id'" 
                            {...field} 
                            defaultValue="id"
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Table'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CreateTableForm;
