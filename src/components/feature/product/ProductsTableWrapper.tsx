
import React from 'react';
import { Product } from '@/types';
import ProductsTable from './ProductsTable';

interface ProductsTableWrapperProps {
  products: Product[];
  onEdit: (product: any) => void;
  onDelete: (product: any) => Promise<void>;
  onViewDetails: (product: any) => void;
}

const ProductsTableWrapper: React.FC<ProductsTableWrapperProps> = ({
  products,
  onEdit,
  onDelete,
  onViewDetails
}) => {
  // Transform the onDelete function to match the expected signature (id: string) => Promise<boolean>
  const handleDelete = async (id: string): Promise<boolean> => {
    try {
      const product = products.find(p => p.id === id);
      if (product) {
        await onDelete(product);
        return true; // Return true to indicate successful deletion
      }
      return false;
    } catch (error) {
      console.error('Error deleting product:', error);
      return false;
    }
  };

  return (
    <ProductsTable 
      products={products} 
      onEdit={onEdit} 
      onViewDetails={onViewDetails} 
      deleteProduct={handleDelete}
    />
  );
};

export default ProductsTableWrapper;
