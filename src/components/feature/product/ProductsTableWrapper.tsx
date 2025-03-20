
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
  return (
    <ProductsTable 
      products={products} 
      onEdit={onEdit} 
      onViewDetails={onViewDetails} 
      deleteProduct={onDelete}
      onAdd={onAdd}
    />
  );
};

export default ProductsTableWrapper;
