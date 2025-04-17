"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBreakpoint } from "@/hooks/utils/use-mobile";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Interface for the options to be displayed in the dropdown.
 */
interface Option {
  label: string;
  description?: string; // Optional description
  value: string;         // Unique value for identification
  icon?: React.ReactNode; // Optional icon for mobile view
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
  /** Optional custom width for the main button */
  buttonWidth?: string;
  /** Optional class for the container */
  className?: string;
  /** Whether to use a compact mobile view */
  compactOnMobile?: boolean;
  /** Optional size for the component */
  size?: 'default' | 'sm' | 'lg';
}

/**
 * A reusable split button dropdown component with responsive behavior.
 * Displays the selected option's label on the main button and allows selection from a dropdown.
 * On mobile devices, it can adapt to a more touch-friendly interface.
 *
 * @param {SplitButtonDropdownProps} props - The component props.
 * @param {Option[]} props.options - The list of options for the dropdown.
 * @param {string} [props.initialSelectedValue] - The initial value to be selected.
 * @param {(selectedValue: string, selectedOption: Option) => void} [props.onSelectionChange] - Callback for when selection changes.
 * @param {string} [props.placeholder="Select an option"] - Placeholder text.
 * @param {boolean} [props.disabled=false] - Disables the component.
 * @param {string} [props.buttonWidth] - Custom width for the main button.
 * @param {string} [props.className] - Additional classes for the container.
 * @param {boolean} [props.compactOnMobile=false] - Whether to use a compact view on mobile.
 * @param {'default' | 'sm' | 'lg'} [props.size='default'] - Size variant for the component.
 */
export function SplitButtonDropdown({
  options = [], // Default to empty array
  initialSelectedValue,
  onSelectionChange,
  placeholder = "Select an option",
  disabled = false,
  buttonWidth,
  className,
  compactOnMobile = false,
  size = 'default',
}: SplitButtonDropdownProps) {
  const isMobile = useBreakpoint('md');
  const [isOpen, setIsOpen] = useState(false);
  
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
    setIsOpen(false); // Close dropdown after selection
    
    if (onSelectionChange) {
      const selectedOption = options.find(opt => opt.value === value);
      if (selectedOption) {
        onSelectionChange(value, selectedOption);
      }
    }
  };

  // Find the full selected option object based on the current selectedValue
  const selectedOption = options.find(opt => opt.value === selectedValue);
  
  // Get the appropriate size classes
  const getSizeClasses = () => {
    switch(size) {
      case 'sm':
        return isMobile ? 'h-8 text-xs' : 'h-8 text-xs';
      case 'lg':
        return isMobile ? 'h-11 text-base' : 'h-11 text-base';
      default:
        return isMobile ? 'h-9 text-sm' : 'h-10 text-sm';
    }
  };
  
  const sizeClasses = getSizeClasses();
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;

  // For small mobile screens, we might want a more compact display
  if (isMobile && compactOnMobile) {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            className={cn(
              "w-full touch-manipulation active:scale-[0.98] transition-all flex justify-between items-center gap-2",
              buttonWidth && `w-${buttonWidth}`,
              sizeClasses,
              className
            )}
            variant="outline"
            disabled={disabled || options.length === 0}
          >
            <span className="truncate">
              {selectedOption?.label || placeholder}
            </span>
            <ChevronDown size={iconSize} strokeWidth={2} className={isOpen ? "rotate-180 transition-transform" : "transition-transform"} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="max-w-64 w-64 max-h-[50vh] overflow-auto"
          side="bottom"
          align="center"
          sideOffset={8}
        >
          <DropdownMenuRadioGroup value={selectedValue} onValueChange={handleValueChange}>
            {options.map((option) => (
              <DropdownMenuRadioItem
                key={option.value}
                value={option.value}
                className="touch-manipulation py-3"
              >
                <div className="flex items-center gap-3">
                  {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="font-medium truncate">{option.label}</span>
                    {option.description && <span className="text-xs text-muted-foreground line-clamp-2">{option.description}</span>}
                  </div>
                </div>
              </DropdownMenuRadioItem>
            ))}
            {options.length === 0 && (
              <DropdownMenuRadioItem value="" disabled className="py-3">No options available</DropdownMenuRadioItem>
            )}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className={cn(
      "inline-flex -space-x-px divide-x divide-primary-foreground/30 rounded-lg shadow-sm shadow-black/5 rtl:space-x-reverse",
      className
    )}>
      {/* Display the selected option's label on the main button */}
      <Button
        className={cn(
          "rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 justify-start text-left px-3 truncate",
          buttonWidth ? buttonWidth : isMobile ? "min-w-[100px]" : "min-w-[120px]",
          sizeClasses
        )}
        variant="outline"
        disabled={disabled || options.length === 0}
      >
        {selectedOption?.label || placeholder}
      </Button>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            className={cn(
              "rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 touch-manipulation",
              sizeClasses
            )}
            size="icon"
            variant="outline"
            aria-label="Options"
            disabled={disabled || options.length === 0}
          >
            <ChevronDown 
              size={iconSize} 
              strokeWidth={2} 
              aria-hidden="true" 
              className={isOpen ? "rotate-180 transition-transform" : "transition-transform"}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className={cn(
            isMobile ? "w-56 max-h-[40vh]" : "max-w-64 md:max-w-xs",
            "overflow-auto"
          )}
          side="bottom"
          sideOffset={isMobile ? 8 : 4}
          align="end"
        >
          <DropdownMenuRadioGroup value={selectedValue} onValueChange={handleValueChange}>
            {options.map((option) => (
              <DropdownMenuRadioItem
                key={option.value}
                value={option.value}
                className={isMobile ? "touch-manipulation py-3" : ""}
              >
                <div className={cn(
                  "flex",
                  option.icon ? "flex-row items-center gap-3" : "flex-col gap-1"
                )}>
                  {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className={cn(
                      isMobile ? "font-medium" : "text-sm font-medium",
                      "truncate"
                    )}>
                      {option.label}
                    </span>
                    {option.description && (
                      <span className={cn(
                        "text-xs text-muted-foreground",
                        isMobile ? "line-clamp-2" : ""
                      )}>
                        {option.description}
                      </span>
                    )}
                  </div>
                </div>
              </DropdownMenuRadioItem>
            ))}
            {options.length === 0 && (
              <DropdownMenuRadioItem 
                value="" 
                disabled
                className={isMobile ? "py-3" : ""}
              >
                No options available
              </DropdownMenuRadioItem>
            )}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
