import { useState, useEffect } from 'react';
import api from '../services/api';
import { Award, BookOpen, Clock, AlertCircle } from 'lucide-react';

export default function Grades() {
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [loadingClass, setLoadingClass] = useState(true);
  const [loadingSubs, setLoadingSubs] = useState(false);

  useEffect(() => {
    fetchClassrooms();
  }, []);

  useEffect(() => {
    if (selectedClassroom) {
      fetchSubmissions(selectedClassroom);
    } else {
      setSubmissions([]);
    }
  }, [selectedClassroom]);

  const fetchClassrooms = async () => {
    try {
      const res = await api.get('/api/classrooms/');
      setClassrooms(res.data);
      if (res.data.length > 0) {
        setSelectedClassroom(res.data[0].id);
      }
    } catch (e) {
      console.error('Failed to load classrooms for grade audits:', e);
    } finally {
      setLoadingClass(false);
    }
  };

  const fetchSubmissions = async (classId) => {
    setLoadingSubs(true);
    try {
      const res = await api.get(`/api/lectures/classroom/${classId}/submissions/`);
      setSubmissions(res.data);
    } catch (e) {
      console.error('Failed to fetch class submissions:', e);
    } finally {
      setLoadingSubs(false);
    }
  };

  if (loadingClass) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Student Progress & Grades</h1>
          <p className="text-xs text-slate-400">View graded quiz submissions across classrooms.</p>
        </div>
        
        {/* Classroom selector */}
        {classrooms.length > 0 && (
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-slate-400 font-semibold uppercase">Classroom:</span>
            <select
              value={selectedClassroom}
              onChange={(e) => setSelectedClassroom(e.target.value)}
              className="px-4 py-2 rounded-xl glass-input bg-slate-900 appearance-none text-xs"
            >
              {classrooms.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {classrooms.length === 0 ? (
        <div className="p-8 rounded-3xl glass-card text-center text-slate-500 text-sm">
          No classrooms configured yet. Grade lists will populate when classrooms are created.
        </div>
      ) : loadingSubs ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="w-6 h-6 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="p-8 rounded-3xl glass-card text-center text-slate-500 text-sm border border-white/5">
          No quiz submissions received for this class yet.
        </div>
      ) : (
        <div className="glass-card rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 bg-white/3 font-semibold uppercase text-slate-400 tracking-wider">
                  <th className="p-5">Student</th>
                  <th className="p-5">Lecture Quiz</th>
                  <th className="p-5">Submission Date</th>
                  <th className="p-5 text-right">Score Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300 font-medium">
                {submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-white/2 transition-colors">
                    <td className="p-5">
                      <div>
                        <p className="font-semibold text-slate-200">{sub.student?.username}</p>
                        <span className="text-[10px] text-slate-500">{sub.student?.email}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-indigo-400" />
                        {sub.quiz?.title || 'Lecture Quiz'}
                      </div>
                    </td>
                    <td className="p-5">
                      <span className="flex items-center gap-1.5 text-slate-400 font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(sub.submitted_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-5 text-right font-bold font-mono text-sm">
                      <span className={sub.score >= 80 ? 'text-emerald-400' : sub.score >= 50 ? 'text-indigo-400' : 'text-rose-400'}>
                        {sub.score}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
