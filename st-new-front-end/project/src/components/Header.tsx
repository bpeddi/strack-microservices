import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BarChart3, FileText, GitCompare, LogOut, LogIn } from 'lucide-react';

const Header: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">SimplyTrack</span>
            </Link>
            
            {isAuthenticated && (
              <nav className="ml-10 flex space-x-4">
                <Link to="/trades" className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  <FileText className="h-4 w-4 mr-1" />
                  Trades
                </Link>
                <Link to="/match-trades" className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  <GitCompare className="h-4 w-4 mr-1" />
                  Match Trades
                </Link>
                <Link to="/reports" className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Reports
                </Link>
              </nav>
            )}
          </div>
          
          <div className="flex items-center">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <LogIn className="h-4 w-4 mr-1" />
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header