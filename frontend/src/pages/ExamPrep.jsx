import { useState } from 'react';
import api from '../services/api';
import { 
  Sparkles, 
  BookOpen, 
  HelpCircle, 
  FileText, 
  AlertTriangle,
  RotateCw,
  Award,
  CheckCircle,
  HelpCircle as QuestionIcon
} from 'lucide-react';

export default function ExamPrep() {
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState('input'); // 'input', 'summary', 'questions', 'quiz'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Results state
  const [summary, setSummary] = useState('');
  const [questions, setQuestions] = useState('');
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [scoreResult, setScoreResult] = useState(null);

  const handleGenerateMaterials = async (type) => {
    if (!inputText.trim()) {
      setError('Please paste study material or notes content first.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      if (type === 'summary') {
        const res = await api.post('/api/ai/generate-summary/', { content: inputText });
        setSummary(res.data.summary);
        setActiveTab('summary');
      } else if (type === 'questions') {
        const res = await api.post('/api/ai/generate-questions/', { content: inputText });
        setQuestions(res.data.questions);
        setActiveTab('questions');
      } else if (type === 'quiz') {
        const res = await api.post('/api/ai/generate-quiz/', { content: inputText });
        setQuizQuestions(res.data.quiz || []);
        setSelectedAnswers({});
        setScoreResult(null);
        setActiveTab('quiz');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to communicate with Gemini engine.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (qIndex, value) => {
    setSelectedAnswers(prev => ({ ...prev, [qIndex]: value }));
  };

  const handleScoreQuiz = () => {
    let score = 0;
    quizQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correct_answer) {
        score += 1;
      }
    });
    setScoreResult({
      score,
      total: quizQuestions.length,
      percentage: Math.round((score / quizQuestions.length) * 100)
    });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Award className="w-6 h-6 text-purple-400" />
          AI Exam Preparation Assistant
        </h1>
        <p className="text-xs text-slate-400">Paste syllabus notes or text logs to generate revision summaries, expected questions, and interactive quizzes.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 gap-2">
        <button
          onClick={() => setActiveTab('input')}
          className={`pb-4 px-4 font-semibold text-sm transition-all relative ${
            activeTab === 'input' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Syllabus Content Input
          </span>
          {activeTab === 'input' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
        </button>

        <button
          onClick={() => summary ? setActiveTab('summary') : handleGenerateMaterials('summary')}
          className={`pb-4 px-4 font-semibold text-sm transition-all relative ${
            activeTab === 'summary' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Revision Notes Summary
          </span>
          {activeTab === 'summary' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
        </button>

        <button
          onClick={() => questions ? setActiveTab('questions') : handleGenerateMaterials('questions')}
          className={`pb-4 px-4 font-semibold text-sm transition-all relative ${
            activeTab === 'questions' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <QuestionIcon className="w-4 h-4" />
            Target Questions Guide
          </span>
          {activeTab === 'questions' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
        </button>

        <button
          onClick={() => quizQuestions.length > 0 ? setActiveTab('quiz') : handleGenerateMaterials('quiz')}
          className={`pb-4 px-4 font-semibold text-sm transition-all relative ${
            activeTab === 'quiz' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            Evaluation Quiz
          </span>
          {activeTab === 'quiz' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <p className="text-xs text-slate-400 font-semibold animate-pulse">Gemini is processing parameters and generating study aids...</p>
        </div>
      )}

      {!loading && (
        <div className="mt-4">
          
          {/* TAB: INPUT */}
          {activeTab === 'input' && (
            <div className="glass-card p-6 rounded-3xl border border-white/5 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Enter Lecture or Syllabus Material</h3>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste chapter notes, technical content, or text transcription segments here..."
                className="w-full h-80 px-4 py-3 rounded-2xl glass-input text-xs font-semibold resize-none focus:border-indigo-500"
              />
              <div className="flex flex-wrap gap-3 justify-end">
                <button
                  onClick={() => handleGenerateMaterials('summary')}
                  className="px-5 py-2.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg cursor-pointer"
                >
                  Generate Summary
                </button>
                <button
                  onClick={() => handleGenerateMaterials('questions')}
                  className="px-5 py-2.5 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-lg cursor-pointer"
                >
                  Generate Question Guide
                </button>
                <button
                  onClick={() => handleGenerateMaterials('quiz')}
                  className="px-5 py-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg cursor-pointer"
                >
                  Generate Quiz
                </button>
              </div>
            </div>
          )}

          {/* TAB: SUMMARY */}
          {activeTab === 'summary' && summary && (
            <div className="glass-card p-8 rounded-3xl border border-white/5 space-y-4 prose prose-invert max-w-none text-xs font-semibold">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                Gemini Revision Summary
              </h3>
              <p className="whitespace-pre-wrap text-slate-300 leading-relaxed">{summary}</p>
            </div>
          )}

          {/* TAB: QUESTIONS */}
          {activeTab === 'questions' && questions && (
            <div className="glass-card p-8 rounded-3xl border border-white/5 space-y-4 prose prose-invert max-w-none text-xs font-semibold">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Expected Questions Guide
              </h3>
              <p className="whitespace-pre-wrap text-slate-300 leading-relaxed">{questions}</p>
            </div>
          )}

          {/* TAB: QUIZ */}
          {activeTab === 'quiz' && quizQuestions.length > 0 && (
            <div className="glass-card p-8 rounded-3xl border border-white/5 space-y-6">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-white/5 pb-4">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                Interactive Evaluation Practice Quiz
              </h3>

              <div className="space-y-6">
                {quizQuestions.map((q, idx) => (
                  <div key={idx} className="space-y-3">
                    <p className="text-xs font-bold text-slate-200 flex gap-2">
                      <span className="text-indigo-400">Q{idx+1}.</span>
                      {q.question_text}
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3 pl-6">
                      {q.options?.map((opt, oIdx) => (
                        <button
                          key={oIdx}
                          onClick={() => handleAnswerChange(idx, opt)}
                          className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                            selectedAnswers[idx] === opt
                              ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                              : 'border-white/5 hover:bg-white/5 text-slate-400'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {scoreResult ? (
                <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-8 h-8 text-emerald-400 shrink-0" />
                    <div>
                      <h4 className="font-bold text-slate-200 text-sm">Evaluation Completed</h4>
                      <p className="text-[10px] text-slate-500 font-semibold">Your responses were compared with correct Gemini labels.</p>
                    </div>
                  </div>
                  <div className="text-center sm:text-right">
                    <span className="text-2xl font-extrabold text-emerald-400 font-mono">{scoreResult.score} / {scoreResult.total}</span>
                    <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Score ({scoreResult.percentage}%)</span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleScoreQuiz}
                    disabled={Object.keys(selectedAnswers).length < quizQuestions.length}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/10 cursor-pointer"
                  >
                    Grade Answers
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
