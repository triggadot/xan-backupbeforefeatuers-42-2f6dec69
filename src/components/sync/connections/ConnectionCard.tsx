
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw, Edit, Trash2, CheckCircle } from 'lucide-react';
import { GlConnection } from '@/types/glsync';
import { formatDate } from '@/utils/format-utils';

interface ConnectionCardProps {
  connection: GlConnection;
  onEdit: (connection: GlConnection) => void;
  onDelete: (id: string) => void;
  onTest: (id: string) => void;
  isTestingConnection: boolean;
}

export const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleString();
};

const ConnectionCard = ({ 
  connection, 
  onEdit, 
  onDelete, 
  onTest, 
  isTestingConnection 
}: ConnectionCardProps) => {
  return (
    <Card key={connection.id} className="p-6">
      <div className="flex flex-col md:flex-row justify-between">
        <div>
          <h3 className="text-lg font-medium">
            {connection.app_name || 'Unnamed App'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            App ID: {connection.app_id}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Last Synced: {formatDate(connection.last_sync)}
          </p>
        </div>
        
        <div className="flex space-x-2 mt-4 md:mt-0">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onTest(connection.id)}
            disabled={isTestingConnection}
          >
            {isTestingConnection ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Test Connection
              </>
            )}
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => onEdit(connection)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => onDelete(connection.id)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ConnectionCard;
