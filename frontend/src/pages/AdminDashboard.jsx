import { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Database, 
  Cpu, 
  Activity, 
  AlertCircle, 
  CheckCircle,
  Clock,
  Users,
  BookOpen,
  FileText,
  UserX,
  Trash2,
  Lock,
  Plus
} from 'lucide-react';
import api from '../services/api';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics', 'users', 'moderation'
  const [systemLogs, setSystemLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock Admin state
  const [stats, setStats] = useState({
    students: 142,
    teachers: 15,
    courses: 8,
    reports: 3
  });

  const [usersList, setUsersList] = useState([
    { id: 1, name: "Amit Patel", email: "amit.p@jntu.edu", role: "STUDENT", status: "ACTIVE" },
    { id: 2, name: "Bhavana V.", email: "bhavana.v@jntu.edu", role: "STUDENT", status: "ACTIVE" },
    { id: 3, name: "Dr. K. Raghavan", email: "k.raghavan@jntu.edu", role: "TEACHER", status: "ACTIVE" },
    { id: 4, name: "Suresh Chandra", email: "suresh.c@jntu.edu", role: "STUDENT", status: "SUSPENDED" }
  ]);

  const [moderationQueue, setModerationQueue] = useState([
    { id: 1, type: "DOC", title: "CS-102 Key-Answers leaked", uploader: "Suresh Chandra", reason: "Copyright policy flag" },
    { id: 2, type: "CHAT", title: "Unprofessional chat log", uploader: "Anonymous", reason: "Harassment pattern alert" }
  ]);

  useEffect(() => {
    // Generate mock system monitoring updates to mimic server status logs
    const mockLogs = [
      { id: 1, action: "Gemini API Request", details: "Completed 200 OK - Transcription generation", time: "1 mins ago", type: "success" },
      { id: 2, action: "Database Migration Check", details: "PostgreSQL status check - Connected 12 active pools", time: "15 mins ago", type: "success" },
      { id: 3, action: "User JWT Refresh Rotation", details: "Refreshed access token for active session ID 2", time: "32 mins ago", type: "info" },
      { id: 4, action: "Rate Limiter Warning", details: "Client IP 127.0.0.1 nearing rate cap on /tutor/ session requests", time: "1 hour ago", type: "warning" },
      { id: 5, action: "Audio Transcriber Thread", details: "Finished background worker task-100", time: "2 hours ago", type: "success" }
    ];
    setSystemLogs(mockLogs);
    setLoading(false);
  }, []);

  const handleToggleUserStatus = (id) => {
    setUsersList(prev => prev.map(u => {
      if (u.id === id) {
        return { ...u, status: u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' };
      }
      return u;
    }));
  };

  const handleResolveModeration = (id, action) => {
    alert(`Content action resolved: ${action} for report ID ${id}`);
    setModerationQueue(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">System Admin Control Center</h1>
        <p className="text-xs text-slate-400">Manage students, teachers, active course registries, content auditing, and model logs.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 gap-2">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-4 px-4 font-semibold text-sm transition-all relative ${
            activeTab === 'analytics' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            System Analytics
          </span>
          {activeTab === 'analytics' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-4 px-4 font-semibold text-sm transition-all relative ${
            activeTab === 'users' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            User Management ({usersList.length})
          </span>
          {activeTab === 'users' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
        </button>

        <button
          onClick={() => setActiveTab('moderation')}
          className={`pb-4 px-4 font-semibold text-sm transition-all relative ${
            activeTab === 'moderation' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            Content Moderation ({moderationQueue.length})
          </span>
          {activeTab === 'moderation' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
        </button>
      </div>

      {/* Grid Stats */}
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-semibold block uppercase">Total Students</span>
            <span className="text-lg font-bold text-slate-200">{stats.students}</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-semibold block uppercase">Total Teachers</span>
            <span className="text-lg font-bold text-slate-200">{stats.teachers}</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-semibold block uppercase">Active Courses</span>
            <span className="text-lg font-bold text-slate-200">{stats.courses}</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 shrink-0">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-semibold block uppercase">Active Flags</span>
            <span className="text-lg font-bold text-slate-200">{stats.reports} reports</span>
          </div>
        </div>
      </div>

      {/* TAB 1: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="grid lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-slate-100 flex items-center gap-2 text-sm">
              <Activity className="w-5 h-5 text-indigo-400" />
              Real-Time Server Load Monitoring
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-900/60 rounded-xl border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Gemini API Latency</span>
                <p className="text-base font-bold text-slate-300">0.85s average</p>
              </div>
              <div className="p-4 bg-slate-900/60 rounded-xl border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-mono block">CPU Usage</span>
                <p className="text-base font-bold text-slate-300">22%</p>
              </div>
            </div>

            {/* Audit Logs */}
            <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4 mt-6">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <FileText className="w-4.5 h-4.5 text-indigo-400" />
                API Request Logs
              </h3>

              <div className="space-y-3">
                {systemLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-slate-950/20 text-xs">
                    {log.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
                    {log.type === 'info' && <Clock className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />}
                    {log.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-slate-200">{log.action}</span>
                        <span className="text-[10px] text-slate-500 font-medium">{log.time}</span>
                      </div>
                      <p className="text-slate-400 leading-relaxed font-mono">{log.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div className="space-y-6">
            <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
              <h3 className="font-bold text-slate-100 text-sm">System Connection</h3>
              <ul className="space-y-3 text-xs text-slate-300 font-semibold">
                <li className="flex justify-between items-center">
                  <span>PostgreSQL Pool</span>
                  <span className="text-emerald-400 font-mono">Connected</span>
                </li>
                <li className="flex justify-between items-center">
                  <span>Firebase Storage Bucket</span>
                  <span className="text-emerald-400 font-mono">Connected</span>
                </li>
                <li className="flex justify-between items-center">
                  <span>Gemini Model Node</span>
                  <span className="text-indigo-400 font-mono">gemini-1.5-flash</span>
                </li>
              </ul>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
          <h3 className="font-bold text-slate-100 text-sm">Active User Registry</h3>
          <div className="space-y-3">
            {usersList.map((usr) => (
              <div key={usr.id} className="p-4 bg-slate-900/60 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">{usr.name}</span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${usr.role === 'TEACHER' ? 'bg-purple-500/10 text-purple-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                      {usr.role}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 font-mono">{usr.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold uppercase ${usr.status === 'ACTIVE' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {usr.status}
                  </span>
                  <button
                    onClick={() => handleToggleUserStatus(usr.id)}
                    className="p-1.5 rounded hover:bg-white/5 text-slate-400 hover:text-slate-200"
                    title={usr.status === 'ACTIVE' ? 'Suspend User' : 'Activate User'}
                  >
                    <UserX className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CONTENT MODERATION */}
      {activeTab === 'moderation' && (
        <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
          <h3 className="font-bold text-slate-100 text-sm">Flagged Content Queue</h3>
          {moderationQueue.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">Moderation queue cleared. No active flags.</p>
          ) : (
            <div className="space-y-3">
              {moderationQueue.map((item) => (
                <div key={item.id} className="p-4 bg-slate-900/60 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{item.title}</span>
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400">
                        {item.type}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Uploader: {item.uploader} • Reason: <span className="text-rose-400 font-bold">{item.reason}</span></p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResolveModeration(item.id, 'DELETE')}
                      className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-semibold cursor-pointer"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => handleResolveModeration(item.id, 'DISMISS')}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-semibold cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
