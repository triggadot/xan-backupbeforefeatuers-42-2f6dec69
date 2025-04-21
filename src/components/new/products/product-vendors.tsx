import React, { useState } from 'react';
import { useProductVendors } from '@/hooks/products';
import { Card, Title, Text, Grid, Col, BarList, Badge, Select, SelectItem } from '@tremor/react';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/utils/format';
import { useNavigate } from 'react-router-dom';

/**
 * ProductVendors component
 * 
 * Displays a list of vendors who provide products
 * Shows vendor statistics and allows filtering
 * 
 * @returns React component
 */
export const ProductVendors: React.FC = () => {
  const { data: vendors, isLoading, error } = useProductVendors();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('productCount');
  const navigate = useNavigate();

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
        <p>Error loading vendors: {error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }

  if (!vendors || vendors.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
        <p>No vendors found</p>
      </div>
    );
  }

  // Filter vendors based on search term
  const filteredVendors = vendors.filter(vendor => 
    vendor.account_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.account_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.account_phone?.includes(searchTerm)
  );

  // Sort vendors based on selected sort option
  const sortedVendors = [...filteredVendors].sort((a, b) => {
    switch (sortBy) {
      case 'productCount':
        return (b.product_count || 0) - (a.product_count || 0);
      case 'name':
        return (a.account_name || '').localeCompare(b.account_name || '');
      case 'email':
        return (a.account_email || '').localeCompare(b.account_email || '');
      default:
        return (b.product_count || 0) - (a.product_count || 0);
    }
  });

  // Prepare data for top vendors chart
  const topVendors = sortedVendors
    .slice(0, 5)
    .map(vendor => ({
      name: vendor.account_name || 'Unnamed Vendor',
      value: vendor.product_count || 0,
    }));

  const handleViewVendor = (vendorId: string) => {
    navigate(`/accounts/${vendorId}`);
  };

  return (
    <div>
      <div className="mb-6">
        <Title>Product Vendors</Title>
        <Text>Manage your product suppliers</Text>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
        <Input
          placeholder="Search vendors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        
        <div className="flex items-center gap-2">
          <Text className="whitespace-nowrap">Sort by:</Text>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectItem value="productCount">Product Count</SelectItem>
            <SelectItem value="name">Vendor Name</SelectItem>
            <SelectItem value="email">Email</SelectItem>
          </Select>
        </div>
      </div>

      <Grid numItemsMd={2} className="gap-6 mb-6">
        <Card>
          <Title>Top Vendors by Product Count</Title>
          <BarList
            className="mt-4"
            data={topVendors}
            valueFormatter={(value) => `${value} products`}
          />
        </Card>
        
        <Card>
          <Title>Vendor Statistics</Title>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <Text>Total Vendors</Text>
              <Text className="text-2xl font-semibold mt-1">{vendors.length}</Text>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <Text>Avg Products per Vendor</Text>
              <Text className="text-2xl font-semibold mt-1">
                {(vendors.reduce((sum, vendor) => sum + (vendor.product_count || 0), 0) / vendors.length).toFixed(1)}
              </Text>
            </div>
          </div>
        </Card>
      </Grid>

      <Card>
        <Title>All Vendors</Title>
        <Text className="mb-4">
          {filteredVendors.length} vendors found
        </Text>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedVendors.map((vendor, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {vendor.account_name || 'Unnamed Vendor'}
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {vendor.glide_row_id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {vendor.account_email}
                    </div>
                    <div className="text-sm text-gray-500">
                      {vendor.account_phone}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge color="blue">
                      {vendor.product_count || 0} products
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {vendor.account_type || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewVendor(vendor.glide_row_id)}
                    >
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredVendors.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No vendors match your search
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ProductVendors;
