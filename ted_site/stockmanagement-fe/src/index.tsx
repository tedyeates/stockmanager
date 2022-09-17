import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import './styles/index.css';
import '@fontsource/roboto';

import App from './pages/App';

import { AuthProvider, Login, RequireAuth } from "./pages/context/Login"
import { PageTypeChangerProvider } from "./pages/context/PageChanger"

const container = document.getElementById('root');
const root = createRoot(container!); // createRoot(container!) if you use TypeScript
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={
            <RequireAuth>
              <PageTypeChangerProvider>
                <App />
              </PageTypeChangerProvider>
            </RequireAuth>
          } />
          <Route path="/login" element={<Login />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)

