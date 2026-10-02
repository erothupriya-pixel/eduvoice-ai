import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, 
  AudioLines, 
  BookOpen, 
  HelpCircle, 
  FileText,
  RotateCw,
  Award,
  AlertTriangle,
  MessageSquare,
  Mic,
  Send,
  Sparkles,
  Bot,
  User,
  X,
  Volume2
} from 'lucide-react';

export default function LectureDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [lecture, setLecture] = useState(null);
  const [flashcardSet, setFlashcardSet] = useState(null);
  const [quiz, setQuiz] = useState(null);
  
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'flashcards', 'quiz'
  const [loading, setLoading] = useState(true);
  const [processStatus, setProcessStatus] = useState('');

  // Flashcards state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizSubmission, setQuizSubmission] = useState(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizError, setQuizError] = useState('');

  // AI Multilingual Explanation State
  const [explanation, setExplanation] = useState('');
  const [explainLanguage, setExplainLanguage] = useState('en');
  const [explainLoading, setExplainLoading] = useState(false);
  const [selectedExplainText, setSelectedExplainText] = useState('');

  // AI Context Chat State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]); // [{role: 'user' | 'model', text: ''}]
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    fetchLectureDetails();
  }, [id]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatLoading]);

  const fetchLectureDetails = async () => {
    setLoading(true);
    try {
      const lecRes = await api.get(`/api/lectures/${id}/`);
      setLecture(lecRes.data);

      if (lecRes.data.status === 'COMPLETED') {
        const [fcRes, quizRes] = await Promise.all([
          api.get(`/api/lectures/${id}/flashcards/`),
          api.get(`/api/lectures/${id}/quiz/`)
        ]);
        setFlashcardSet(fcRes.data);
        setQuiz(quizRes.data);
      }
    } catch (e) {
      console.error('Failed to fetch lecture data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleReprocess = async () => {
    setProcessStatus('Reprocessing requested...');
    try {
      await api.post(`/api/lectures/${id}/process/`);
      setProcessStatus('Background processing triggered.');
      setTimeout(() => {
        fetchLectureDetails();
        setProcessStatus('');
      }, 3000);
    } catch (e) {
      setProcessStatus('Failed to trigger reprocessing.');
    }
  };

  const handleExplain = async (lang) => {
    setExplainLanguage(lang);
    setExplainLoading(true);
    setExplanation('');
    
    // Default to summary text if nothing specifically highlighted
    const textSegment = selectedExplainText || lecture.summary;

    try {
      const res = await api.post(`/api/lectures/${id}/explain/`, {
        text_segment: textSegment,
        language: lang
      });
      setExplanation(res.data.explanation);
    } catch (err) {
      setExplanation('Failed to generate AI explanation.');
    } finally {
      setExplainLoading(false);
    }
  };

  const handleStartVoiceTeacher = async () => {
    try {
      // Create session bound to lecture
      await api.post('/api/tutor/sessions/', {
        topic: `Tutor: ${lecture.title}`,
        lecture: lecture.id
      });
      // Navigate to Voice Tutor
      navigate('/voice-tutor');
    } catch (e) {
      console.error('Failed to start Voice Teacher session:', e);
    }
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { role: 'user', text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    const currentInput = chatInput;
    setChatInput('');
    setChatLoading(true);

    try {
      // Map frontend history array format to backend expectation
      const formattedHistory = chatMessages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        text: m.text
      }));

      const res = await api.post(`/api/lectures/${id}/chat/`, {
        question: currentInput,
        history: formattedHistory
      });

      const aiMsg = { role: 'model', text: res.data.answer };
      setChatMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('Failed to query document assistant:', err);
      setChatMessages(prev => [...prev, { role: 'model', text: 'Error: Failed to fetch response.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleQuizAnswer = (qId, choice) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [qId]: choice
    }));
  };

  const handleQuizSubmit = async (e) => {
    e.preventDefault();
    setQuizError('');
    setQuizSubmission(null);

    const unanswered = quiz.questions.filter(q => !selectedAnswers[q.id]);
    if (unanswered.length > 0) {
      setQuizError(`Please answer all questions before submitting. (${unanswered.length} remaining)`);
      return;
    }

    setSubmittingQuiz(true);
    try {
      const formattedAnswers = Object.entries(selectedAnswers).map(([qId, ans]) => ({
        question_id: qId,
        chosen_answer: ans
      }));

      const res = await api.post('/api/lectures/quizzes/submit/', {
        quiz: quiz.id,
        answers: formattedAnswers
      });
      setQuizSubmission(res.data);
    } catch (err) {
      setQuizError('Failed to submit quiz. Please try again.');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className="p-6 glass-card rounded-2xl border border-rose-500/20 text-rose-400">
        Lecture not found.
      </div>
    );
  }

  const cards = flashcardSet?.cards || [];

  return (
    <div className="relative space-y-8 max-w-5xl mx-auto pb-24">
      {/* Back Link */}
      <div className="flex justify-between items-center">
        <Link to="/student/documents" className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300">
          <ArrowLeft className="w-4 h-4" />
          Back to Documents
        </Link>
        
        {/* Float Controls */}
        <div className="flex gap-2">
          {lecture.status === 'COMPLETED' && (
            <>
              <button
                onClick={handleStartVoiceTeacher}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all duration-300 hover:scale-[1.01]"
              >
                <Mic className="w-3.5 h-3.5" />
                Voice Teacher
              </button>
              <button
                onClick={() => setChatOpen(!chatOpen)}
                className="px-3.5 py-1.5 rounded-xl border border-indigo-500/20 bg-indigo-950/20 text-indigo-400 text-xs flex items-center gap-1.5 transition-colors font-semibold hover:bg-indigo-600/10"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                {chatOpen ? 'Hide Assistant' : 'AI Chat'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Lecture Player & Status Header */}
      <div className="p-6 rounded-3xl glass-card border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-[40px] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
              <AudioLines className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white">{lecture.title}</h1>
              <p className="text-xs text-slate-400 mt-1">
                Format: <span className="font-semibold text-indigo-400">{lecture.file_type}</span> • Uploaded {new Date(lecture.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
              lecture.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
              lecture.status === 'FAILED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
              'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse'
            }`}>
              {lecture.status}
            </span>

            {(user.role === 'TEACHER' || lecture.uploader.id === user.id) && (
              <button
                onClick={handleReprocess}
                className="px-3.5 py-1.5 rounded-xl border border-white/10 hover:bg-white/5 text-xs text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                Reprocess AI
              </button>
            )}
          </div>
        </div>

        {processStatus && <div className="text-xs text-indigo-400 mt-3">{processStatus}</div>}

        {/* Custom Audio Player - Render ONLY for audio lectures */}
        {lecture.file_type === 'AUDIO' && lecture.audio_file && (
          <div className="mt-6 p-4 rounded-2xl border border-white/5 bg-slate-950/40 flex flex-col sm:flex-row items-center gap-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide shrink-0">Lecture Recording</span>
            <audio 
              src={lecture.audio_file} 
              controls 
              className="w-full h-9 rounded-lg"
            />
          </div>
        )}
      </div>

      {lecture.status !== 'COMPLETED' ? (
        <div className="p-8 rounded-3xl glass-card text-center border border-white/10 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <h3 className="font-bold text-slate-200">Gemini is parsing this {lecture.file_type}...</h3>
          <p className="text-xs text-slate-400 max-w-sm">Generating comprehensive summaries and interactive quizzes. Study materials will load automatically when finished.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-4 gap-8 items-start">
          
          {/* Left Columns (Summary & decks) */}
          <div className={`space-y-6 transition-all duration-300 ${chatOpen ? 'md:col-span-3' : 'md:col-span-4'}`}>
            
            {/* Tabs */}
            <div className="flex border-b border-white/5 gap-2">
              <button
                onClick={() => setActiveTab('summary')}
                className={`pb-4 px-4 font-semibold text-sm transition-all relative ${
                  activeTab === 'summary' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Summary & Explanations
                </span>
                {activeTab === 'summary' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
              </button>

              <button
                onClick={() => setActiveTab('flashcards')}
                className={`pb-4 px-4 font-semibold text-sm transition-all relative ${
                  activeTab === 'flashcards' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Flashcards ({cards.length})
                </span>
                {activeTab === 'flashcards' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
              </button>

              <button
                onClick={() => setActiveTab('quiz')}
                className={`pb-4 px-4 font-semibold text-sm transition-all relative ${
                  activeTab === 'quiz' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  Interactive Quiz
                </span>
                {activeTab === 'quiz' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
              </button>
            </div>

            {/* TAB 1: SUMMARY */}
            {activeTab === 'summary' && (
              <div className="grid md:grid-cols-3 gap-8">
                
                {/* Notes and Highlight Explain trigger */}
                <div className="md:col-span-2 space-y-6">
                  <div className="glass-card p-6 rounded-3xl border border-white/10">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-base text-slate-100">Study Guide Summary</h3>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Highlight text to explain specific lines</span>
                    </div>
                    
                    <div 
                      onMouseUp={() => {
                        const sel = window.getSelection().toString().trim();
                        if (sel.length > 5) {
                          setSelectedExplainText(sel);
                        }
                      }}
                      className="text-sm text-slate-300 leading-relaxed space-y-4 whitespace-pre-line select-text"
                    >
                      {lecture.summary || 'Summary is unavailable.'}
                    </div>
                  </div>

                  {/* English/Telugu explanation card */}
                  <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-200 text-sm">Explain Section (English / తెలుగు)</h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleExplain('en')}
                          disabled={explainLoading}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                        >
                          English Explanation
                        </button>
                        <button
                          onClick={() => handleExplain('te')}
                          disabled={explainLoading}
                          className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                        >
                          తెలుగు వివరణ (Telugu)
                        </button>
                      </div>
                    </div>

                    {selectedExplainText && (
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-slate-400">
                        <span className="font-semibold block mb-1">Selected Passage:</span>
                        "{selectedExplainText}"
                        <button 
                          onClick={() => setSelectedExplainText('')}
                          className="text-[10px] text-indigo-400 hover:underline block mt-2"
                        >
                          Reset selection (Explains whole summary)
                        </button>
                      </div>
                    )}

                    {explainLoading ? (
                      <div className="flex items-center gap-2 text-xs text-slate-500 py-4 justify-center">
                        <span className="w-4 h-4 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                        <span>Composing AI response...</span>
                      </div>
                    ) : explanation ? (
                      <div className={`p-4 rounded-2xl border ${explainLanguage === 'te' ? 'border-purple-500/20 bg-purple-500/5' : 'border-indigo-500/20 bg-indigo-500/5'} text-sm leading-relaxed text-slate-200`}>
                        <span className="font-bold text-xs text-indigo-400 block mb-2">
                          {explainLanguage === 'te' ? 'AI తెలుగు వివరణ' : 'AI Explanation'}
                        </span>
                        <p className="whitespace-pre-line">{explanation}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 py-2">Select a sentence above or click explanation directly to master vocabulary in English or Telugu.</p>
                    )}
                  </div>
                </div>

                {/* Keywords & Raw Text details */}
                <div className="space-y-6">
                  <div className="glass-card p-6 rounded-3xl border border-white/10">
                    <h4 className="font-bold text-slate-200 mb-3.5">Keywords & Topics</h4>
                    <div className="flex flex-wrap gap-2">
                      {lecture.keywords?.map((tag, idx) => (
                        <span 
                          key={idx}
                          className="text-xs px-2.5 py-1 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 font-semibold"
                        >
                          {tag}
                        </span>
                      )) || <span className="text-xs text-slate-500">None extracted</span>}
                    </div>
                  </div>

                  <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
                    <h4 className="font-bold text-slate-200">Raw Source Text</h4>
                    <div className="h-44 overflow-y-auto p-3 rounded-xl bg-slate-950/40 border border-white/5 text-xs text-slate-400 font-mono leading-relaxed">
                      {lecture.transcript || 'Raw text data is empty.'}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: FLASHCARDS */}
            {activeTab === 'flashcards' && (
              <div className="max-w-xl mx-auto flex flex-col items-center gap-6">
                {cards.length === 0 ? (
                  <div className="p-8 rounded-2xl glass-card text-center text-slate-500 text-sm">
                    No flashcards generated.
                  </div>
                ) : (
                  <>
                    <div 
                      onClick={() => setIsFlipped(!isFlipped)}
                      className="w-full h-80 rounded-3xl glass-card border border-white/10 p-8 flex flex-col items-center justify-center text-center cursor-pointer select-none hover:border-indigo-500/30 transition-all duration-300 relative shadow-2xl overflow-hidden"
                    >
                      <span className="absolute top-4 right-4 text-[10px] text-slate-500 uppercase tracking-widest font-bold">Click to Flip</span>
                      {isFlipped ? (
                        <div className="space-y-3">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold uppercase tracking-wider">Definition</span>
                          <p className="text-lg font-medium text-slate-200 leading-relaxed">{cards[currentCardIndex]?.back}</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold uppercase tracking-wider">Concept</span>
                          <p className="text-xl font-bold text-white tracking-tight">{cards[currentCardIndex]?.front}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      <button
                        onClick={() => {
                          setIsFlipped(false);
                          setCurrentCardIndex(prev => Math.max(0, prev - 1));
                        }}
                        disabled={currentCardIndex === 0}
                        className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 disabled:opacity-30 cursor-pointer"
                      >
                        Previous
                      </button>
                      <span className="font-semibold text-slate-400 font-mono">
                        {currentCardIndex + 1} / {cards.length}
                      </span>
                      <button
                        onClick={() => {
                          setIsFlipped(false);
                          setCurrentCardIndex(prev => Math.min(cards.length - 1, prev + 1));
                        }}
                        disabled={currentCardIndex === cards.length - 1}
                        className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 disabled:opacity-30 cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB 3: QUIZ */}
            {activeTab === 'quiz' && (
              <div className="max-w-2xl mx-auto">
                {!quiz || quiz.questions.length === 0 ? (
                  <div className="p-8 rounded-2xl glass-card text-center text-slate-500 text-sm">
                    No quiz questions generated.
                  </div>
                ) : quizSubmission ? (
                  <div className="space-y-6">
                    <div className="p-8 rounded-3xl glass-card border border-indigo-500/25 bg-indigo-950/10 flex flex-col items-center text-center shadow-xl">
                      <Award className="w-12 h-12 text-indigo-400 mb-3" />
                      <h3 className="text-xl font-bold text-white mb-1">Quiz Completed</h3>
                      
                      <span className={`text-4xl font-extrabold font-mono mt-6 ${
                        quizSubmission.score >= 80 ? 'text-emerald-400' : quizSubmission.score >= 50 ? 'text-indigo-400' : 'text-rose-400'
                      }`}>
                        {quizSubmission.score}%
                      </span>
                      <p className="text-xs text-slate-400 mt-2 font-medium">Your Score Percentage</p>

                      <button
                        onClick={() => {
                          setQuizSubmission(null);
                          setSelectedAnswers({});
                        }}
                        className="mt-6 px-5 py-2.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl cursor-pointer"
                      >
                        Retake Quiz
                      </button>
                    </div>

                    <div className="space-y-4">
                      {quizSubmission.items?.map((item, idx) => (
                        <div key={item.id} className={`p-5 rounded-2xl border ${
                          item.is_correct ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-rose-500/25 bg-rose-500/5'
                        }`}>
                          <div className="flex justify-between items-start gap-4">
                            <p className="text-sm font-semibold text-slate-200">
                              {idx + 1}. {item.question?.question_text}
                            </p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              item.is_correct ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                            }`}>
                              {item.is_correct ? 'Correct' : 'Incorrect'}
                            </span>
                          </div>
                          <div className="mt-3 grid gap-2">
                            <p className="text-xs text-slate-400">Chosen Answer: <span className="font-semibold text-slate-300">{item.chosen_answer}</span></p>
                            {!item.is_correct && (
                              <p className="text-xs text-emerald-400">Correct Answer: <span className="font-semibold">{item.question?.correct_answer}</span></p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleQuizSubmit} className="space-y-8">
                    {quizError && (
                      <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        <span>{quizError}</span>
                      </div>
                    )}

                    <div className="space-y-6">
                      {quiz.questions.map((q, idx) => (
                        <div key={q.id} className="p-6 rounded-3xl glass-card border border-white/10">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Question {idx + 1}</span>
                          <p className="text-sm font-semibold text-slate-200 mt-2 mb-4">{q.question_text}</p>
                          
                          {q.question_type === 'MCQ' ? (
                            <div className="grid gap-3">
                              {q.options?.map((opt, oIdx) => (
                                <button
                                  key={oIdx}
                                  type="button"
                                  onClick={() => handleQuizAnswer(q.id, opt)}
                                  className={`p-3.5 rounded-xl border text-left text-xs font-semibold transition-all duration-300 ${
                                    selectedAnswers[q.id] === opt
                                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400 shadow-inner'
                                      : 'border-white/10 text-slate-300 hover:bg-white/5'
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-3">
                              {['True', 'False'].map((val) => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => handleQuizAnswer(q.id, val)}
                                  className={`py-3 rounded-xl border text-center text-xs font-semibold transition-all duration-300 ${
                                    selectedAnswers[q.id] === val
                                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400 shadow-inner'
                                      : 'border-white/10 text-slate-300 hover:bg-white/5'
                                  }`}
                                >
                                  {val}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      type="submit"
                      disabled={submittingQuiz}
                      className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
                    >
                      {submittingQuiz ? 'Grading Responses...' : 'Submit Answers'}
                    </button>
                  </form>
                )}
              </div>
            )}

          </div>

          {/* TAB SIDE PANEL: AI CHAT ASSISTANT */}
          {chatOpen && (
            <div className="md:col-span-1 glass-card border border-indigo-500/15 rounded-3xl h-[600px] flex flex-col overflow-hidden sticky top-24 shadow-2xl bg-slate-950/40">
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-900/30">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                  <span className="text-xs font-bold text-slate-200">Study Assistant</span>
                </div>
                <button
                  onClick={() => setChatOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Message Lists */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4 space-y-2 text-slate-500">
                    <Bot className="w-8 h-8 text-slate-600" />
                    <p className="text-xs font-semibold">Ask anything about this document</p>
                    <p className="text-[10px] leading-relaxed">Gemini will guide you based on slide summaries and text.</p>
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-2 max-w-[85%] ${
                        msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                        msg.role === 'user' 
                          ? 'bg-indigo-950 border border-indigo-500/20 text-indigo-400' 
                          : 'bg-purple-950 border border-purple-500/20 text-purple-400'
                      }`}>
                        {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                      </div>

                      <div className={`p-3 rounded-2xl border text-[11px] leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-indigo-600/10 border-indigo-500/25 text-slate-200 rounded-tr-none'
                          : 'bg-slate-900/60 border-white/5 text-slate-300 rounded-tl-none'
                      }`}>
                        <p className="whitespace-pre-line">{msg.text}</p>
                      </div>
                    </div>
                  ))
                )}

                {chatLoading && (
                  <div className="flex gap-2 max-w-[85%]">
                    <div className="w-6 h-6 rounded-full bg-purple-950 border border-purple-500/20 text-purple-400 flex items-center justify-center text-[10px] shrink-0">
                      <Bot className="w-3 h-3" />
                    </div>
                    <div className="p-3 rounded-2xl border border-white/5 bg-slate-900/60 text-slate-500 text-[11px] rounded-tl-none flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                    </div>
                  </div>
                )}
                
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendChat} className="p-3 border-t border-white/5 bg-slate-950/20 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 px-3 py-2.5 rounded-xl text-xs glass-input"
                  disabled={chatLoading}
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
