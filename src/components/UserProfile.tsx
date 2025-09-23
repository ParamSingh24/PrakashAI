import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Icon } from './UI/Icon';

const UserProfile: React.FC = () => {
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out');
    }
  };

  return (
    <div className="glass border-b border-dark-surface/30 backdrop-blur-lg shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            {currentUser?.photoURL ? (
              <div className="relative">
                <img
                  src={currentUser.photoURL}
                  alt="Profile"
                  className="h-12 w-12 rounded-xl border-2 border-primary/30 shadow-lg"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl blur-sm -z-10"></div>
              </div>
            ) : (
              <div className="relative">
                <div className="h-12 w-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg glow-effect">
                  <span className="text-white text-sm font-accent serif-optimized">PAI</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-xl blur-md -z-10"></div>
              </div>
            )}
            <div>
              <h1 className="text-xl font-heading text-dark-text serif-optimized text-shadow">
                Welcome, {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
              </h1>
              <p className="text-sm text-dark-textSecondary font-body serif-optimized">
                PrakashAI Platform
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {currentUser?.email && (
              <div className="hidden md:flex items-center space-x-2 px-3 py-2 rounded-xl bg-dark-surface/20 border border-dark-surface/30 backdrop-blur-sm">
                <Icon name="user" size={16} className="text-dark-textSecondary" />
                <span className="text-sm text-dark-textSecondary font-body serif-optimized">
                  {currentUser.email}
                </span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-accent rounded-xl text-white bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 transition-all duration-300 shadow-lg glow-effect serif-optimized"
            >
              <Icon name="log-out" size={16} className="mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;