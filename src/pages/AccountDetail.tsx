import React from 'react';
import AccountDetailView from '@/components/accounts/AccountDetailView';

interface AccountDetailProps {
  isEditing?: boolean;
}

const AccountDetail: React.FC<AccountDetailProps> = ({ isEditing = false }) => {
  return <AccountDetailView isEditing={isEditing} />;
};

export default AccountDetail;
