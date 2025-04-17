# Page Migration Template

This directory serves as a template for migrating other top-level pages into their own structured directories.

## Directory Structure Pattern

```
src/pages/[feature-name]/
├── index.tsx           # Main listing page
├── index.ts            # Barrel file for exports
├── page-exports.ts     # Direct exports to avoid circular references
├── create.tsx          # Creation page (if applicable)
├── [id].tsx            # Detail page
├── [id]/               # Nested pages for specific ID
│   └── edit.tsx        # Edit page
└── README.md           # Documentation
```

## Migration Steps

1. Create the directory structure following the pattern above
2. Move the page components with kebab-case filenames
3. Set up the barrel files for easy importing
4. Update imports in App.tsx to use the barrel file
5. Refactor routes to use nested route pattern
6. Delete the old files
7. Document the structure in README.md

## Example for Routes

```jsx
{/* Feature routes */}
<Route path="feature-name">
  <Route 
    index
    element={
      <ProtectedRoute>
        <FeatureListPage />
      </ProtectedRoute>
    } 
  />
  <Route 
    path="new" 
    element={
      <ProtectedRoute>
        <CreateFeaturePage />
      </ProtectedRoute>
    } 
  />
  <Route 
    path=":id" 
    element={
      <ProtectedRoute>
        <FeatureDetailPage />
      </ProtectedRoute>
    } 
  />
  <Route 
    path=":id/edit" 
    element={
      <ProtectedRoute>
        <EditFeaturePage />
      </ProtectedRoute>
    } 
  />
</Route>
``` 