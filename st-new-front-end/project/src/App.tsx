import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import TradesPage from './pages/TradesPage';
import MatchTradesPage from './pages/MatchTradesPage';
import ReportsPage from './pages/ReportsPage';
import RegisterPage from './pages/RegisterPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/trades" element={<TradesPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/match-trades" element={<MatchTradesPage />} />
              <Route path="/reports" element={<ReportsPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;