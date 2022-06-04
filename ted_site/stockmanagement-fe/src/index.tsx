import React from 'react';
import ReactDOM from 'react-dom';
import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import './index.css';
import '@fontsource/roboto';

import App from './App';
import { AuthProvider, Login, RequireAuth } from './context/Login';

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
            <Route path="/" element={
              <RequireAuth>
                <App />
              </RequireAuth>
            } />
          <Route path="/login" element={<Login />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);

