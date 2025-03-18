
export const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleString();
};
