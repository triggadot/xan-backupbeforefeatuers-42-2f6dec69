
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { GlConnection } from '@/types/glide-sync/glsync';

interface ConnectionFormProps {
  connection: Partial<GlConnection> | null;
  onSubmit: () => void;
  onCancel: () => void;
  onChange: (field: string, value: string) => void;
  isEditing: boolean;
}

const ConnectionForm = ({ 
  connection, 
  onSubmit, 
  onCancel, 
  onChange, 
  isEditing 
}: ConnectionFormProps) => {
  return (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="app_name">App Name</Label>
        <Input
          id="app_name"
          placeholder="My Glide App"
          value={connection?.app_name || ''}
          onChange={(e) => onChange('app_name', e.target.value)}
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="app_id">App ID <span className="text-red-500">*</span></Label>
        <Input
          id="app_id"
          placeholder="YOUR_APP_ID"
          value={connection?.app_id || ''}
          onChange={(e) => onChange('app_id', e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">
          You can find the App ID in your Glide app URL or settings.
        </p>
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="api_key">API Key <span className="text-red-500">*</span></Label>
        <Input
          id="api_key"
          type="password"
          placeholder="YOUR_API_KEY"
          value={connection?.api_key || ''}
          onChange={(e) => onChange('api_key', e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">
          Access your token via the Data Editor by clicking "Show API" at the bottom of any Glide Table.
        </p>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit}>
          {isEditing ? 'Update' : 'Create'}
        </Button>
      </DialogFooter>
    </div>
  );
};

export default ConnectionForm;
