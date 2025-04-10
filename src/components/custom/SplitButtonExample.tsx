import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { useBreakpoint } from '@/hooks/use-mobile';
import { HideAt, ShowAt } from '@/hooks/use-responsive';
import { Bell, Calendar, Home, Settings, User } from 'lucide-react';
import { useState } from 'react';
import { SplitButtonDropdown } from './SplitButtonDropdown';

const optionsWithIcons = [
  {
    label: 'Home',
    value: 'home',
    description: 'Go to the homepage',
    icon: <Home size={18} />
  },
  {
    label: 'Profile',
    value: 'profile',
    description: 'View your profile settings',
    icon: <User size={18} />
  },
  {
    label: 'Settings',
    value: 'settings',
    description: 'Change your app preferences',
    icon: <Settings size={18} />
  },
  {
    label: 'Notifications',
    value: 'notifications',
    description: 'Manage your notification settings',
    icon: <Bell size={18} />
  },
  {
    label: 'Calendar',
    value: 'calendar',
    description: 'View your upcoming events',
    icon: <Calendar size={18} />
  }
];

const documentOptions = [
  {
    label: 'Invoices',
    value: 'invoices',
    description: 'Manage your invoices'
  },
  {
    label: 'Purchase Orders',
    value: 'purchase-orders',
    description: 'View purchase orders'
  },
  {
    label: 'Quotes',
    value: 'quotes',
    description: 'Send and track quotes'
  },
  {
    label: 'Receipts',
    value: 'receipts',
    description: 'Access your receipts'
  }
];

export function SplitButtonExample() {
  const isMobile = useBreakpoint('md');
  const [selectedValue, setSelectedValue] = useState('home');
  const [selectedDoc, setSelectedDoc] = useState('invoices');
  
  const handleSelection = (value: string) => {
    setSelectedValue(value);
    console.log(`Selected: ${value}`);
  };
  
  const handleDocSelection = (value: string) => {
    setSelectedDoc(value);
    console.log(`Selected document: ${value}`);
  };
  
  return (
    <Container>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Responsive Split Button Dropdown</CardTitle>
          <CardDescription>
            These buttons automatically adapt to different screen sizes and are touch-friendly on mobile devices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Standard Usage</h3>
            <div className="space-y-4">
              <SplitButtonDropdown 
                options={optionsWithIcons}
                initialSelectedValue={selectedValue}
                onSelectionChange={(value) => handleSelection(value)}
                placeholder="Select option"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Size Variants</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <SplitButtonDropdown 
                options={documentOptions}
                size="sm" 
                placeholder="Small"
              />
              
              <SplitButtonDropdown 
                options={documentOptions}
                placeholder="Default"
              />
              
              <SplitButtonDropdown 
                options={documentOptions}
                size="lg" 
                placeholder="Large"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Mobile Compact View</h3>
            <div className="space-y-4">
              <SplitButtonDropdown 
                options={optionsWithIcons}
                initialSelectedValue={selectedValue}
                onSelectionChange={(value) => handleSelection(value)}
                placeholder="Select option"
                compactOnMobile={true}
                className="w-full sm:w-auto"
              />
            </div>
          </div>
          
          <ShowAt breakpoint="md" below>
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-medium">Mobile-Optimized</h3>
              <p className="text-sm text-muted-foreground">
                This section only appears on mobile devices, showing the touch-optimized version.
              </p>
              <div className="grid grid-cols-1 gap-4">
                <SplitButtonDropdown 
                  options={optionsWithIcons}
                  compactOnMobile={true}
                  className="w-full"
                  placeholder="Navigation"
                />
                
                <SplitButtonDropdown 
                  options={documentOptions}
                  compactOnMobile={true}
                  className="w-full"
                  initialSelectedValue={selectedDoc}
                  onSelectionChange={(value) => handleDocSelection(value)}
                  placeholder="Documents"
                />
              </div>
            </div>
          </ShowAt>
        </CardContent>
      </Card>
      
      <HideAt breakpoint="md" below>
        <Card>
          <CardHeader>
            <CardTitle>Desktop Features</CardTitle>
            <CardDescription>
              This card is only visible on desktop screens.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <SplitButtonDropdown 
                options={optionsWithIcons.slice(0, 3)}
                buttonWidth="w-48"
                placeholder="Navigation"
              />
              
              <SplitButtonDropdown 
                options={documentOptions}
                initialSelectedValue={selectedDoc}
                onSelectionChange={(value) => handleDocSelection(value)}
                placeholder="Documents"
                buttonWidth="w-64"
              />
            </div>
          </CardContent>
        </Card>
      </HideAt>
    </Container>
  );
} 