# Telegram Product Matching: Admin Dashboard Guide

## Overview

The Product Matching Admin Dashboard provides an intuitive interface for managing the product approval queue, reviewing matches, and creating new products from Telegram media. This guide explains how to use all dashboard features effectively.

## Accessing the Dashboard

Add the dashboard to your application routing:

```tsx
// In your application routes
<Route 
  path="/admin/product-matching" 
  element={<ProductMatchingDashboard />} 
/>
```

## Dashboard Features

### Main Interface

![Admin Dashboard](./dashboard-screenshot.png)

The dashboard consists of several key areas:

1. **Filter Panel** - Search and filter queue items
2. **Approval Queue** - Grid or drag-and-drop view of items
3. **Batch Operations** - Actions for multiple selected items
4. **Vendor Groups** - Items grouped by vendor

### View Modes

The dashboard offers two view modes:

1. **Grid View** - Traditional grid layout of approval items
   - Quick overview of many items at once
   - Checkbox selection for batch operations
   - Click items to see details

2. **Drag & Drop View** - Interactive drag-and-drop interface
   - Drag items to approve, reject, or create products
   - Visual feedback during dragging
   - Drop zones for different actions

Toggle between views using the tabs at the top of the queue section.

## Working with Individual Items

### Viewing Item Details

Click on any item to open the detail view, which shows:

- High-resolution media preview
- Original caption and extracted data
- Potential product matches with confidence scores
- Match reasons (why items were matched)

### Approving Items

Items can be approved in several ways:

1. **From the grid view**:
   - Click the "Approve" button on the item card

2. **From the detail view**:
   - Click "Approve Best Match" to use the top match
   - Click "Approve" next to any potential match in the list

3. **Using drag and drop**:
   - Drag the item to the "Approve" drop zone
   - Or drag to a specific product in the product list

### Rejecting Items

Similarly, items can be rejected through:

1. **Button clicks** on item cards or in the detail view
2. **Drag and drop** to the "Reject" zone

You can optionally provide a reason when rejecting items.

### Creating New Products

When no suitable match exists:

1. Click the "Create" button on an item, or drag it to the "Create New Product" zone
2. Fill in the product creation form
   - Basic fields are pre-populated from the media data
   - Add additional details as needed
3. Submit to create the product and link the media

## Batch Operations

For efficient processing of multiple items:

1. **Select items** using checkboxes
   - Use "Select All" to select everything visible
   - Or select specific items individually

2. **View selection summary**
   - See counts by vendor and purchase order
   - Quickly identify groups of related items

3. **Perform batch actions**
   - "Approve All" - Link all selected items to one product
   - "Reject All" - Reject all items with an optional reason

## Vendor Grouping

The dashboard automatically groups items by vendor for easier management:

- View all items from the same vendor together
- Quick count of items per vendor
- Easy identification of related products

This is particularly useful when processing large batches of new inventory from a single vendor.

## AI Integration Status

When AI integration is enabled, medium-confidence matches are sent to n8n for evaluation. The dashboard shows the status of these items:

- **Processing** - Currently being evaluated by AI
- **Completed** - AI has returned a decision
- **Error** - Problem with AI processing

AI decisions are visible in the item details, including the reasoning for each decision.

## Filtering and Search

Use the filter panel to find specific items:

1. **Status filter**
   - Pending - Items awaiting review
   - Approved - Successfully matched items
   - Rejected - Items that were rejected
   - Auto-matched - Items automatically matched by the system

2. **Search bar**
   - Search by product name
   - Search by vendor name
   - Partial matching supported

3. **Advanced filters** (available in expanded view)
   - Date range filters
   - Match confidence filters
   - Media type filters (image/video)

## Keyboard Shortcuts

The dashboard supports keyboard shortcuts for power users:

| Shortcut      | Action                      |
|---------------|-----------------------------|
| `A`           | Approve selected item       |
| `R`           | Reject selected item        |
| `C`           | Create product from item    |
| `Esc`         | Close current dialog        |
| `Shift+A`     | Select/deselect all items   |
| `←` / `→`     | Navigate between items      |

## Best Practices

### Efficient Workflow

1. **Start with high-confidence matches**
   - These are most likely to be correct
   - Quick wins to reduce the queue size

2. **Group by vendor**
   - Process all items from one vendor at a time
   - Easier to spot related products

3. **Use batch operations**
   - Handle similar items together
   - Save time with bulk actions

4. **Leverage AI assistance**
   - Let AI handle medium-confidence matches
   - Review AI decisions for accuracy

### Improving Match Quality

To improve automatic match quality over time:

1. **Consistent product naming**
   - Use consistent naming in both Telegram captions and product records
   - This improves text matching accuracy

2. **Include purchase order references**
   - Always include purchase order UIDs in captions when available
   - This provides a strong matching signal

3. **Monitor match statistics**
   - Review match confidence scores over time
   - Identify common patterns in mismatches

4. **Refine configuration**
   - Adjust confidence thresholds in `product_matching_config`
   - Tune field weights for your specific product catalog

## Troubleshooting

### Common Issues

1. **No matches found**
   - Check for typos in product names or vendor references
   - Verify purchase dates are within the configured window
   - Ensure product exists in the `gl_products` table

2. **Incorrect matches**
   - Review match reasons to understand why it matched
   - Adjust field weights in configuration if particular fields cause issues
   - Use the reject functionality with a descriptive reason

3. **Slow performance with large queues**
   - Use filters to reduce the displayed items
   - Process in smaller batches
   - Increase pagination limit if your system can handle it

### Support and Feedback

If you encounter issues or have suggestions:

1. Check the logs for error messages
2. Document the steps to reproduce any problems
3. Note specific queue IDs of problematic items
