import { Button } from '@/components/ui/button';
import { useProductMutation } from '@/hooks/products';
import { toast } from '@/hooks/utils/use-toast';
import { Product } from '@/types/products';
import { Card, Title } from '@tremor/react';
import React, { useState } from 'react';

interface ProductImageGalleryProps {
  product: Product;
  onImageUpdate?: () => void;
}

/**
 * ProductImageGallery component
 * 
 * Displays and manages product images
 * Allows uploading, viewing, and deleting product images
 * 
 * @param product - The product to display images for
 * @param onImageUpdate - Optional callback when images are updated
 * @returns React component
 */
export const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({ 
  product, 
  onImageUpdate 
}) => {
  const [activeImage, setActiveImage] = useState<string | null>(product.product_image1 || null);
  const [isUploading, setIsUploading] = useState(false);
  const { updateProduct } = useProductMutation();

  // Get all available images from the product
  const productImages = [
    product.product_image1,
    // Add more image fields here if they exist in the product type
  ].filter(Boolean) as string[];

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }

    try {
      setIsUploading(true);
      
      // In a real implementation, you would upload the image to Supabase Storage
      // For now, we'll simulate the upload with a timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // This is a placeholder for the actual image URL that would come from Supabase Storage
      const imageUrl = URL.createObjectURL(file);
      
      // Update the product with the new image URL
      await updateProduct.mutateAsync({
        id: product.glide_row_id,
        data: {
          product_image1: imageUrl,
        },
      });
      
      setActiveImage(imageUrl);
      toast.success('Image uploaded successfully');
      
      if (onImageUpdate) {
        onImageUpdate();
      }
    } catch (error) {
      toast.error(`Error uploading image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!activeImage) return;
    
    try {
      // Update the product to remove the image
      await updateProduct.mutateAsync({
        id: product.glide_row_id,
        data: {
          product_image1: null,
        },
      });
      
      setActiveImage(null);
      toast.success('Image removed successfully');
      
      if (onImageUpdate) {
        onImageUpdate();
      }
    } catch (error) {
      toast.error(`Error removing image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <Card>
      <Title className="mb-4">Product Images</Title>
      
      <div className="space-y-4">
        {/* Main image display */}
        <div className="border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center h-64">
          {activeImage ? (
            <img 
              src={activeImage} 
              alt={product.display_name || 'Product'} 
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <div className="text-gray-400 text-center p-4">
              <svg 
                className="mx-auto h-12 w-12 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                />
              </svg>
              <p className="mt-2">No image available</p>
            </div>
          )}
        </div>
        
        {/* Thumbnail gallery */}
        {productImages.length > 1 && (
          <div className="flex space-x-2 overflow-x-auto">
            {productImages.map((image, index) => (
              <button
                key={index}
                className={`w-16 h-16 border rounded overflow-hidden flex-shrink-0 ${
                  activeImage === image ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200'
                }`}
                onClick={() => setActiveImage(image)}
              >
                <img 
                  src={image} 
                  alt={`Product thumbnail ${index + 1}`} 
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
        
        {/* Image actions */}
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            className="relative"
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload Image'}
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isUploading}
            />
          </Button>
          
          {activeImage && (
            <Button 
              variant="destructive" 
              onClick={handleRemoveImage}
              disabled={isUploading}
            >
              Remove Image
            </Button>
          )}
        </div>
        
        {/* Image guidelines */}
        <div className="text-xs text-gray-500">
          <p>Supported formats: JPG, PNG, GIF</p>
          <p>Maximum file size: 5MB</p>
          <p>Recommended dimensions: 800x800 pixels</p>
        </div>
      </div>
    </Card>
  );
};

export default ProductImageGallery;
