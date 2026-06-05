import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { CareerGoalsProvider } from './context/CareerGoalsContext';
import { ProfileProvider } from './context/ProfileContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <CareerGoalsProvider>
        <ProfileProvider>
          <App />
        </ProfileProvider>
      </CareerGoalsProvider>
    </BrowserRouter>
  </React.StrictMode>
);
