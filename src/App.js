// src/App.js
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import LandingPage from './LandingPage';
import Workspace from './Workspace';
import DrawingBoard from './DrawingBoard';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return <div className="flex items-center justify-center h-screen text-2xl text-red-600 bg-black">Loading Neura3D...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/workspace" element={user ? <Workspace /> : <Navigate to="/" />} />
        <Route path="/draw" element={user ? <DrawingBoard /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;