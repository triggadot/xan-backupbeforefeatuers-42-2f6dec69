import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/utils/use-toast';
import { GlConnection } from '@/types/glsync';

/**
 * Hook for managing Glide connections
 * 
 * This hook provides functionality to fetch and manage connections to Glide applications.
 * It includes caching to avoid unnecessary refetches and real-time updates.
 * 
 * @returns {Object} Object containing connections data and management functions
 * @returns {GlConnection[]} connections - Array of connection objects
 * @returns {boolean} isLoading - State indicating if connections are being loaded
 * @returns {Function} fetchConnections - Function to fetch connections with optional force refresh
 * 
 * @example
 * ```tsx
 * const { connections, isLoading, fetchConnections } = useConnections();
 * 
 * // Force refresh connections
 * const handleRefresh = () => {
 *   fetchConnections(true);
 * };
 * 
 * // Display connections in a component
 * return (
 *   <div>
 *     {isLoading ? (
 *       <p>Loading connections...</p>
 *     ) : (
 *       <ul>
 *         {connections.map(conn => (
 *           <li key={conn.id}>{conn.app_name}</li>
 *         ))}
 *       </ul>
 *     )}
 *   </div>
 * );
 * ```
 */
export function useConnections() {
  const [connections, setConnections] = useState<GlConnection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  /**
   * Fetches connections from the database
   * 
   * @param {boolean} forceRefresh - Whether to force a refresh even if connections are already loaded
   * @returns {Promise<GlConnection[]>} Array of connections
   */
  const fetchConnections = useCallback(async (forceRefresh = false) => {
    if (connections.length > 0 && !forceRefresh) return connections;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('gl_connections')
        .select('*')
        .order('app_name', { ascending: true });
      
      if (error) throw error;
      
      // Type assertion to ensure compatibility with GlConnection
      const typedConnections = (data || []).map(conn => ({
        ...conn,
        settings: conn.settings as Record<string, any> | null
      })) as GlConnection[];
      
      setConnections(typedConnections);
      return typedConnections;
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast({
        title: 'Error',
        description: 'Failed to load connections',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [connections.length, toast]);

  // Fetch connections on component mount
  useEffect(() => {
    fetchConnections();
  }, []);

  return { connections, isLoading, fetchConnections };
}
