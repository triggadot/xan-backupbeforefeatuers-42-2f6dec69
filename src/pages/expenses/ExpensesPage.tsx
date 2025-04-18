import React from 'react';
import { useExpenses } from '@/hooks/expenses/useExpenses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ExpensesPage() {
  const {
    expenses,
    kpis,
    isLoading,
    error,
    filters,
    setFilters,
    create,
    update,
    remove,
    exportPdf,
    refetch,
  } = useExpenses();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-end">
        <Input
          placeholder="Search notes or supplier..."
          value={filters.search || ''}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          className="w-52"
        />
        <Select
          value={filters.category || ''}
          onValueChange={v => setFilters(f => ({ ...f, category: v }))}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {/* TODO: Populate categories dynamically */}
            <SelectItem value="">All</SelectItem>
            <SelectItem value="office">Office</SelectItem>
            <SelectItem value="supplies">Supplies</SelectItem>
          </SelectContent>
        </Select>
        <DatePicker
          selected={filters.dateFrom}
          onChange={date => setFilters(f => ({ ...f, dateFrom: date }))}
          placeholderText="From"
        />
        <DatePicker
          selected={filters.dateTo}
          onChange={date => setFilters(f => ({ ...f, dateTo: date }))}
          placeholderText="To"
        />
        <Button onClick={exportPdf} variant="outline">Export PDF</Button>
        <Button onClick={() => {/* open create modal */}}>Add Expense</Button>
      </div>
      <div className="flex gap-4">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${kpis?.total?.toFixed(2) ?? '0.00'}</div>
          </CardContent>
        </Card>
        {/* More KPI cards for byCategory, byMonth, etc. */}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map(exp => (
            <TableRow key={exp.id}>
              <TableCell>{exp.dateOfExpense}</TableCell>
              <TableCell>{exp.category}</TableCell>
              <TableCell>{exp.expenseSupplierName}</TableCell>
              <TableCell>{exp.notes}</TableCell>
              <TableCell>${exp.amount?.toFixed(2) ?? ''}</TableCell>
              <TableCell>
                <Button size="sm" onClick={() => {/* open edit modal */}}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => remove(exp.id)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* TODO: Modals for create/edit */}
    </div>
  );
}
