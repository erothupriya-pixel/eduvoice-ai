import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, GraduationCap, AudioLines, User } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="glass-nav fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-50">
      <Link to="/" className="flex items-center gap-3 group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
          <AudioLines className="w-5 h-5 text-white animate-pulse" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-lg leading-none bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent tracking-tight">
            EduVoice AI
          </span>
          <span className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase mt-0.5">
            Voice-First Learning
          </span>
        </div>
      </Link>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold text-slate-200">{user.username}</span>
              <span className="text-xs text-indigo-400 capitalize">{user.role.toLowerCase()}</span>
            </div>
            
            <div className="w-10 h-10 rounded-full bg-indigo-950/50 border border-indigo-500/20 flex items-center justify-center text-indigo-300">
              <User className="w-5 h-5" />
            </div>

            <button
              onClick={logout}
              className="p-2.5 rounded-xl border border-rose-500/20 hover:bg-rose-500/10 text-rose-400 transition-all duration-300 group"
              title="Logout"
            >
              <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:scale-[1.02]"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
