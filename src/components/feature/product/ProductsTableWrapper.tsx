
import React from 'react';
import { Product } from '@/types';
import ProductsTable from './ProductsTable';

interface ProductsTableWrapperProps {
  products: Product[];
  onEdit: (product: any) => void;
  onDelete: (product: any) => Promise<void>;
  onViewDetails: (product: any) => void;
  onAdd: () => void;
}

const ProductsTableWrapper: React.FC<ProductsTableWrapperProps> = ({
  products,
  onEdit,
  onDelete,
  onViewDetails,
  onAdd
}) => {
  // Adapt the onDelete function to match the expected type
  const handleDelete = async (id: string): Promise<boolean> => {
    try {
      // Find the product by id
      const product = products.find(p => p.id === id);
      if (product) {
        await onDelete(product);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error in handleDelete:", error);
      return false;
    }
  };

  return (
    <ProductsTable 
      products={products} 
      onEdit={onEdit} 
      deleteProduct={handleDelete}
      onAdd={onAdd}
    />
  );
};

export default ProductsTableWrapper;
