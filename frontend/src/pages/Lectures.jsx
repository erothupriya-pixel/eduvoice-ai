import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Volume2, ChevronRight, AudioLines, Clock } from 'lucide-react';

export default function Lectures() {
  const { user } = useAuth();
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLectures();
  }, []);

  const fetchLectures = async () => {
    try {
      const res = await api.get('/api/lectures/');
      setLectures(res.data);
    } catch (e) {
      console.error('Failed to fetch lectures list:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Lectures & Study Materials</h1>
          <p className="text-xs text-slate-400">Review transcription logs, outlines, study flashcards, and complete quizzes.</p>
        </div>
      </div>

      {lectures.length === 0 ? (
        <div className="p-8 rounded-3xl glass-card text-center text-slate-500 text-sm">
          No lectures uploaded yet. {user.role === 'TEACHER' && 'Use the Upload menu to add audio lecture tracks.'}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {lectures.map((lec) => (
            <Link
              key={lec.id}
              to={`/lectures/${lec.id}`}
              className="p-5 rounded-3xl glass-card hover:bg-white/5 border border-white/5 hover:border-indigo-500/30 flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                  <AudioLines className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors leading-snug">
                    {lec.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Uploaded {new Date(lec.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                  lec.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  lec.status === 'FAILED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                  'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse'
                }`}>
                  {lec.status}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
