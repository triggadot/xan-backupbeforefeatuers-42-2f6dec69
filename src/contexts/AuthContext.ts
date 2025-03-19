import { createContext } from 'react';
import { Session, User } from '@supabase/supabase-js';

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  error: Error | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined); 