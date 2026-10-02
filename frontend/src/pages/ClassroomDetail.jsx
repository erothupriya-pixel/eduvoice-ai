import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Users, Volume2, Plus, ArrowLeft, ChevronRight, ClipboardList } from 'lucide-react';

export default function ClassroomDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [classroom, setClassroom] = useState(null);
  const [students, setStudents] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClassroomData();
  }, [id]);

  const fetchClassroomData = async () => {
    try {
      const classRes = await api.get(`/api/classrooms/${id}/`);
      setClassroom(classRes.data);

      if (user.role === 'TEACHER') {
        const studentsRes = await api.get(`/api/classrooms/${id}/students/`);
        setStudents(studentsRes.data);
      }

      const lecturesRes = await api.get('/api/lectures/');
      const filtered = lecturesRes.data.filter(l => l.classroom === id);
      setLectures(filtered);
    } catch (e) {
      console.error('Failed to load classroom details:', e);
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

  if (!classroom) {
    return (
      <div className="p-6 glass-card rounded-2xl border border-rose-500/20 text-rose-400">
        Classroom not found.
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Back button */}
      <div>
        <Link to="/classrooms" className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300">
          <ArrowLeft className="w-4 h-4" />
          Back to Classrooms
        </Link>
      </div>

      {/* Classroom Banner */}
      <div className="p-8 rounded-3xl glass-card relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-[50px] pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 relative z-10">
          <div>
            <h1 className="text-2xl font-extrabold text-white">{classroom.name}</h1>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-xl">{classroom.description || 'No description added yet.'}</p>
          </div>
          
          <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
            <span className="text-xs text-slate-500">Instructor: <span className="font-semibold text-slate-300">{classroom.teacher?.username}</span></span>
            {user.role === 'TEACHER' && (
              <span className="text-xs text-slate-500">Invite Code: <span className="font-mono text-indigo-400 font-bold bg-indigo-950/40 border border-indigo-500/10 px-2 py-0.5 rounded-lg select-all">{classroom.invite_code}</span></span>
            )}
          </div>
        </div>
      </div>

      {/* Classroom Content Grid */}
      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Classroom Lectures */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-indigo-400" />
              Lectures & Material
            </h2>
            {user.role === 'TEACHER' && (
              <Link
                to="/upload"
                state={{ classroomId: classroom.id }}
                className="px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Upload Lecture
              </Link>
            )}
          </div>

          {lectures.length === 0 ? (
            <div className="p-8 rounded-2xl glass-card text-center text-slate-500 text-sm">
              No lectures uploaded for this classroom yet.
            </div>
          ) : (
            <div className="space-y-3">
              {lectures.map((lec) => (
                <Link
                  key={lec.id}
                  to={`/lectures/${lec.id}`}
                  className="p-4 rounded-2xl glass-card hover:bg-white/5 flex items-center justify-between transition-colors group"
                >
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors">
                      {lec.title}
                    </h4>
                    <span className="text-[10px] text-slate-500">Uploaded {new Date(lec.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      lec.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      lec.status === 'FAILED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
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

        {/* Right Col: Classroom Students (Teachers only) */}
        {user.role === 'TEACHER' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              Enrolled Students
            </h2>

            {students.length === 0 ? (
              <div className="p-6 rounded-2xl glass-card text-center text-slate-500 text-xs">
                No students enrolled yet. Share the invite code to register students.
              </div>
            ) : (
              <div className="space-y-3">
                {students.map((enrollment) => (
                  <div key={enrollment.id} className="p-4 rounded-2xl glass-card flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-200">{enrollment.student?.username}</p>
                      <span className="text-[10px] text-slate-500">{enrollment.student?.email}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">Joined {new Date(enrollment.enrolled_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
