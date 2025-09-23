import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './components/AuthPage';
import UserProfile from './components/UserProfile';
import Navbar from './components/Navigation/Navbar';
import { Dashboard } from './components/Dashboard/Dashboard';
import Appliances from './pages/Appliances';
import Community from './pages/Community';
import Routines from './pages/Routines';
import AIConversation from './pages/AIConversation';
import Simulation from './pages/Simulation';
import VoiceDemo from './pages/VoiceDemo';

import { NotificationProvider } from './contexts/NotificationContext';
import './index.css';

function AppContent() {
  const { currentUser } = useAuth();

  console.log('🔐 Auth Status:', { currentUser: !!currentUser, uid: currentUser?.uid });

  // Temporary bypass for testing - comment this out when authentication is needed
  const bypassAuth = true;

  if (!currentUser && !bypassAuth) {
    console.log('❌ No user authenticated, showing AuthPage');
    return <AuthPage />;
  }

  console.log('✅ User authenticated (or bypassed), showing main app');
  return (
    <NotificationProvider>
      <div className="App min-h-screen serif-optimized">
        <UserProfile />
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/appliances" element={<Appliances />} />
            <Route path="/community" element={<Community />} />
            <Route path="/routine" element={<Routines />} />
            <Route path="/ai-chat" element={<AIConversation />} />
            <Route path="/simulation" element={<Simulation />} />
            <Route path="/voice-demo" element={<VoiceDemo />} />
          </Routes>
        </main>
      </div>
    </NotificationProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
