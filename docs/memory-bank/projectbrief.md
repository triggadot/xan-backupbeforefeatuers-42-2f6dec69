# Xan-1 Project Brief

## Overview
Xan-1 is a comprehensive business management system built for handling financial transactions, inventory management, and customer/vendor relationships. The system manages invoices, purchase orders, estimates, products, and accounts with a focus on robust data synchronization with Glide Apps.

## Core Objectives
1. Provide a unified platform for tracking and managing business transactions
2. Support data synchronization between Supabase PostgreSQL and Glide Apps
3. Offer PDF generation and management for business documents
4. Implement product inventory management with relationship tracking
5. Maintain accurate financial calculations and balances
6. Create a maintainable, consistent codebase with clear conventions

## Primary Features
- **Financial Management**
  - Invoice management with line items and payment tracking
  - Purchase order system with product line items
  - Estimate creation with conversion to invoices
  - Payment processing for both customers and vendors

- **Relationship Management**
  - Account management for both customers and vendors
  - Balance tracking for financial relationships
  - Contact information and communication history

- **Inventory Management**
  - Product inventory tracking and relationship management
  - Sample and fronted product handling
  - Category management and reporting
  - Stock level monitoring

- **Document Management**
  - PDF generation, viewing, and sharing
  - Batch processing capabilities
  - Document templates and customization
  - Failure tracking and management

## Technical Architecture
- **Frontend**: React with TypeScript, Vite, Tailwind CSS
- **UI Components**: Shadcn UI for base components, Tremor for data visualization
- **State Management**: React Context, TanStack Query for data fetching
- **Database**: Supabase PostgreSQL with service layer access
- **API**: Supabase Edge Functions for server-side logic
- **PDF Generation**: Client-side with jsPDF, server-side with pdf-lib

## Development Standards
- **File & Directory Names**: kebab-case
- **Component Names**: PascalCase
- **Variables, Functions, Methods**: camelCase
- **Environment Variables**: UPPERCASE
- **Documentation**: JSDoc for components, markdown for architecture
- **Data Fetching**: TanStack Query hooks with consistent patterns

## Database Configuration
- Supabase Project ID: swrfsullhirscyxqneay
- Organization ID: wqvabpftcfdxxyzdnfmb
- Database Host: db.swrfsullhirscyxqneay.supabase.co
- Database Version: 15.8.1.044
- PostgreSQL Connection String: postgresql://postgres.swrfsullhirscyxqneay:Lolhaha!123@aws-0-us-west-1.pooler.supabase.com:5432/postgres
