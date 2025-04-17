# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/d78015a4-6ce3-4ef5-a5b3-13bdcc40f648

## Development Standards & Conventions
This project follows specific coding standards and conventions:

- **File & Directory Names:** kebab-case (e.g., `invoice-list.tsx`, `purchase-orders/`)
- **React Components:** PascalCase (e.g., `InvoiceList`, `PurchaseOrderTable`)
- **Variables, Functions, Methods:** camelCase (e.g., `handleSubmit`, `invoiceData`)
- **Environment Variables:** UPPERCASE (e.g., `API_URL`, `DATABASE_URL`)
- **Exports:** Named exports for components

**Source of Truth:** Complete documentation of all conventions is maintained in:
- `docs/naming-convention-plan.md` - Naming conventions and migration plan
- `docs/documentation.md` - Documentation standards and JSDoc usage
- `docs/documentation-guide.md` - Guide to all project documentation

> **Documentation Approach:** We maintain comprehensive documentation in the `/docs` directory rather than scattered README files throughout the codebase. Component and hook documentation uses JSDoc comments directly in the source code, with only key modules having their own README files.

## Technology Stack

This project is built with:

- **Frontend Framework:** React + Vite with TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** 
  - Shadcn UI (`@/components/ui/`)
  - Tremor for data visualization (`@/components/tremor/`)
- **Data Fetching:** TanStack Query (React Query)
- **Form Handling:** React Hook Form + Zod
- **State Management:** React Context

## Architecture

### Supabase-Only CRUD Architecture

All Create, Read, Update, and Delete (CRUD) operations in this project are handled directly via the Supabase client libraries and service layer. There is **no use of n8n, webhooks, or external automation** for database operations.

- All business logic and data synchronization are managed within the app or using Supabase features (such as Row Level Security and triggers).
- The service layer in `src/services/supabase/tables` provides type-safe, consistent access to all core tables.
- UI components must use this service layer for all data operations—no direct SDK calls or use of `any` types in components.
- This approach simplifies debugging, improves reliability, and ensures all CRUD actions are secure and auditable.

For more, see [Supabase CRUD documentation](https://supabase.com/docs/guides/database/crud).

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/d78015a4-6ce3-4ef5-a5b3-13bdcc40f648) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/d78015a4-6ce3-4ef5-a5b3-13bdcc40f648) and click on Share -> Publish.

## I want to use a custom domain - is that possible?
