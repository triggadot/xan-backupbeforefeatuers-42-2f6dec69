"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils"; // Assuming cn might be needed later or by Button/Dropdown internally

/**
 * Interface for the options to be displayed in the dropdown.
 */
interface Option {
  label: string;
  description?: string; // Optional description
  value: string;         // Unique value for identification
}

/**
 * Props for the SplitButtonDropdown component.
 */
interface SplitButtonDropdownProps {
  /** Array of options to display in the dropdown. */
  options: Option[];
  /** The initial value of the selected option. Defaults to the first option's value if not provided. */
  initialSelectedValue?: string;
  /** Callback function triggered when the selected option changes. Passes the new value and the full option object. */
  onSelectionChange?: (selectedValue: string, selectedOption: Option) => void;
  /** Placeholder text to display when no option is selected or options are empty */
  placeholder?: string;
  /** Disables the button */
  disabled?: boolean;
}

/**
 * A reusable split button dropdown component.
 * Displays the selected option's label on the main button and allows selection from a dropdown.
 *
 * @param {SplitButtonDropdownProps} props - The component props.
 * @param {Option[]} props.options - The list of options for the dropdown.
 * @param {string} [props.initialSelectedValue] - The initial value to be selected.
 * @param {(selectedValue: string, selectedOption: Option) => void} [props.onSelectionChange] - Callback for when selection changes.
 * @param {string} [props.placeholder="Select an option"] - Placeholder text.
 * @param {boolean} [props.disabled=false] - Disables the component.
 */
export function SplitButtonDropdown({
  options = [], // Default to empty array
  initialSelectedValue,
  onSelectionChange,
  placeholder = "Select an option",
  disabled = false,
}: SplitButtonDropdownProps) {
  // Find the initial value based on initialSelectedValue, default to first item if not found or not provided
  const getInitialValue = () => {
    if (initialSelectedValue) {
      const found = options.find(opt => opt.value === initialSelectedValue);
      if (found) return found.value;
    }
    return options.length > 0 ? options[0].value : ''; // Default to first option's value or empty string
  };

  const [selectedValue, setSelectedValue] = useState<string>(getInitialValue());

  // Update state if the initial value prop changes externally
  useEffect(() => {
    setSelectedValue(getInitialValue());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSelectedValue, options]); // Re-run if initial value or options change


  const handleValueChange = (value: string) => {
    setSelectedValue(value);
    if (onSelectionChange) {
      const selectedOption = options.find(opt => opt.value === value);
      if (selectedOption) {
        onSelectionChange(value, selectedOption);
      }
    }
  };

  // Find the full selected option object based on the current selectedValue
  const selectedOption = options.find(opt => opt.value === selectedValue);

  return (
    <div className="inline-flex -space-x-px divide-x divide-primary-foreground/30 rounded-lg shadow-sm shadow-black/5 rtl:space-x-reverse">
      {/* Display the selected option's label on the main button */}
      <Button
        className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 min-w-[120px] justify-start text-left px-3" // Added min-width and alignment
        variant="outline" // Match style with dropdown trigger
        disabled={disabled || options.length === 0} // Disable if no options or explicitly disabled
      >
        {selectedOption?.label || placeholder}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10"
            size="icon"
            variant="outline" // Match style with main button
            aria-label="Options"
            disabled={disabled || options.length === 0} // Disable if no options or explicitly disabled
          >
            <ChevronDown size={16} strokeWidth={2} aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="max-w-64 md:max-w-xs" // Consider adjusting based on content
          side="bottom"
          sideOffset={4}
          align="end"
        >
          {/* Use value for DropdownMenuRadioGroup */}
          <DropdownMenuRadioGroup value={selectedValue} onValueChange={handleValueChange}>
            {options.map((option) => (
              <DropdownMenuRadioItem
                key={option.value} // Use the unique value as key
                value={option.value} // Set the value for the item
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">{option.label}</span>
                  {option.description && <span className="text-xs text-muted-foreground">{option.description}</span>}
                </div>
              </DropdownMenuRadioItem>
            ))}
            {options.length === 0 && (
              <DropdownMenuRadioItem value="" disabled>No options available</DropdownMenuRadioItem>
            )}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
