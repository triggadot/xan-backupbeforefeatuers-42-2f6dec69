
import { useNavigate, useParams } from 'react-router-dom';
import MappingDetails from '@/components/sync/mappings/MappingDetails';
import { Card, CardContent } from '@/components/ui/card';

const MappingView = () => {
  const navigate = useNavigate();
  const { mappingId } = useParams<{ mappingId: string }>();

  const handleBack = () => {
    navigate('/sync/mappings');
  };

  if (!mappingId) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="text-center">
            <h2 className="text-lg font-medium">No mapping ID provided</h2>
            <p className="text-muted-foreground mt-2">
              Please select a mapping from the dashboard
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <MappingDetails mappingId={mappingId} onBack={handleBack} />;
};

export default MappingView;
