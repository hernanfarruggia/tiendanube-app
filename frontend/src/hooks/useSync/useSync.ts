import { useCallback, useState } from 'react';
import { useFetch } from '@/hooks';
import { ISyncResponse, ISyncStatus } from './useSync.types';

const useSync = () => {
  const { request } = useFetch();
  const [isLoading, setIsLoading] = useState(false);

  const syncProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await request<ISyncResponse>({
        url: '/products/sync',
        method: 'POST',
      });
      setIsLoading(false);
      return response.content;
    } catch (error: any) {
      setIsLoading(false);
      throw error;
    }
  }, [request]);

  const getSyncStatus = useCallback(async () => {
    try {
      const response = await request<ISyncStatus>({
        url: '/products/sync/status',
        method: 'GET',
      });
      return response.content;
    } catch (error: any) {
      throw error;
    }
  }, [request]);

  return { syncProducts, getSyncStatus, isLoading };
};

export default useSync;
