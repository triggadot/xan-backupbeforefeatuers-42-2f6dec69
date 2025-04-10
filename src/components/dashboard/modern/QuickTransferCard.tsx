import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from '@/lib/utils';
import { DollarSign } from 'lucide-react';
import React, { useState } from 'react';

interface Contact {
  id: string;
  name: string;
  avatar?: string;
}

interface QuickTransferCardProps {
  contacts: Contact[];
  className?: string;
  onTransfer?: (contactId: string, amount: number) => Promise<void>;
}

export default function QuickTransferCard({ 
  contacts, 
  className,
  onTransfer 
}: QuickTransferCardProps) {
  const [amount, setAmount] = useState<string>('');
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and decimals
    const value = e.target.value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
      return;
    }
    
    // Limit to 2 decimal places
    if (parts.length > 1 && parts[1].length > 2) {
      return;
    }
    
    setAmount(value);
  };
  
  const handleContactSelect = (contactId: string) => {
    setSelectedContact(prevId => prevId === contactId ? null : contactId);
  };
  
  const handleTransfer = async () => {
    if (!selectedContact || !amount || parseFloat(amount) <= 0) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (onTransfer) {
        await onTransfer(selectedContact, parseFloat(amount));
      }
      
      // Reset form after successful transfer
      setAmount('');
      setSelectedContact(null);
    } catch (error) {
      console.error('Transfer failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Quick Transfer</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Amount input */}
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              value={amount}
              onChange={handleAmountChange}
              placeholder="Enter amount"
              className="pl-10"
              inputMode="decimal"
            />
          </div>
          
          {/* Recent contacts */}
          <div>
            <div className="text-xs text-muted-foreground mb-3">Recent</div>
            <div className="flex flex-wrap gap-2 md:gap-3">
              {contacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => handleContactSelect(contact.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-1 rounded-md transition-colors",
                    selectedContact === contact.id && "bg-muted"
                  )}
                >
                  <Avatar className="h-12 w-12 border-2 transition-colors" 
                    style={{ borderColor: selectedContact === contact.id ? 'var(--primary)' : 'transparent' }}
                  >
                    <AvatarImage src={contact.avatar} alt={contact.name} />
                    <AvatarFallback className="text-xs">
                      {contact.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium max-w-[60px] truncate">
                    {contact.name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Transfer button */}
          <Button 
            className="w-full" 
            disabled={!selectedContact || !amount || parseFloat(amount) <= 0 || isLoading}
            onClick={handleTransfer}
          >
            {isLoading ? 'Processing...' : 'Send'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 