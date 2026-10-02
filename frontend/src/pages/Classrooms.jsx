import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Users, Plus, ChevronRight } from 'lucide-react';

export default function Classrooms() {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      const res = await api.get('/api/classrooms/');
      setClassrooms(res.data);
    } catch (e) {
      console.error('Failed to fetch classrooms list:', e);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            {user.role === 'TEACHER' ? 'Manage Classes' : 'My Classrooms'}
          </h1>
          <p className="text-xs text-slate-400">
            {user.role === 'TEACHER' ? 'Oversee lectures, invite codes, and student enrollment records.' : 'Access lectures and coursework assigned by your instructors.'}
          </p>
        </div>
      </div>

      {classrooms.length === 0 ? (
        <div className="p-8 rounded-3xl glass-card text-center text-slate-500 text-sm">
          No classrooms configured yet. Join or create one from the main dashboard.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {classrooms.map((cls) => (
            <Link
              key={cls.id}
              to={`/classrooms/${cls.id}`}
              className="p-6 rounded-3xl glass-card hover:border-indigo-500/30 hover:scale-[1.01] transition-all flex flex-col justify-between h-48 group"
            >
              <div>
                <span className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 shrink-0">
                  <BookOpen className="w-4.5 h-4.5" />
                </span>
                <h4 className="font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors leading-snug">
                  {cls.name}
                </h4>
                <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{cls.description || 'No description added.'}</p>
              </div>

              <div className="flex items-center justify-between mt-6 text-xs text-slate-500 font-semibold border-t border-white/5 pt-3">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  {cls.student_count} Enrolled
                </span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
