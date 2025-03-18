
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Account, Product, PurchaseOrder, Estimate, Invoice, LineItem } from '../types';

// Mock data generator helpers
const generateId = () => uuidv4();
const randomDate = (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
const today = new Date();
const pastDate = new Date(today);
pastDate.setMonth(today.getMonth() - 3);

// Mock data
const mockAccounts: Account[] = [
  {
    id: generateId(),
    name: 'Acme Corporation',
    type: 'both',
    email: 'contact@acme.com',
    phone: '(555) 123-4567',
    address: '123 Main St, Business City, 12345',
    website: 'https://acme.com',
    notes: 'Primary supplier and occasional customer',
    status: 'active',
    balance: 2500,
    createdAt: randomDate(pastDate, today),
    updatedAt: randomDate(pastDate, today),
  },
  {
    id: generateId(),
    name: 'TechNova Inc.',
    type: 'customer',
    email: 'sales@technova.com',
    phone: '(555) 987-6543',
    address: '456 Tech Blvd, Innovation City, 67890',
    website: 'https://technova.com',
    notes: 'Enterprise client with quarterly purchase schedule',
    status: 'active',
    balance: 4250,
    createdAt: randomDate(pastDate, today),
    updatedAt: randomDate(pastDate, today),
  },
  {
    id: generateId(),
    name: 'GlobalSupply Co.',
    type: 'vendor',
    email: 'orders@globalsupply.com',
    phone: '(555) 456-7890',
    address: '789 Supply Chain Ave, Logistics City, 54321',
    website: 'https://globalsupply.com',
    notes: 'Main raw materials supplier',
    status: 'active',
    balance: -1800,
    createdAt: randomDate(pastDate, today),
    updatedAt: randomDate(pastDate, today),
  },
];

const mockProducts: Product[] = [
  {
    id: generateId(),
    name: 'Premium Widget',
    sku: 'WDG-001',
    description: 'High-quality widget with premium features',
    price: 49.99,
    cost: 24.50,
    quantity: 150,
    category: 'Widgets',
    status: 'active',
    imageUrl: 'https://via.placeholder.com/150',
    createdAt: randomDate(pastDate, today),
    updatedAt: randomDate(pastDate, today),
  },
  {
    id: generateId(),
    name: 'Standard Gadget',
    sku: 'GDG-002',
    description: 'Reliable gadget for everyday use',
    price: 29.99,
    cost: 15.75,
    quantity: 230,
    category: 'Gadgets',
    status: 'active',
    imageUrl: 'https://via.placeholder.com/150',
    createdAt: randomDate(pastDate, today),
    updatedAt: randomDate(pastDate, today),
  },
  {
    id: generateId(),
    name: 'Deluxe Doohickey',
    sku: 'DHK-003',
    description: 'Advanced doohickey with extra features',
    price: 79.99,
    cost: 42.30,
    quantity: 80,
    category: 'Doohickeys',
    status: 'active',
    imageUrl: 'https://via.placeholder.com/150',
    createdAt: randomDate(pastDate, today),
    updatedAt: randomDate(pastDate, today),
  },
];

// Generate mock line items for a document
const generateMockLineItems = (products: Product[], count: number): LineItem[] => {
  const items: LineItem[] = [];
  for (let i = 0; i < count; i++) {
    const product = products[Math.floor(Math.random() * products.length)];
    const quantity = Math.floor(Math.random() * 5) + 1;
    items.push({
      id: generateId(),
      productId: product.id,
      description: product.name,
      quantity,
      unitPrice: product.price,
      total: product.price * quantity,
    });
  }
  return items;
};

// Generate mock purchase orders
const generateMockPurchaseOrders = (accounts: Account[], products: Product[]): PurchaseOrder[] => {
  const orders: PurchaseOrder[] = [];
  const vendors = accounts.filter(a => a.type === 'vendor' || a.type === 'both');
  
  for (let i = 0; i < 5; i++) {
    const vendor = vendors[Math.floor(Math.random() * vendors.length)];
    const lineItems = generateMockLineItems(products, Math.floor(Math.random() * 3) + 1);
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;
    
    orders.push({
      id: generateId(),
      number: `PO-${(10000 + i).toString()}`,
      date: randomDate(pastDate, today),
      dueDate: new Date(today.getTime() + (Math.random() * 30 * 24 * 60 * 60 * 1000)),
      accountId: vendor.id,
      accountName: vendor.name,
      subtotal,
      tax,
      total,
      notes: 'Standard terms and conditions apply',
      lineItems,
      status: ['draft', 'sent', 'received'][Math.floor(Math.random() * 3)] as 'draft' | 'sent' | 'received',
      expectedDeliveryDate: new Date(today.getTime() + (Math.random() * 14 * 24 * 60 * 60 * 1000)),
      createdAt: randomDate(pastDate, today),
      updatedAt: randomDate(pastDate, today),
    });
  }
  
  return orders;
};

// Generate mock estimates
const generateMockEstimates = (accounts: Account[], products: Product[]): Estimate[] => {
  const estimates: Estimate[] = [];
  const customers = accounts.filter(a => a.type === 'customer' || a.type === 'both');
  
  for (let i = 0; i < 5; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const lineItems = generateMockLineItems(products, Math.floor(Math.random() * 3) + 2);
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;
    
    const expiryDate = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    estimates.push({
      id: generateId(),
      number: `EST-${(10000 + i).toString()}`,
      date: randomDate(pastDate, today),
      dueDate: expiryDate,
      accountId: customer.id,
      accountName: customer.name,
      subtotal,
      tax,
      total,
      notes: 'This estimate is valid for 30 days',
      lineItems,
      status: ['draft', 'sent', 'accepted'][Math.floor(Math.random() * 3)] as 'draft' | 'sent' | 'accepted',
      expiryDate,
      createdAt: randomDate(pastDate, today),
      updatedAt: randomDate(pastDate, today),
    });
  }
  
  return estimates;
};

// Generate mock invoices
const generateMockInvoices = (accounts: Account[], products: Product[], estimates: Estimate[]): Invoice[] => {
  const invoices: Invoice[] = [];
  const customers = accounts.filter(a => a.type === 'customer' || a.type === 'both');
  
  // Convert some estimates to invoices
  for (let i = 0; i < 2; i++) {
    if (estimates[i] && estimates[i].status === 'accepted') {
      const estimate = estimates[i];
      const amountPaid = Math.random() > 0.5 ? estimate.total : 0;
      
      invoices.push({
        id: generateId(),
        number: `INV-${(10000 + i).toString()}`,
        date: new Date(estimate.date.getTime() + (2 * 24 * 60 * 60 * 1000)),
        dueDate: new Date(today.getTime() + (15 * 24 * 60 * 60 * 1000)),
        accountId: estimate.accountId,
        accountName: estimate.accountName,
        subtotal: estimate.subtotal,
        tax: estimate.tax,
        total: estimate.total,
        notes: 'Payment due within 15 days',
        lineItems: [...estimate.lineItems],
        status: amountPaid > 0 ? 'paid' : 'sent',
        paymentTerms: 'Net 15',
        paymentDate: amountPaid > 0 ? randomDate(new Date(estimate.date.getTime() + (2 * 24 * 60 * 60 * 1000)), today) : undefined,
        amountPaid,
        balance: estimate.total - amountPaid,
        estimateId: estimate.id,
        createdAt: new Date(estimate.date.getTime() + (2 * 24 * 60 * 60 * 1000)),
        updatedAt: today,
      });
    }
  }
  
  // Create some invoices directly
  for (let i = 0; i < 3; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const lineItems = generateMockLineItems(products, Math.floor(Math.random() * 3) + 1);
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;
    const amountPaid = Math.random() > 0.5 ? total : 0;
    
    invoices.push({
      id: generateId(),
      number: `INV-${(10020 + i).toString()}`,
      date: randomDate(pastDate, today),
      dueDate: new Date(today.getTime() + (15 * 24 * 60 * 60 * 1000)),
      accountId: customer.id,
      accountName: customer.name,
      subtotal,
      tax,
      total,
      notes: 'Payment due within 15 days',
      lineItems,
      status: amountPaid > 0 ? 'paid' : Math.random() > 0.5 ? 'sent' : 'draft',
      paymentTerms: 'Net 15',
      paymentDate: amountPaid > 0 ? randomDate(pastDate, today) : undefined,
      amountPaid,
      balance: total - amountPaid,
      createdAt: randomDate(pastDate, today),
      updatedAt: randomDate(pastDate, today),
    });
  }
  
  return invoices;
};

// Initialize mock data
const mockEstimates = generateMockEstimates(mockAccounts, mockProducts);
const mockInvoices = generateMockInvoices(mockAccounts, mockProducts, mockEstimates);
const mockPurchaseOrders = generateMockPurchaseOrders(mockAccounts, mockProducts);

// Define store types
interface StoreState {
  accounts: Account[];
  products: Product[];
  purchaseOrders: PurchaseOrder[];
  estimates: Estimate[];
  invoices: Invoice[];
  
  // Account actions
  addAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAccount: (id: string, account: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  getAccount: (id: string) => Account | undefined;
  
  // Product actions
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProduct: (id: string) => Product | undefined;
  
  // Purchase Order actions
  addPurchaseOrder: (order: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePurchaseOrder: (id: string, order: Partial<PurchaseOrder>) => void;
  deletePurchaseOrder: (id: string) => void;
  getPurchaseOrder: (id: string) => PurchaseOrder | undefined;
  
  // Estimate actions
  addEstimate: (estimate: Omit<Estimate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateEstimate: (id: string, estimate: Partial<Estimate>) => void;
  deleteEstimate: (id: string) => void;
  getEstimate: (id: string) => Estimate | undefined;
  convertEstimateToInvoice: (estimateId: string) => string | undefined;
  
  // Invoice actions
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  getInvoice: (id: string) => Invoice | undefined;
}

// Create store
export const useStore = create<StoreState>()(
  devtools(
    persist(
      (set, get) => ({
        accounts: mockAccounts,
        products: mockProducts,
        purchaseOrders: mockPurchaseOrders,
        estimates: mockEstimates,
        invoices: mockInvoices,
        
        // Account actions
        addAccount: (account) => set((state) => {
          const newAccount: Account = {
            ...account,
            id: generateId(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          return { accounts: [...state.accounts, newAccount] };
        }),
        
        updateAccount: (id, account) => set((state) => ({
          accounts: state.accounts.map((a) => 
            a.id === id ? { ...a, ...account, updatedAt: new Date() } : a
          ),
        })),
        
        deleteAccount: (id) => set((state) => ({
          accounts: state.accounts.filter((a) => a.id !== id),
        })),
        
        getAccount: (id) => get().accounts.find((a) => a.id === id),
        
        // Product actions
        addProduct: (product) => set((state) => {
          const newProduct: Product = {
            ...product,
            id: generateId(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          return { products: [...state.products, newProduct] };
        }),
        
        updateProduct: (id, product) => set((state) => ({
          products: state.products.map((p) => 
            p.id === id ? { ...p, ...product, updatedAt: new Date() } : p
          ),
        })),
        
        deleteProduct: (id) => set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        })),
        
        getProduct: (id) => get().products.find((p) => p.id === id),
        
        // Purchase Order actions
        addPurchaseOrder: (order) => set((state) => {
          const newOrder: PurchaseOrder = {
            ...order,
            id: generateId(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          return { purchaseOrders: [...state.purchaseOrders, newOrder] };
        }),
        
        updatePurchaseOrder: (id, order) => set((state) => ({
          purchaseOrders: state.purchaseOrders.map((po) => 
            po.id === id ? { ...po, ...order, updatedAt: new Date() } : po
          ),
        })),
        
        deletePurchaseOrder: (id) => set((state) => ({
          purchaseOrders: state.purchaseOrders.filter((po) => po.id !== id),
        })),
        
        getPurchaseOrder: (id) => get().purchaseOrders.find((po) => po.id === id),
        
        // Estimate actions
        addEstimate: (estimate) => set((state) => {
          const newEstimate: Estimate = {
            ...estimate,
            id: generateId(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          return { estimates: [...state.estimates, newEstimate] };
        }),
        
        updateEstimate: (id, estimate) => set((state) => ({
          estimates: state.estimates.map((e) => 
            e.id === id ? { ...e, ...estimate, updatedAt: new Date() } : e
          ),
        })),
        
        deleteEstimate: (id) => set((state) => ({
          estimates: state.estimates.filter((e) => e.id !== id),
        })),
        
        getEstimate: (id) => get().estimates.find((e) => e.id === id),
        
        convertEstimateToInvoice: (estimateId) => {
          const estimate = get().estimates.find((e) => e.id === estimateId);
          if (!estimate) return undefined;
          
          // Create a new invoice based on the estimate
          const newInvoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> = {
            number: `INV-${Date.now().toString().slice(-5)}`,
            date: new Date(),
            dueDate: new Date(new Date().getTime() + (15 * 24 * 60 * 60 * 1000)),
            accountId: estimate.accountId,
            accountName: estimate.accountName,
            subtotal: estimate.subtotal,
            tax: estimate.tax,
            total: estimate.total,
            notes: estimate.notes,
            lineItems: [...estimate.lineItems],
            status: 'draft',
            paymentTerms: 'Net 15',
            amountPaid: 0,
            balance: estimate.total,
            estimateId: estimate.id,
          };
          
          // Update the estimate
          get().updateEstimate(estimateId, {
            status: 'accepted',
            convertedToInvoiceId: 'placeholder',
          });
          
          // Add the invoice
          const id = generateId();
          set((state) => ({
            invoices: [...state.invoices, {
              ...newInvoice,
              id,
              createdAt: new Date(),
              updatedAt: new Date(),
            }],
          }));
          
          // Update the estimate with the real invoice ID
          get().updateEstimate(estimateId, {
            convertedToInvoiceId: id,
          });
          
          return id;
        },
        
        // Invoice actions
        addInvoice: (invoice) => set((state) => {
          const newInvoice: Invoice = {
            ...invoice,
            id: generateId(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          return { invoices: [...state.invoices, newInvoice] };
        }),
        
        updateInvoice: (id, invoice) => set((state) => ({
          invoices: state.invoices.map((i) => 
            i.id === id ? { ...i, ...invoice, updatedAt: new Date() } : i
          ),
        })),
        
        deleteInvoice: (id) => set((state) => ({
          invoices: state.invoices.filter((i) => i.id !== id),
        })),
        
        getInvoice: (id) => get().invoices.find((i) => i.id === id),
      }),
      {
        name: 'business-management-store',
      }
    )
  )
);

// Export common store selectors
export const selectAccounts = (state: StoreState) => state.accounts;
export const selectProducts = (state: StoreState) => state.products;
export const selectPurchaseOrders = (state: StoreState) => state.purchaseOrders;
export const selectEstimates = (state: StoreState) => state.estimates;
export const selectInvoices = (state: StoreState) => state.invoices;

// Calculate dashboard metrics
export const useDashboardMetrics = () => {
  const accounts = useStore(selectAccounts);
  const products = useStore(selectProducts);
  const purchaseOrders = useStore(selectPurchaseOrders);
  const estimates = useStore(selectEstimates);
  const invoices = useStore(selectInvoices);
  
  // Calculate total accounts receivable
  const totalReceivable = invoices
    .filter(i => i.status !== 'paid' && i.status !== 'cancelled')
    .reduce((sum, invoice) => sum + invoice.balance, 0);
  
  // Calculate total accounts payable
  const totalPayable = purchaseOrders
    .filter(po => po.status !== 'received' && po.status !== 'cancelled')
    .reduce((sum, po) => sum + po.total, 0);
  
  // Calculate inventory value
  const inventoryValue = products.reduce((sum, product) => sum + (product.cost * product.quantity), 0);
  
  // Calculate total sales (paid invoices)
  const totalSales = invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, invoice) => sum + invoice.total, 0);
  
  // Calculate pending estimates value
  const pendingEstimatesValue = estimates
    .filter(e => e.status === 'sent')
    .reduce((sum, estimate) => sum + estimate.total, 0);
  
  // Count active customers
  const activeCustomers = accounts.filter(a => (a.type === 'customer' || a.type === 'both') && a.status === 'active').length;
  
  // Count active vendors
  const activeVendors = accounts.filter(a => (a.type === 'vendor' || a.type === 'both') && a.status === 'active').length;
  
  // Count low stock products
  const lowStockProducts = products.filter(p => p.quantity < 10).length;
  
  return {
    totalReceivable,
    totalPayable,
    inventoryValue,
    totalSales,
    pendingEstimatesValue,
    activeCustomers,
    activeVendors,
    lowStockProducts,
  };
};
