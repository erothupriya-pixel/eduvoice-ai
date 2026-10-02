import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  ChevronRight, 
  AudioLines, 
  Clock, 
  Sparkles, 
  Send,
  MessageSquare,
  Users,
  Compass,
  FileText,
  TrendingUp,
  Brain,
  Code
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  
  const [lectures, setLectures] = useState([]);
  const [collabRequests, setCollabRequests] = useState([]);
  const [skillsInput, setSkillsInput] = useState('');
  const [savingSkills, setSavingSkills] = useState(false);
  const [userSkills, setUserSkills] = useState(user?.skills || []);
  const [loading, setLoading] = useState(true);

  // Quick Chat Assistant state
  const [chatInput, setChatInput] = useState('');
  const [chatAnswer, setChatAnswer] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    fetchDashboardDetails();
  }, []);

  const fetchDashboardDetails = async () => {
    try {
      const [lecRes, collabRes] = await Promise.all([
        api.get('/api/lectures/'),
        api.get('/api/collaboration/requests/')
      ]);
      setLectures(lecRes.data.slice(0, 4));
      setCollabRequests(collabRes.data.slice(0, 3));
    } catch (e) {
      console.error('Failed to load student dashboard info:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSkills = async (e) => {
    e.preventDefault();
    if (!skillsInput.trim()) return;
    
    setSavingSkills(true);
    const newSkills = skillsInput.split(',').map(s => s.trim()).filter(Boolean);
    
    try {
      const res = await api.patch('/api/auth/me/', {
        skills: [...new Set([...userSkills, ...newSkills])]
      });
      setUserSkills(res.data.skills);
      setSkillsInput('');
      // Update local storage user profile skills
      const updatedUser = { ...user, skills: res.data.skills };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (e) {
      console.error('Failed to update skills:', e);
    } finally {
      setSavingSkills(false);
    }
  };

  const handleQuickChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setChatLoading(true);
    setChatAnswer('');
    
    try {
      // Use general Gemini AI view on backend or mock explanation
      const res = await api.post(`/api/lectures/explain/`, {
        text_segment: chatInput,
        language: 'en'
      });
      setChatAnswer(res.data.explanation);
    } catch (err) {
      setChatAnswer('Error connecting to Gemini API. Please review API key in backend .env');
    } finally {
      setChatLoading(false);
    }
  };

  // Mock Recommended Teammates based on matching overlap skills
  const mockRecommendedTeammates = [
    { username: "Ravi Teja", email: "ravi.t@jntu.edu", skills: ["React", "Tailwind", "Python"], score: 95 },
    { username: "Swapna G.", email: "swapna.g@jntu.edu", skills: ["Python", "FastAPI", "Pandas"], score: 78 },
    { username: "Nikhil K.", email: "nikhil.k@jntu.edu", skills: ["Figma", "React", "CSS"], score: 62 }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* Welcome Banner */}
      <div className="relative p-8 rounded-3xl glass-card overflow-hidden border border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[60px] pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
            Welcome back, {user.username}!
          </h1>
          <p className="text-slate-400 text-xs max-w-xl leading-relaxed">
            Ready to tackle your engineering syllabus? Upload slides, start real-time chat with the AI Voice Teacher, or collaborate with teammates.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Left Column (2 Span): Progress, Documents, AI assistant */}
        <div className="md:col-span-2 space-y-8">
          
          {/* Learning Progress Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="glass-card p-5 rounded-2xl border border-white/5">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Study Hours</span>
              <span className="text-xl font-extrabold text-white flex items-center gap-1.5">
                12.5 hrs <TrendingUp className="w-4 h-4 text-emerald-400" />
              </span>
            </div>
            <div className="glass-card p-5 rounded-2xl border border-white/5">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Documents Parsed</span>
              <span className="text-xl font-extrabold text-indigo-400">{lectures.length}</span>
            </div>
            <div className="glass-card p-5 rounded-2xl border border-white/5 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Skills Profile</span>
              <span className="text-xl font-extrabold text-purple-400">{userSkills.length} tags</span>
            </div>
          </div>

          {/* Recent Documents */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-4.5 h-4.5 text-indigo-400" />
                Recent Documents
              </h2>
              <Link to="/lectures" className="text-xs text-indigo-400 hover:underline">View All</Link>
            </div>

            {lectures.length === 0 ? (
              <div className="p-8 rounded-2xl glass-card text-center text-slate-500 text-xs">
                No documents uploaded yet. Start by uploading slide notes or lecture tracks.
              </div>
            ) : (
              <div className="space-y-3">
                {lectures.map((lec) => (
                  <Link
                    key={lec.id}
                    to={`/lectures/${lec.id}`}
                    className="p-4 rounded-2xl glass-card hover:bg-white/5 flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                        <AudioLines className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-200 group-hover:text-purple-300 transition-colors">
                          {lec.title}
                        </h4>
                        <span className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                          <Clock className="w-3 h-3" />
                          {new Date(lec.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick AI Assistant Card */}
          <div className="glass-card p-6 rounded-3xl border border-white/10 relative overflow-hidden bg-slate-900/30">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[40px] pointer-events-none" />
            <h3 className="font-bold text-slate-200 text-sm mb-2 flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-indigo-400" />
              Quick AI Concept Assistant
            </h3>
            <p className="text-[10px] text-slate-400 mb-4">Type any word, formula, or concept below to get an instant explanation.</p>

            <form onSubmit={handleQuickChat} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="E.g. What is polymorphism in OOP?"
                className="flex-1 px-4 py-2.5 rounded-xl text-xs glass-input"
                disabled={chatLoading}
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            {chatLoading && (
              <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-4 justify-center">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                <span>Gemini is processing...</span>
              </div>
            )}

            {chatAnswer && (
              <div className="mt-4 p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-xs leading-relaxed text-slate-300">
                <span className="font-bold block mb-1 text-indigo-400">AI Response:</span>
                <p className="whitespace-pre-line">{chatAnswer}</p>
              </div>
            )}
          </div>

        </div>

        {/* Right Column (1 Span): Actions, study planner, teammates */}
        <div className="space-y-8">
          
          {/* Quick Actions */}
          <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-3 flex flex-col">
            <h3 className="font-bold text-slate-200 text-sm mb-1">Quick Actions</h3>
            
            <Link
              to="/upload"
              className="py-2.5 px-4 rounded-xl border border-white/5 bg-white/3 hover:bg-white/5 text-xs font-semibold text-slate-300 flex items-center justify-between"
            >
              <span>Upload Document (PDF/PPT)</span>
              <Plus className="w-4 h-4 text-slate-500" />
            </Link>
            
            <Link
              to="/voice-tutor"
              className="py-2.5 px-4 rounded-xl border border-white/5 bg-white/3 hover:bg-white/5 text-xs font-semibold text-slate-300 flex items-center justify-between"
            >
              <span>Start Voice Teacher Lesson</span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </Link>
          </div>

          {/* Study Planner / Skills configuration */}
          <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="font-bold text-slate-200 text-sm">Add Portfolio Skills</h3>
            <p className="text-[10px] text-slate-400 leading-relaxed">List technical skills (comma separated) to unlock matching team recommendation rankings.</p>
            
            <div className="flex flex-wrap gap-1.5">
              {userSkills.map((sk, idx) => (
                <span key={idx} className="text-[10px] font-semibold bg-white/5 px-2 py-0.5 rounded-lg border border-white/5 text-indigo-400">
                  {sk}
                </span>
              ))}
            </div>

            <form onSubmit={handleUpdateSkills} className="flex gap-2">
              <input
                type="text"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                placeholder="E.g. CSS, SQL"
                className="flex-1 px-3 py-2 rounded-xl text-xs glass-input"
                disabled={savingSkills}
              />
              <button
                type="submit"
                disabled={savingSkills || !skillsInput.trim()}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Add
              </button>
            </form>
          </div>

          {/* Recommended Teammates */}
          <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-indigo-400" />
              Recommended Teammates
            </h3>
            
            <div className="space-y-3">
              {mockRecommendedTeammates.map((mate, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs border-b border-white/5 pb-2.5 last:border-0 last:pb-0">
                  <div>
                    <p className="font-bold text-slate-200">{mate.username}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {mate.skills.map((sk, sIdx) => (
                        <span key={sIdx} className="text-[8px] px-1 bg-white/3 text-slate-400 rounded">{sk}</span>
                      ))}
                    </div>
                  </div>
                  <span className="font-bold text-indigo-400 font-mono shrink-0">{mate.score}%</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
