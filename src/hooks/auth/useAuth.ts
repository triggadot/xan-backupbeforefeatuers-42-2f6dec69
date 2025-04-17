import { useContext } from 'react';
import { AuthContext, AuthContextType } from '@/components/auth/AuthContext';

/**
 * Hook for accessing authentication context
 * 
 * This hook provides access to the authentication state and methods
 * from the AuthContext. It must be used within an AuthProvider.
 * 
 * @returns {AuthContextType} The authentication context containing user state and auth methods
 * @throws {Error} If used outside of an AuthProvider
 * 
 * @example
 * ```tsx
 * const { user, signIn, signOut } = useAuth();
 * 
 * if (user) {
 *   return <button onClick={signOut}>Sign Out</button>;
 * }
 * 
 * return <button onClick={() => signIn()}>Sign In</button>;
 * ```
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    console.error('useAuth must be used within an AuthProvider');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
