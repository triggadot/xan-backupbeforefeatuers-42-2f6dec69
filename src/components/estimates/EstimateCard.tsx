import React from 'react';
import { Estimate } from '@/types/estimate';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/format-utils';
import { ArrowRight, Calendar, FileText, User, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { generateAndStorePDF, generateEstimatePDF } from "@/lib/pdf-utils";

interface EstimateCardProps {
  estimate: Estimate;
  onView: (estimate: Estimate) => void;
}

const EstimateCard: React.FC<EstimateCardProps> = ({ estimate, onView }) => {
  const { toast } = useToast();
  
  const getStatusVariant = (status: string): "default" | "destructive" | "outline" | "secondary" | "success" | "warning" => {
    switch (status) {
      case 'draft':
        return 'secondary';
      case 'pending':
        return 'warning';
      case 'converted':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatDate = (date: string | Date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleViewPdf = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // Check if we have a direct link
    if (estimate.supabase_pdf_url || estimate.glide_pdf_url || estimate.glide_pdf_url2) {
      const pdfUrl = estimate.supabase_pdf_url || estimate.glide_pdf_url || estimate.glide_pdf_url2;
      window.open(pdfUrl, '_blank');
    } else {
      // If no direct link, we need to generate the PDF
      toast({
        title: 'Generating PDF',
        description: 'The PDF is being generated, please wait...',
      });
      
      try {
        // Generate and store the PDF
        const pdfUrl = await generateAndStorePDF('estimate', estimate as any, false);
        
        if (pdfUrl) {
          // Open the PDF in a new tab
          window.open(pdfUrl, '_blank');
          
          toast({
            title: 'PDF Generated',
            description: 'Your estimate PDF has been generated and opened in a new tab.',
          });
        } else {
          throw new Error('Failed to generate PDF');
        }
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast({
          title: 'Error',
          description: 'Failed to generate PDF.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleDownloadPdf = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // Check if we have a direct link
    if (estimate.supabase_pdf_url || estimate.glide_pdf_url || estimate.glide_pdf_url2) {
      const pdfUrl = estimate.supabase_pdf_url || estimate.glide_pdf_url || estimate.glide_pdf_url2;
      // Create a temporary anchor element to trigger download
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = `Estimate-${estimate.glide_row_id?.substring(4) || 'estimate'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // If no direct link, we need to generate the PDF
      toast({
        title: 'Generating PDF',
        description: 'The PDF is being generated for download, please wait...',
      });
      
      try {
        // Generate the PDF
        const doc = generateEstimatePDF(estimate as any);
        
        // Save the PDF locally
        doc.save(`Estimate-${estimate.glide_row_id?.substring(4) || 'estimate'}.pdf`);
        
        // Also store it in Supabase for future use
        generateAndStorePDF('estimate', estimate as any, false)
          .then(url => {
            if (url) {
              toast({
                title: 'PDF Stored',
                description: 'Your estimate PDF has been stored for future use.',
              });
            }
          })
          .catch(error => {
            console.error('Error storing PDF:', error);
          });
        
        toast({
          title: 'PDF Downloaded',
          description: 'Your estimate PDF has been generated and downloaded.',
        });
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast({
          title: 'Error',
          description: 'Failed to generate PDF for download.',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className="block transition-transform hover:translate-y-[-2px]" onClick={() => onView(estimate)}>
      <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1 truncate">Estimate #{estimate.glide_row_id?.substring(4)}</h3>
              
              <div className="flex gap-1 items-center text-sm text-muted-foreground mb-2">
                <User size={14} />
                <span className="truncate">{estimate.accountName || 'No customer'}</span>
              </div>
              
              <div className="flex gap-1 items-center text-sm text-muted-foreground">
                <Calendar size={14} />
                <span>{estimate.estimate_date ? formatDate(estimate.estimate_date) : 'No date'}</span>
              </div>
            </div>
            
            <Badge variant={getStatusVariant(estimate.status)}>
              {estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1)}
            </Badge>
          </div>
          
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="font-medium text-lg">{formatCurrency(estimate.total_amount)}</p>
              </div>
              
              <div className="flex gap-2">
                {(estimate.supabase_pdf_url || estimate.glide_pdf_url || estimate.glide_pdf_url2) && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      onClick={handleViewPdf}
                    >
                      <FileText className="h-4 w-4" />
                      <span className="sr-only">View PDF</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      onClick={handleDownloadPdf}
                    >
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Download PDF</span>
                    </Button>
                  </>
                )}
                <ArrowRight className="h-5 w-5 text-primary" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EstimateCard;
