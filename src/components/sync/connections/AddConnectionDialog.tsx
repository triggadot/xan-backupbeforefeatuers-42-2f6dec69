
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/utils/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AddConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddConnectionDialog: React.FC<AddConnectionDialogProps> = ({ 
  open, 
  onOpenChange,
  onSuccess 
}) => {
  const [appName, setAppName] = useState('');
  const [appId, setAppId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!appId.trim() || !apiKey.trim()) {
      toast({
        title: 'Validation Error',
        description: 'App ID and API Key are required',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('gl_connections')
        .insert({
          app_name: appName.trim() || 'Unnamed App',
          app_id: appId.trim(),
          api_key: apiKey.trim(),
          status: 'inactive'
        });
      
      if (error) throw error;
      
      onSuccess();
      resetForm();
    } catch (error) {
      console.error('Error adding connection:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add connection',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setAppName('');
    setAppId('');
    setApiKey('');
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Glide Connection</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="app_name">App Name</Label>
            <Input
              id="app_name"
              placeholder="My Glide App"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="app_id">App ID <span className="text-red-500">*</span></Label>
            <Input
              id="app_id"
              placeholder="YOUR_APP_ID"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Find this in your Glide app URL or settings
            </p>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="api_key">API Key <span className="text-red-500">*</span></Label>
            <Input
              id="api_key"
              type="password"
              placeholder="YOUR_API_KEY"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Get this from the Data Editor under "Show API" at the bottom of any Glide Table
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add Connection'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddConnectionDialog;
