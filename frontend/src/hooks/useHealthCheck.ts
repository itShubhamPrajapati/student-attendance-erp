import { useState, useEffect, useCallback } from 'react';
import { checkBackendHealth } from '../services/api';
import { ConnectionState } from '../types';

export function useHealthCheck(pollIntervalMs = 10000) {
  const [state, setState] = useState<ConnectionState>({
    backendConnected: false,
    databaseConnected: false,
    loading: true,
    lastChecked: null,
  });

  const checkStatus = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const result = await checkBackendHealth();
      const isBackendUp = result.status === 'ok' || result.message.includes('QR Attendance API');
      const isDbUp = result.database === 'connected';

      setState({
        backendConnected: isBackendUp,
        databaseConnected: isDbUp,
        loading: false,
        lastChecked: new Date(),
        error: !isBackendUp ? result.message : undefined,
      });
    } catch (err: unknown) {
      setState({
        backendConnected: false,
        databaseConnected: false,
        loading: false,
        lastChecked: new Date(),
        error: err instanceof Error ? err.message : 'Unknown connection error',
      });
    }
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, pollIntervalMs);
    return () => clearInterval(interval);
  }, [checkStatus, pollIntervalMs]);

  return { ...state, refetch: checkStatus };
}
