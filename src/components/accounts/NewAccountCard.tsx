
import React from 'react';
import { Account } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/format-utils';
import { Mail, Phone, User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AccountCardProps {
  account: Account;
}

const NewAccountCard: React.FC<AccountCardProps> = ({ account }) => {
  const getTypeColor = (account: Account) => {
    if (account.is_customer && account.is_vendor) {
      return 'bg-green-100 text-green-800';
    } else if (account.is_customer) {
      return 'bg-blue-100 text-blue-800';
    } else if (account.is_vendor) {
      return 'bg-purple-100 text-purple-800';
    } else {
      return 'bg-gray-100 text-gray-800';
    }
  };

  const getAccountType = (account: Account) => {
    if (account.is_customer && account.is_vendor) {
      return 'Customer & Vendor';
    } else if (account.is_customer) {
      return 'Customer';
    } else if (account.is_vendor) {
      return 'Vendor';
    } else {
      return 'Account';
    }
  };

  return (
    <Link to={`/accounts/${account.id}`} className="block transition-transform hover:translate-y-[-2px]">
      <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1 truncate">{account.name}</h3>
              
              <div className="flex gap-1 items-center text-sm text-muted-foreground mb-2">
                <User size={14} />
                <span className="capitalize">{getAccountType(account)}</span>
              </div>
              
              {account.email && (
                <div className="flex gap-1 items-center text-sm text-muted-foreground">
                  <Mail size={14} />
                  <span className="truncate">{account.email}</span>
                </div>
              )}
              
              {account.phone && (
                <div className="flex gap-1 items-center text-sm text-muted-foreground">
                  <Phone size={14} />
                  <span>{account.phone}</span>
                </div>
              )}
              
              <div className="mt-4 flex items-center justify-between">
                <Badge 
                  variant="outline"
                  className={`capitalize ${getTypeColor(account)}`}
                >
                  {getAccountType(account)}
                </Badge>
                
                <span className="font-medium">
                  {formatCurrency(account.balance)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default NewAccountCard;
