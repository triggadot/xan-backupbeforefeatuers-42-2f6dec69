import { AmountDisplay } from "@/components/shared/AmountDisplay";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Account } from "@/types/account";
import { BarChart2, User } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";

interface AccountCardProps {
  account: Account;
}

const AccountCard: React.FC<AccountCardProps> = ({ account }) => {
  const getTypeColor = (account: Account) => {
    if (account.is_customer && account.is_vendor) {
      return "bg-green-100 text-green-800";
    } else if (account.is_customer) {
      return "bg-blue-100 text-blue-800";
    } else if (account.is_vendor) {
      return "bg-purple-100 text-purple-800";
    } else {
      return "bg-gray-100 text-gray-800";
    }
  };

  const getAccountType = (account: Account) => {
    if (account.is_customer && account.is_vendor) {
      return "Customer & Vendor";
    } else if (account.is_customer) {
      return "Customer";
    } else if (account.is_vendor) {
      return "Vendor";
    } else {
      return "Account";
    }
  };

  // Determine the variant for the balance display based on positive or negative
  const getBalanceVariant = (balance: number) => {
    if (balance > 0) {
      return "success"; // Positive: They owe us money (good for our business)
    } else if (balance < 0) {
      return "destructive"; // Negative: We owe them money
    }
    return "default"; // Zero balance
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Link to={`/accounts/${account.id}`} className="block">
              <div className="flex items-center gap-3 mb-2">
                <Avatar className="h-10 w-10">
                  {account.photo ? (
                    <AvatarImage
                      src={account.photo}
                      alt={account.account_name}
                    />
                  ) : null}
                  <AvatarFallback>
                    {getInitials(account.account_name)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-lg truncate">
                  {account.account_name}
                </h3>
              </div>
            </Link>

            <div className="flex gap-1 items-center text-sm text-muted-foreground mb-2">
              <User size={14} />
              <span className="capitalize">{account.client_type}</span>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <Badge
                variant="outline"
                className={`capitalize ${getTypeColor(account)}`}
              >
                {account.client_type}
              </Badge>

              <AmountDisplay
                amount={account.balance}
                variant={getBalanceVariant(account.balance)}
              />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-3 pt-0 flex justify-end">
        <Link to={`/account-overview/${account.id}`} className="w-full">
          <Button variant="outline" size="sm" className="w-full">
            <BarChart2 className="h-4 w-4 mr-2" />
            Financial Overview
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default AccountCard;
