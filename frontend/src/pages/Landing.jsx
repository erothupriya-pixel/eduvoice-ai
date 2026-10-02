import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  AudioLines, 
  ArrowRight
} from 'lucide-react';

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200 font-sans justify-between">
      
      {/* 1. Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-[#0b0f19]/80 backdrop-blur-md border-b border-white/5 z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <AudioLines className="w-5 h-5 text-white animate-pulse" />
          </div>
          <span className="font-extrabold text-lg bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">EduVoice AI</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
          <a href="#home" className="hover:text-indigo-400 transition-colors">Home</a>
        </div>

        <div className="flex items-center gap-3">
          {!user && (
            <>
              <Link to="/login" className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition-colors">
                Login
              </Link>
              <Link to="/register" className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 hover:scale-[1.02] transition-all">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section id="home" className="relative pt-40 pb-32 px-6 overflow-hidden flex flex-col justify-center my-auto">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[110px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center flex flex-col items-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Version 2.0 - Active Bilingual Learning</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
            AI-Powered Bilingual Learning<br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent">
              & Student Collaboration
            </span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed">
            EduVoice AI helps engineering students learn academic subjects with AI-powered bilingual explanations, voice tutoring, exam preparation, coding assistance and student collaboration.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link to="/register" className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-xl shadow-indigo-500/25 hover:scale-[1.02] transition-all text-xs flex items-center gap-2">
              Start Learning
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Footer */}
      <footer className="py-8 px-6 bg-[#070b13] text-xs text-slate-500 border-t border-white/5 relative z-10 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AudioLines className="w-4 h-4 text-indigo-500 animate-pulse" />
            <span className="font-extrabold text-xs text-slate-300">EduVoice AI</span>
          </div>
          <p>© 2026 EduVoice AI. All rights reserved. Powered by Google Gemini API.</p>
        </div>
      </footer>

    </div>
  );
}
