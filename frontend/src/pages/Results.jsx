import { useState, useEffect } from 'react';
import api from '../services/api';
import { Award, BookOpen, Clock, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Results() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const res = await api.get('/api/lectures/submissions/my/');
      setSubmissions(res.data);
    } catch (e) {
      console.error('Failed to load student results:', e);
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

  const totalAttempted = submissions.length;
  const averageScore = totalAttempted > 0
    ? Math.round(submissions.reduce((acc, sub) => acc + sub.score, 0) / totalAttempted)
    : 0;
  const bestScore = totalAttempted > 0
    ? Math.round(Math.max(...submissions.map(sub => sub.score)))
    : 0;
  const quizzesPassed = submissions.filter(sub => sub.score >= 50).length;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">My Scores & Quiz Submissions</h1>
        <p className="text-xs text-slate-400 font-semibold mt-1">Review your grades, incorrect questions, and master terminology over time.</p>
      </div>

      {submissions.length === 0 ? (
        <div className="p-8 rounded-3xl glass-card text-center text-slate-500 text-xs font-bold font-mono">
          No quiz attempts yet.
        </div>
      ) : (
        <div className="space-y-8">
          {/* Quiz Score Summary Panel */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Quizzes Attempted</span>
              <span className="text-xl font-extrabold text-white font-mono">{totalAttempted}</span>
            </div>
            <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Average Score</span>
              <span className="text-xl font-extrabold text-indigo-400 font-mono">{averageScore}%</span>
            </div>
            <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Best Score</span>
              <span className="text-xl font-extrabold text-emerald-450 font-mono">{bestScore}%</span>
            </div>
            <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Quizzes Passed</span>
              <span className="text-xl font-extrabold text-purple-400 font-mono">{quizzesPassed}</span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Recent Quiz Results</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-6 rounded-3xl glass-card border border-white/5 flex items-center justify-between gap-6 hover:border-indigo-500/20 transition-all"
                >
                  <div className="space-y-3 min-w-0">
                    <span className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                      <BookOpen className="w-4.5 h-4.5" />
                    </span>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-slate-200 truncate leading-snug">{sub.quiz?.title || 'Lecture Quiz'}</h4>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-1 font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        Completed {new Date(sub.submitted_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className={`text-2xl font-extrabold font-mono block ${
                        sub.score >= 80 ? 'text-emerald-450' : sub.score >= 50 ? 'text-indigo-400' : 'text-rose-400'
                      }`}>
                        {sub.score}%
                      </span>
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Grade</span>
                    </div>
                    
                    {sub.quiz?.lecture ? (
                      <Link
                        to={`/lectures/${sub.quiz.lecture}`}
                        className="p-2 bg-white/5 hover:bg-indigo-600/10 text-slate-400 hover:text-indigo-400 rounded-xl transition-all"
                        title="View material context"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    ) : (
                      <Link
                        to="/student/documents"
                        className="p-2 bg-white/5 hover:bg-indigo-600/10 text-slate-400 hover:text-indigo-400 rounded-xl transition-all"
                        title="View documents workspace"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
