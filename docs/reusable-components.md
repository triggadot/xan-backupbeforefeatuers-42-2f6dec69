# Reusable Custom Components

This document outlines reusable custom components built for this project, separate from the base UI primitives provided by Shadcn UI (which reside in `src/components/ui/`).

## Component Location

Reusable custom components should be placed in the `src/components/custom/` directory.

## Documentation Standard

Follow the documentation standard outlined in MEMORY[6933bfcb-2d98-403a-8824-2411e563d778]:

1.  **Location:** `src/components/custom/`
2.  **Method:** JSDoc comments above the component definition.
3.  **Content:** Description, `@param` tags for props, state explanations, context needs, usage examples.

---

## SplitButtonDropdown

**Location:** `src/components/custom/SplitButtonDropdown.tsx`

**Purpose:** Renders a split button where the main part displays the text of the currently selected option, and an attached dropdown chevron allows the user to change the selection from a predefined list.

**Dependencies:**

*   `@/components/ui/button`
*   `@/components/ui/dropdown-menu`
*   `lucide-react` (specifically `ChevronDown`)
*   `react` (`useState`)

**Current Implementation Notes:**

*   The current version uses a **hardcoded** `options` array within the component file itself.
*   The initial selection is hardcoded to the first option (index "0").

**Basic Usage (Current State):**

```typescript
import { SplitButtonDropdown } from '@/components/custom/SplitButtonDropdown';

function MyComponent() {
  return (
    <div>
      <p>Select Merge Strategy:</p>
      <SplitButtonDropdown />
    </div>
  );
}
```

**Making it Truly Reusable (TODO):**

To make this component genuinely reusable, you should modify it to accept the `options` list and optionally the `initialSelectedIndex` as props.

1.  **Define Props Interface:**
    ```typescript
    interface Option {
      label: string;
      description: string;
    }

    interface SplitButtonDropdownProps {
      options: Option[];
      initialSelectedIndex?: string; // Make initial selection optional
      onSelectionChange?: (selectedIndex: string, selectedOption: Option) => void; // Optional callback
    }
    ```
2.  **Update Component Signature:**
    ```typescript
    function SplitButtonDropdown({
      options,
      initialSelectedIndex = "0", // Default to 0 if not provided
      onSelectionChange
    }: SplitButtonDropdownProps) {
      const [selectedIndex, setSelectedIndex] = useState(initialSelectedIndex);

      // Add useEffect to handle potential changes in initialSelectedIndex prop if needed
      useEffect(() => {
        setSelectedIndex(initialSelectedIndex);
      }, [initialSelectedIndex]);

      const handleValueChange = (value: string) => {
        setSelectedIndex(value);
        if (onSelectionChange) {
           const numericIndex = Number(value);
           if (options[numericIndex]) {
             onSelectionChange(value, options[numericIndex]);
           }
        }
      };

      // ... rest of the component logic, using the passed 'options' prop
      // and calling 'handleValueChange' in DropdownMenuRadioGroup's onValueChange
      // Replace `onValueChange={setSelectedIndex}` with `onValueChange={handleValueChange}`
    }
    ```
3.  **Example Usage (with Props):**
    ```typescript
    const myOptions = [
      { label: "Option A", description: "Description for A" },
      { label: "Option B", description: "Description for B" },
    ];

    function MyComponent() {
      const handleSelect = (index, option) => {
        console.log(`Selected index ${index}:`, option.label);
      };

      return (
        <SplitButtonDropdown
          options={myOptions}
          initialSelectedIndex="1"
          onSelectionChange={handleSelect}
        />
      );
    }
    ```

This refactoring will allow you to use the `SplitButtonDropdown` with different sets of options throughout your application.

---
*(Add documentation for other custom components here as they are created)*
