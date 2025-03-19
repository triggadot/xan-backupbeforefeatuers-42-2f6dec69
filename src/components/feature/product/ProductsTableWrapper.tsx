
import React from 'react';
import { Product } from '@/types';
import { ProductsTable } from './ProductsTable';

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
  return (
    <ProductsTable 
      products={products} 
      onEdit={onEdit} 
      onViewDetails={onViewDetails} 
      // The delete handler is handled internally
      onDeleteInternal={onDelete}
    />
  );
};

export default ProductsTableWrapper;
