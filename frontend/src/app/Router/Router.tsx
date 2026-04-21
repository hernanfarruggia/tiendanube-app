import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AISettings, Examples, Home, Products } from '@/pages';

const Router: React.FC = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/products" element={<Products />} />
    <Route path="/examples" element={<Examples />} />
    <Route path="/ai-settings" element={<AISettings />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default Router;
