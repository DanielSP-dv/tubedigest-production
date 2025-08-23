import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import ChannelManagement from './pages/ChannelManagement';
import AccountSettings from './pages/AccountSettings';
import NavigationGuard from './components/navigation/NavigationGuard';
import NavigationTransition from './components/navigation/NavigationTransition';
import './App.css';
import './styles/layout.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <NavigationGuard>
            <NavigationTransition>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/channels" element={<ChannelManagement />} />
                <Route path="/settings" element={<AccountSettings />} />
              </Routes>
            </NavigationTransition>
          </NavigationGuard>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
