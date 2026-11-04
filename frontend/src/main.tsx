import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/inter';
import { TemaSysmoDev } from '@comum/mui/TemaSysmoDev';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TemaSysmoDev>
      <App />
    </TemaSysmoDev>
  </React.StrictMode>
);
