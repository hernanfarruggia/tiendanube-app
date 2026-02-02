import React, { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Box, Text, ToastProvider } from '@nimbus-ds/components';
import { ErrorBoundary, connect, iAmReady } from '@tiendanube/nexo';
import Router from '@/app/Router';

import nexo from './NexoClient';
import NexoSyncRoute from './NexoSyncRoute';
import { DarkModeProvider } from './DarkModeProvider';
import './I18n';

const App: React.FC = () => {
  const [isConnect, setIsConnect] = useState(false);

  useEffect(() => {
    const conn = async () => {
      return await connect(nexo)
        .then(async () => {
          console.log('asd');
          setIsConnect(true);
          iAmReady(nexo);
        })
        .catch((e: any) => {
          console.error(e)
          setIsConnect(false);
        });
    }

    if (!isConnect) {
      conn();
    }
  }, []);

  if (!isConnect)
    return (
      <Box
        height="100vh"
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <Text>Conectando...</Text>
      </Box>
    );

  return (
    <ErrorBoundary nexo={nexo}>
      <DarkModeProvider>
        <ToastProvider>
          <BrowserRouter>
            <NexoSyncRoute>
              <Router />
            </NexoSyncRoute>
          </BrowserRouter>
        </ToastProvider>
      </DarkModeProvider>
    </ErrorBoundary>
  );
};

export default App;
