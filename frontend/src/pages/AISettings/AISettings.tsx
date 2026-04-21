import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Page } from '@nimbus-ds/patterns';
import { navigateHeaderRemove } from '@tiendanube/nexo';
import {
  Card,
  Text,
  Box,
  Button,
  Title,
  Spinner,
  useToast,
} from '@nimbus-ds/components';

import { nexo } from '@/app';
import { useSync } from '@/hooks';
import type { ISyncStatus } from '@/hooks/useSync';

const AISettings: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { syncProducts, getSyncStatus, isLoading } = useSync();
  const [syncStatus, setSyncStatus] = useState<ISyncStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    navigateHeaderRemove(nexo);
    loadSyncStatus();
  }, []);

  const loadSyncStatus = async () => {
    try {
      const status = await getSyncStatus();
      setSyncStatus(status);
    } catch (error: any) {
      addToast({
        type: 'warning',
        text: error.message?.description ?? 'Error al cargar el estado',
        duration: 4000,
        id: 'error-load-status',
      });
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleSync = async () => {
    try {
      const result = await syncProducts();
      addToast({
        type: 'success',
        text: `Sincronizado: ${result.synced} productos, ${result.embeddings} embeddings generados`,
        duration: 5000,
        id: 'sync-success',
      });
      await loadSyncStatus();
    } catch (error: any) {
      addToast({
        type: 'danger',
        text: error.message?.description ?? error.message ?? 'Error al sincronizar',
        duration: 4000,
        id: 'error-sync',
      });
    }
  };

  return (
    <Page maxWidth="800px">
      <Page.Header
        title="AI Search Settings"
        onBack={() => navigate('/')}
      />
      <Page.Body>
        <Layout columns="1">
          <Layout.Section>
            <Card>
              <Card.Header title="Sincronización de Productos" />
              <Card.Body>
                <Box display="flex" flexDirection="column" gap="4" mb="2">
                  <Text>
                    Sincroniza tus productos con el sistema de búsqueda AI para generar embeddings
                    y habilitar búsquedas semánticas.
                  </Text>

                  {!loadingStatus && syncStatus && (
                    <Box display="flex" flexDirection="column" gap="2">
                      <Box display="flex" gap="2" alignItems="center">
                        <Text color="neutral-textDisabled">
                          Estado:
                        </Text>
                        <Text>
                          {syncStatus.hasSynced
                            ? '✅ Sincronizado'
                            : '⚠️ No sincronizado'}
                        </Text>
                      </Box>

                      {syncStatus.hasSynced && (
                        <>
                          <Box display="flex" gap="2" alignItems="center">
                            <Text color="neutral-textDisabled">
                              Productos:
                            </Text>
                            <Title as="h6" fontSize="h3">
                              {syncStatus.productCount ?? 0}
                            </Title>
                          </Box>
                          <Box display="flex" gap="2" alignItems="center">
                            <Text color="neutral-textDisabled">
                              Embeddings:
                            </Text>
                            <Title as="h6" fontSize="h3">
                              {syncStatus.embeddingCount ?? 0}
                            </Title>
                          </Box>
                        </>
                      )}
                    </Box>
                  )}

                  {loadingStatus && (
                    <Box display="flex" gap="2" alignItems="center">
                      <Spinner size="small" />
                      <Text>Cargando estado...</Text>
                    </Box>
                  )}
                </Box>
              </Card.Body>
              <Card.Footer>
                <Button
                  appearance="primary"
                  onClick={handleSync}
                  disabled={isLoading || loadingStatus}
                >
                  {isLoading && <Spinner color="currentColor" size="small" />}
                  {isLoading ? 'Sincronizando...' : 'Sincronizar Productos'}
                </Button>
                <Button onClick={() => navigate('/')}>
                  Volver
                </Button>
              </Card.Footer>
            </Card>
          </Layout.Section>
        </Layout>
      </Page.Body>
    </Page>
  );
};

export default AISettings;
