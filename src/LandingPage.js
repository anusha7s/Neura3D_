// src/LandingPage.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FcGoogle } from 'react-icons/fc';
import { FaApple, FaGithub } from 'react-icons/fa';
import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';

export default function LandingPage() {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const openSignup = () => setShowSignup(true);
  const openLogin = () => setShowLogin(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (showLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigate('/workspace');
    } catch (err) {
      alert(err.message);
    }
  };

  const googleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate('/workspace');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between p-6 bg-black border-b border-gray-800">
        <motion.h1
          className="text-4xl font-black text-transparent bg-gradient-to-r from-red-600 to-red-800 bg-clip-text"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Neura3D
        </motion.h1>
        <div className="space-x-4">
          <button onClick={openLogin} className="px-6 py-2 font-bold text-red-600 transition border-2 border-red-600 rounded-full hover:bg-red-600 hover:text-white">
            Sign In
          </button>
          <button onClick={openSignup} className="px-6 py-2 font-bold text-white transition bg-red-600 rounded-full shadow-lg hover:bg-red-700">
            Get Started
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-20 text-center bg-gradient-to-b from-black to-gray-900">
        <motion.h1
          className="text-6xl font-black md:text-7xl animate-glow"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          Design the Future in 3D
        </motion.h1>
        <motion.p
          className="max-w-3xl mx-auto mt-6 text-xl text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          AI-powered 3D modeling from text or sketch. Fast. Smart. Stunning.
        </motion.p>
        <div className="flex justify-center gap-6 mt-10">
          <motion.button
            onClick={openSignup}
            className="px-10 py-4 text-lg font-bold text-white transition bg-red-600 shadow-lg rounded-xl hover:shadow-red-600/50"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            Start Creating
          </motion.button>
          <motion.button
            className="px-10 py-4 text-lg font-bold text-red-600 transition border-2 border-red-600 rounded-xl hover:bg-red-600 hover:text-white"
            whileHover={{ scale: 1.1 }}
          >
            Watch Demo
          </motion.button>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-12 mt-16">
          {[
            { num: '10x', label: 'Faster' },
            { num: 'AI', label: 'Powered' },
            { num: '100%', label: 'Custom' }
          ].map((stat, i) => (
            <motion.div
              key={i}
              className="text-center"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.2 }}
              whileHover={{ scale: 1.2 }}
            >
              <h3 className="text-5xl font-black text-red-600">{stat.num}</h3>
              <p className="text-gray-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 bg-gray-900">
        <motion.h2
          className="mb-16 text-5xl font-bold text-center text-red-600"
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
        >
          Why Neura3D?
        </motion.h2>
        <div className="grid max-w-6xl grid-cols-1 gap-8 mx-auto md:grid-cols-2 lg:grid-cols-4">
          {[
            { title: 'Sketch to 3D', desc: 'Draw → AI generates 3D model instantly' },
            { title: 'AI Intelligence', desc: 'Smart suggestions & auto-correction' },
            { title: 'Template Library', desc: 'Start with 100+ ready templates' },
            { title: 'Export Ready', desc: 'GLB, STL, OBJ — print or use anywhere' }
          ].map((feat, i) => (
            <motion.div
              key={i}
              className="p-8 transition-all bg-gray-800 border border-gray-700 rounded-2xl hover:border-red-600"
              whileHover={{ y: -15, boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <h3 className="mb-3 text-2xl font-bold text-red-600">{feat.title}</h3>
              <p className="text-gray-400">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Modal */}
      {(showLogin || showSignup) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black bg-opacity-80" onClick={() => { setShowLogin(false); setShowSignup(false); }}>
          <motion.div
            className="w-full max-w-md p-10 bg-gray-900 border border-red-600 shadow-2xl rounded-3xl"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={e => e.stopPropagation()}
          >
            <h2 className="mb-8 text-3xl font-bold text-center text-red-600">
              {showLogin ? 'Welcome Back' : 'Join Neura3D'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full p-4 text-white placeholder-gray-500 transition bg-gray-800 border border-gray-700 rounded-xl focus:border-red-600 focus:outline-none" />
              <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full p-4 text-white placeholder-gray-500 transition bg-gray-800 border border-gray-700 rounded-xl focus:border-red-600 focus:outline-none" />
              <button type="submit" className="w-full py-4 font-bold text-white transition bg-red-600 shadow-lg rounded-xl hover:shadow-red-600/50">
                {showLogin ? 'Sign In' : 'Create Account'}
              </button>
            </form>
            <div className="my-6 text-center text-gray-500">or</div>
            <div className="space-y-3">
              <button onClick={googleSignIn} className="flex items-center justify-center w-full gap-3 p-3 transition bg-gray-800 rounded-xl hover:bg-gray-700">
                <FcGoogle size={24} /> Google
              </button>
              <button className="flex items-center justify-center w-full gap-3 p-3 transition bg-gray-800 rounded-xl hover:bg-gray-700">
                <FaApple size={24} /> Apple
              </button>
              <button className="flex items-center justify-center w-full gap-3 p-3 transition bg-gray-800 rounded-xl hover:bg-gray-700">
                <FaGithub size={24} /> GitHub
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}