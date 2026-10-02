import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  Users, 
  UploadCloud, 
  FileText, 
  BarChart3, 
  Plus, 
  ClipboardList, 
  Trash2,
  Lock,
  ChevronRight,
  Sparkles,
  BookOpen,
  Volume2,
  Megaphone,
  CheckCircle,
  HelpCircle,
  TrendingUp
} from 'lucide-react';

export default function TeacherDashboard() {
  const [classrooms, setClassrooms] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms state
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadType, setUploadType] = useState('PDF'); // 'PDF', 'PPT', 'NOTES'
  const [selectedClassForUpload, setSelectedClassForUpload] = useState('');
  
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [quizTopic, setQuizTopic] = useState('');
  const [quizQuestionsCount, setQuizQuestionsCount] = useState(5);
  const [selectedClassForQuiz, setSelectedClassForQuiz] = useState('');

  const [announcementText, setAnnouncementText] = useState('');
  const [announcements, setAnnouncements] = useState([
    { id: 1, text: "Semester mid-term syllabus uploaded. Practice key concepts.", date: "Today" },
    { id: 2, text: "Hackathon registrations are now open. Form teams in the collaboration tab.", date: "Yesterday" }
  ]);

  const [studentProgress, setStudentProgress] = useState([
    { name: "Anil Kumar", class: "CSE-A", progress: "88%", score: 85 },
    { name: "Bhavana Reddy", class: "CSE-A", progress: "94%", score: 92 },
    { name: "Chaitanya K.", class: "ECE-B", progress: "72%", score: 78 }
  ]);

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const fetchTeacherData = async () => {
    try {
      const [classRes, lecRes] = await Promise.all([
        api.get('/api/classrooms/'),
        api.get('/api/lectures/')
      ]);
      setClassrooms(classRes.data);
      setLectures(lecRes.data);
      if (classRes.data.length > 0) {
        setSelectedClassForUpload(classRes.data[0].id);
        setSelectedClassForQuiz(classRes.data[0].id);
      }
    } catch (e) {
      console.error('Error loading teacher dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadNotes = async (e) => {
    e.preventDefault();
    if (!uploadTitle.trim()) return;

    try {
      // Create a mock lecture object in backend to represent upload
      await api.post('/api/lectures/', {
        title: `${uploadType}: ${uploadTitle}`,
        description: `Uploaded syllabus resource of type ${uploadType}`,
        classroom: selectedClassForUpload || null,
        file_type: uploadType === 'PPT' ? 'PPTX' : 'PDF'
      });
      setUploadTitle('');
      setShowUploadForm(false);
      fetchTeacherData();
    } catch (err) {
      alert('Failed to upload notes.');
    }
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    if (!quizTopic.trim()) return;

    try {
      // Mock triggering quiz generation
      alert(`AI is generating a ${quizQuestionsCount}-question quiz for topic: ${quizTopic}...`);
      setShowQuizForm(false);
      setQuizTopic('');
    } catch (err) {
      alert('Failed to trigger quiz generation.');
    }
  };

  const handlePostAnnouncement = (e) => {
    e.preventDefault();
    if (!announcementText.trim()) return;

    setAnnouncements(prev => [
      { id: Date.now(), text: announcementText, date: "Just now" },
      ...prev
    ]);
    setAnnouncementText('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Teacher Dashboard</h1>
          <p className="text-xs text-slate-400">Upload notes, generate custom quizzes, and track classroom progress.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="px-4 py-2.5 text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Notes / Slides
          </button>
          <button
            onClick={() => setShowQuizForm(!showQuizForm)}
            className="px-4 py-2.5 text-xs font-semibold glass-card border border-white/10 hover:bg-white/5 text-slate-200 rounded-xl flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-purple-400" />
            Create Quiz
          </button>
        </div>
      </div>

      {/* Action Drawer: Upload Notes */}
      {showUploadForm && (
        <div className="glass-card p-6 rounded-2xl border border-indigo-500/25 bg-slate-900/30">
          <h3 className="font-bold text-slate-100 mb-4 flex items-center gap-2 text-sm">
            <UploadCloud className="w-5 h-5 text-indigo-400" />
            Upload Syllabus Material (Notes / PDF / PPT)
          </h3>
          <form onSubmit={handleUploadNotes} className="space-y-4 text-xs font-semibold">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-400 uppercase tracking-wider mb-2">Title / Subject Chapter</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="E.g. Relational Schema Design"
                  className="w-full px-4 py-2.5 rounded-xl glass-input"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 uppercase tracking-wider mb-2">Material Type</label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl glass-input bg-slate-900"
                >
                  <option value="PDF">PDF Document</option>
                  <option value="PPT">PowerPoint Slides (PPTX)</option>
                  <option value="NOTES">Handwritten Notes</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 uppercase tracking-wider mb-2">Select Classroom Destination</label>
                <select
                  value={selectedClassForUpload}
                  onChange={(e) => setSelectedClassForUpload(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl glass-input bg-slate-900"
                >
                  {classrooms.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowUploadForm(false)} className="px-4 py-2 text-slate-400">Cancel</button>
              <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl cursor-pointer">Start Parsing</button>
            </div>
          </form>
        </div>
      )}

      {/* Action Drawer: Create Quiz */}
      {showQuizForm && (
        <div className="glass-card p-6 rounded-2xl border border-purple-500/25 bg-slate-900/30">
          <h3 className="font-bold text-slate-100 mb-4 flex items-center gap-2 text-sm">
            <HelpCircle className="w-5 h-5 text-purple-400 animate-pulse" />
            AI-Driven Quiz Generator
          </h3>
          <form onSubmit={handleCreateQuiz} className="space-y-4 text-xs font-semibold">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-400 uppercase tracking-wider mb-2">Topic or Lecture Chapter</label>
                <input
                  type="text"
                  value={quizTopic}
                  onChange={(e) => setQuizTopic(e.target.value)}
                  placeholder="E.g. Lexical Analysis"
                  className="w-full px-4 py-2.5 rounded-xl glass-input"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 uppercase tracking-wider mb-2">Questions Count</label>
                <input
                  type="number"
                  value={quizQuestionsCount}
                  onChange={(e) => setQuizQuestionsCount(e.target.value)}
                  min="3"
                  max="15"
                  className="w-full px-4 py-2.5 rounded-xl glass-input"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 uppercase tracking-wider mb-2">Target Course</label>
                <select
                  value={selectedClassForQuiz}
                  onChange={(e) => setSelectedClassForQuiz(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl glass-input bg-slate-900"
                >
                  {classrooms.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowQuizForm(false)} className="px-4 py-2 text-slate-400">Cancel</button>
              <button type="submit" className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl cursor-pointer">Generate Quiz Questions</button>
            </div>
          </form>
        </div>
      )}

      {/* Analytics Stats */}
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-semibold block uppercase">Total Students</span>
            <span className="text-lg font-bold text-slate-200">
              {classrooms.reduce((sum, cls) => sum + (cls.student_count || 0), 0)}
            </span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-semibold block uppercase">Parsed Material</span>
            <span className="text-lg font-bold text-slate-200">{lectures.length} files</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-semibold block uppercase">Avg Quiz Grade</span>
            <span className="text-lg font-bold text-slate-200">84.5%</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-semibold block uppercase">Syllabus Covered</span>
            <span className="text-lg font-bold text-slate-200">76% Completed</span>
          </div>
        </div>
      </div>

      {/* Grid: announcements, student progress, analytics */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Span (2 Columns): Student progress & recent files */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Student Progress */}
          <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="font-bold text-slate-100 flex items-center gap-2 text-sm">
              <TrendingUp className="w-4.5 h-4.5 text-indigo-400" />
              Syllabus Study Progress (Grades Audit)
            </h3>
            <div className="space-y-3">
              {studentProgress.map((std, idx) => (
                <div key={idx} className="p-4 bg-slate-900/50 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-slate-200">{std.name}</p>
                    <span className="text-[10px] text-slate-500">Course Room: {std.class}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-indigo-400 block">{std.progress} syllabus</span>
                    <span className="text-[9px] text-slate-500 font-mono">Quiz Score: {std.score}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Classroom Outlines */}
          <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="font-bold text-slate-100 flex items-center gap-2 text-sm">
              <ClipboardList className="w-4.5 h-4.5 text-indigo-400" />
              Recent Lecture Modules
            </h3>
            {lectures.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No parsed files listed.</p>
            ) : (
              <div className="space-y-3">
                {lectures.slice(0, 4).map(l => (
                  <div key={l.id} className="p-4 bg-slate-900/60 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-200">{l.title}</p>
                      <span className="text-[10px] text-slate-500">Class: {l.classroom_detail?.name || 'Personal Study'}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{new Date(l.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Span (1 Column): announcements */}
        <div className="space-y-6">
          
          {/* Announcements post area */}
          <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="font-bold text-slate-100 flex items-center gap-2 text-sm">
              <Megaphone className="w-4.5 h-4.5 text-purple-400" />
              Make Announcements
            </h3>
            
            <form onSubmit={handlePostAnnouncement} className="space-y-3">
              <textarea
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="Broadcast information to all classes..."
                className="w-full px-3 py-2.5 rounded-xl text-xs glass-input h-20 resize-none font-semibold"
              />
              <button
                type="submit"
                disabled={!announcementText.trim()}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Post Bulletin
              </button>
            </form>

            <div className="space-y-3 pt-3 border-t border-white/5">
              {announcements.map(ann => (
                <div key={ann.id} className="p-3 bg-white/3 rounded-xl border border-white/5 text-[11px] space-y-1">
                  <p className="text-slate-300 font-medium leading-relaxed">"{ann.text}"</p>
                  <span className="text-[9px] text-slate-500 font-mono block text-right">{ann.date}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
