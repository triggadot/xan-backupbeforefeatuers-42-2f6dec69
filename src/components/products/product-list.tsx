import React, { useState } from 'react';
import { useProducts } from '@/hooks/products';
import { Product, ProductFilters } from '@/types/products/product-types';
import { Card, Title, Text, Tab, TabGroup, TabList, TabPanel, TabPanels } from '@tremor/react';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/format';

interface ProductListProps {
  onSelectProduct: (product: Product) => void;
  initialFilters?: ProductFilters;
}

export const ProductList: React.FC<ProductListProps> = ({ 
  onSelectProduct,
  initialFilters = {}
}) => {
  const [filters, setFilters] = useState<ProductFilters>(initialFilters);
  const [searchTerm, setSearchTerm] = useState('');
  const { data: products, isLoading, error } = useProducts(filters);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, searchTerm });
  };

  const handleCategoryFilter = (categoryId: string | undefined) => {
    setFilters({ ...filters, categoryId });
  };

  const calculateTotalValue = (products: Product[] = []) => {
    return products.reduce((sum, product) => {
      return sum + (product.price || 0) * (product.quantity || 0);
    }, 0);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p>Error loading products: {error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }

  const categories = Array.from(
    new Set(products?.map(product => product.categoryId).filter(Boolean) || [])
  );

  return (
    <Card>
      <div className="flex justify-between items-center mb-6">
        <Title>Products</Title>
        <div className="flex items-center space-x-2">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search products..."
              className="py-2 pl-3 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      <TabGroup>
        <TabList className="mb-4">
          <Tab>All Products</Tab>
          {categories.map(category => (
            <Tab key={category} onClick={() => handleCategoryFilter(category)}>
              {category}
            </Tab>
          ))}
          <Tab onClick={() => handleCategoryFilter(undefined)}>Uncategorized</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel>
            <div className="mb-4">
              <Text>Total Value: {formatCurrency(calculateTotalValue(products))}</Text>
              <Text>Total Products: {products?.length || 0}</Text>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products?.map((product) => (
                    <tr 
                      key={product.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => onSelectProduct(product)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {product.product_image1 && (
                            <div className="flex-shrink-0 h-10 w-10 mr-3">
                              <img 
                                className="h-10 w-10 rounded-full object-cover" 
                                src={product.product_image1} 
                                alt={product.display_name} 
                              />
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{product.display_name}</div>
                            {product.vendor_product_name !== product.new_product_name && (
                              <div className="text-xs text-gray-500">{product.vendor_product_name}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.account?.account_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.category || 'Uncategorized'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.total_qty_purchased || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(product.cost || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency((product.cost || 0) * (product.total_qty_purchased || 0))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-1">
                          {product.samples && (
                            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                              Sample
                            </Badge>
                          )}
                          {product.fronted && (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                              Fronted
                            </Badge>
                          )}
                          {product.miscellaneous_items && (
                            <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
                              Misc
                            </Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {products?.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                        No products found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabPanel>
          
          {/* Category tab panels will be rendered dynamically */}
          {categories.map(category => (
            <TabPanel key={category}>
              {/* Content for each category tab */}
              <div className="overflow-x-auto">
                {/* Same table structure as above, but filtered by category */}
              </div>
            </TabPanel>
          ))}
          
          <TabPanel>
            {/* Content for uncategorized tab */}
            <div className="overflow-x-auto">
              {/* Same table structure as above, but filtered for uncategorized products */}
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </Card>
  );
};

export default ProductList;
