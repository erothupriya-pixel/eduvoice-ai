import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import DoubtSessionView from '../components/DoubtSessionView';
import { 
  FileText, 
  UploadCloud, 
  Trash2, 
  Sparkles, 
  BookOpen, 
  Award, 
  CheckCircle2, 
  AlertTriangle,
  RotateCw,
  X,
  File,
  Globe,
  Play,
  Pause,
  Volume2,
  RefreshCw,
  Check,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Loader2,
  MessageSquare
} from 'lucide-react';

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Upload file state
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState('');

  // Selected document workspace state
  const [activeDoc, setActiveDoc] = useState(null);
  
  // AI analysis loading/results
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryContent, setSummaryContent] = useState('');
  
  const [aiLoading, setAiLoading] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [activeLanguage, setActiveLanguage] = useState('english'); // 'english' or 'telugu'
  
  // Simple Exam Notes states
  const [examNotesContent, setExamNotesContent] = useState('');
  const [examNotesLang, setExamNotesLang] = useState('english'); // 'english' or 'telugu'
  const [examNotesLoading, setExamNotesLoading] = useState(false);

  // Quiz states
  const [activeQuizId, setActiveQuizId] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { index: option }
  const [submittedQuiz, setSubmittedQuiz] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Speech synthesis states
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [activeAudioSource, setActiveAudioSource] = useState(''); // 'explanation', 'exam_notes', 'quiz'
  const [showDoubtSession, setShowDoubtSession] = useState(false);
  const currentAudioRef = useRef(null);

  useEffect(() => {
    fetchDocuments();
    return () => {
      handleStopSpeech();
    };
  }, []);


  // Poll for document status when processing
  useEffect(() => {
    let intervalId;
    if (activeDoc && activeDoc.processing_status === 'PROCESSING') {
      intervalId = setInterval(async () => {
        try {
          const res = await api.get(`/api/documents/${activeDoc.id}/`);
          // Update documents list
          setDocuments(prev => prev.map(d => d.id === res.data.id ? res.data : d));
          // Update activeDoc status
          if (res.data.id === activeDoc.id) {
            setActiveDoc(res.data);
          }
        } catch (e) {
          console.error("Failed to poll document status:", e);
        }
      }, 2000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeDoc]);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/api/documents/');
      setDocuments(res.data);
    } catch (e) {
      console.error('Failed to load documents:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    setError('');
    setUploadSuccess(false);

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10MB maximum limit.');
      return;
    }

    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const allowed = ['.pdf', '.pptx', '.ppt', '.docx', '.doc'];
    if (!allowed.includes(ext)) {
      setError('Unsupported file format. Please upload PDF, PPT/PPTX, or DOC/DOCX.');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || uploading) return;

    setUploading(true);
    setError('');
    setUploadProgress(15);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      setUploadProgress(50);
      const res = await api.post('/api/documents/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setUploadProgress(100);
      setUploadSuccess(true);
      setSelectedFile(null);
      
      fetchDocuments();
      setActiveDoc(res.data);
      resetWorkspace();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to upload document.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await api.delete(`/api/documents/${id}/`);
      setDocuments(prev => prev.filter(d => d.id !== id));
      if (activeDoc?.id === id) {
        setActiveDoc(null);
        resetWorkspace();
      }
    } catch (e) {
      alert('Failed to delete document.');
    }
  };

  const resetWorkspace = () => {
    setSummaryContent('');
    setExplanation('');
    setExamNotesContent('');
    setActiveQuizId(null);
    setQuizQuestions([]);
    setCurrentQuizIdx(0);
    setSelectedAnswers({});
    setSubmittedQuiz(false);
    setQuizScore(0);
    handleStopSpeech();
  };

  const handleStopSpeech = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setIsAudioLoading(false);
    setActiveAudioSource('');
  };

  // Text-To-Speech Controls using Backend gTTS engine (te-IN / en-US)
  const speakText = async (text, lang, source) => {
    handleStopSpeech();
    if (!text) return;

    setIsAudioLoading(true);
    setActiveAudioSource(source);

    try {
      const res = await api.post(
        '/api/documents/tts/',
        { text, language: lang },
        { responseType: 'blob', timeout: 35000 }
      );

      // Check if backend returned JSON error inside blob response
      if (res.data && res.data.type && res.data.type.includes('application/json')) {
        const textErr = await res.data.text();
        let jsonErr = {};
        try { jsonErr = JSON.parse(textErr); } catch (_) {}
        throw new Error(jsonErr.error || 'Voice synthesis failed on backend.');
      }

      const audioBlob = new Blob([res.data], { type: 'audio/mpeg' });
      if (audioBlob.size < 100) {
        throw new Error('Received empty audio file from TTS server.');
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      audio.onplay = () => {
        setIsAudioLoading(false);
        setIsSpeaking(true);
        setIsPaused(false);
      };

      audio.onended = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        setIsAudioLoading(false);
        setActiveAudioSource('');
      };

      audio.onerror = (e) => {
        console.error("Audio playback error:", e);
        setIsSpeaking(false);
        setIsPaused(false);
        setIsAudioLoading(false);
        setActiveAudioSource('');
        alert(lang === 'telugu' ? "Telugu voice audio playback failed. Please check backend connections." : "Voice playback failed.");
      };

      await audio.play();
    } catch (err) {
      console.error("Backend TTS error:", err);
      setIsSpeaking(false);
      setIsPaused(false);
      setIsAudioLoading(false);
      setActiveAudioSource('');

      let errMsg = err.message || "Failed to generate voice output.";
      if (err.response && err.response.data instanceof Blob) {
        try {
          const errTxt = await err.response.data.text();
          const parsed = JSON.parse(errTxt);
          if (parsed.error) errMsg = parsed.error;
        } catch (_) {}
      }
      alert(lang === 'telugu' ? `Telugu Voice Error: ${errMsg}` : `Voice Error: ${errMsg}`);
    }
  };

  const handlePlayPause = (text, lang, source) => {
    if (activeAudioSource === source && (isSpeaking || isPaused)) {
      if (currentAudioRef.current) {
        if (isPaused) {
          currentAudioRef.current.play();
          setIsPaused(false);
        } else {
          currentAudioRef.current.pause();
          setIsPaused(true);
        }
      } else {
        if (isPaused) {
          window.speechSynthesis.resume();
          setIsPaused(false);
        } else {
          window.speechSynthesis.pause();
          setIsPaused(true);
        }
      }
    } else {
      speakText(text, lang, source);
    }
  };

  const handleReplaySpeech = (text, lang, source) => {
    speakText(text, lang, source);
  };


  // AI Actions Trigger
  const handleAnalyzeDocument = async () => {
    if (!activeDoc) return;
    
    handleStopSpeech();
    setSummaryLoading(true);
    setSummaryContent('');

    try {
      const res = await api.post(`/api/documents/${activeDoc.id}/summary/`, {}, { timeout: 30000 });
      setSummaryContent(res.data.summary);
    } catch (err) {
      console.error(err);
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setSummaryContent("AI analysis is taking longer than expected. Please try again.");
      } else {
        setSummaryContent(err.response?.data?.error || 'Gemini document analysis failed.');
      }
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleExplain = async (lang) => {
    if (!activeDoc) return;
    
    handleStopSpeech();
    setAiLoading(true);
    setExplanation('');
    setActiveLanguage(lang);

    try {
      const res = await api.post(`/api/documents/${activeDoc.id}/explain/`, { language: lang }, { timeout: 30000 });
      setExplanation(res.data.response);
      speakText(res.data.response, lang, 'explanation');
    } catch (err) {
      console.error(err);
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setExplanation("AI analysis is taking longer than expected. Please try again.");
      } else {
        setExplanation(err.response?.data?.error || 'Gemini document explanation query failed.');
      }
    } finally {
      setAiLoading(false);
    }
  };

  const handleLoadExamNotes = async (lang = 'english') => {
    if (!activeDoc) return;
    
    handleStopSpeech();
    setExamNotesLoading(true);
    setExamNotesContent('');
    setExamNotesLang(lang);

    try {
      const res = await api.post(`/api/documents/${activeDoc.id}/exam-notes/`, { language: lang }, { timeout: 30000 });
      setExamNotesContent(res.data.notes);
    } catch (err) {
      console.error(err);
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setExamNotesContent("AI analysis is taking longer than expected. Please try again.");
      } else {
        setExamNotesContent(err.response?.data?.error || 'Failed to generate Simple Exam Notes.');
      }
    } finally {
      setExamNotesLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!activeDoc) return;
    
    handleStopSpeech();
    setQuizLoading(true);
    setQuizQuestions([]);
    setCurrentQuizIdx(0);
    setSelectedAnswers({});
    setSubmittedQuiz(false);
    setQuizScore(0);

    try {
      const res = await api.post(`/api/documents/${activeDoc.id}/quiz/`, {}, { timeout: 30000 });
      setActiveQuizId(res.data.quiz_id);
      setQuizQuestions(res.data.quiz || []);
    } catch (err) {
      console.error(err);
      setActiveQuizId(null);
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        alert("AI analysis is taking longer than expected. Please try again.");
      } else {
        alert(err.response?.data?.error || 'Failed to generate quiz from document.');
      }
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSelectOption = (option) => {
    if (submittedQuiz) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuizIdx]: option
    }));
  };

  const handleQuizSubmit = async () => {
    if (quizQuestions.length === 0 || submittedQuiz || !activeQuizId) return;

    const answersPayload = quizQuestions.map((q, idx) => ({
      question_id: q.id,
      chosen_answer: selectedAnswers[idx] || ''
    }));

    try {
      const res = await api.post('/api/lectures/quizzes/submit/', {
        quiz: activeQuizId,
        answers: answersPayload
      });
      
      const correctCount = Math.round((res.data.score / 100) * quizQuestions.length);
      setQuizScore(correctCount);
      setSubmittedQuiz(true);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        alert("Please login again to continue.");
      } else {
        alert(err.response?.data?.error || err.response?.data?.detail || JSON.stringify(err.response?.data) || "Failed to submit quiz.");
      }
    }
  };

  const getFormatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      
      {/* Header Banner */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-400" />
          AI Document Voice Learning Center
        </h1>
        <p className="text-xs text-slate-400 font-semibold">Upload engineering course materials to extract slides/text, hear bilingual voice walkthroughs, study simple exam notes, and take active mock quizzes.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Side: Drag & Drop upload and Documents register */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Upload card */}
          <div className="glass-card p-6 rounded-3xl border border-white/5 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Upload Engineering Material</h3>
            
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`p-6 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                dragActive 
                  ? 'border-indigo-500 bg-indigo-500/5' 
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <UploadCloud className="w-10 h-10 text-slate-400 mb-2" />
              <p className="text-xs text-slate-300 font-semibold">Drag & drop files here, or</p>
              <label className="text-xs text-indigo-400 font-bold hover:underline mt-1 cursor-pointer">
                Browse Files
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.pptx,.ppt,.docx,.doc"
                  className="hidden"
                />
              </label>
              <span className="text-[10px] text-slate-500 mt-2 font-mono">Supports PDF, PPT/PPTX, DOC/DOCX</span>
            </div>

            {selectedFile && (
              <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5 flex items-center justify-between text-xs font-semibold text-slate-300">
                <div className="truncate pr-2">
                  <p className="truncate text-slate-200">{selectedFile.name}</p>
                  <span className="text-[10px] text-slate-500 font-mono">{getFormatSize(selectedFile.size)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {uploading && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-slate-400 font-mono font-bold">
                  <span>Uploading File...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1">
                  <div className="bg-indigo-600 h-1 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            {uploadSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Document uploaded successfully.</span>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 font-semibold font-mono">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-500/10 cursor-pointer active:scale-98 transition-transform"
            >
              Upload Document
            </button>
          </div>

          {/* Directory list of documents */}
          <div className="glass-card p-6 rounded-3xl border border-white/5 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">My Documents Directory</h3>
            
            {loading ? (
              <div className="flex justify-center py-6">
                <span className="w-5 h-5 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              </div>
            ) : documents.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No documents uploaded yet.</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setActiveDoc(doc);
                      resetWorkspace();
                    }}
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between cursor-pointer transition-all duration-200 ${
                      activeDoc?.id === doc.id
                        ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-300 shadow-inner'
                        : 'border-white/5 hover:bg-white/5 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <File className="w-4.5 h-4.5 text-indigo-400 shrink-0" />
                      <div className="truncate">
                        <p className="truncate text-slate-300">{doc.original_filename}</p>
                        <span className="text-[9px] text-slate-500 uppercase font-mono">{doc.file_type} • {getFormatSize(doc.file_size)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        doc.processing_status === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : doc.processing_status === 'FAILED'
                          ? 'bg-rose-500/10 text-rose-400 font-mono'
                          : 'bg-indigo-500/10 text-indigo-400 animate-pulse'
                      }`}>
                        {doc.processing_status}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                        className="p-1 hover:bg-white/5 text-slate-500 hover:text-rose-400 rounded transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Active Workspace */}
        <div className="lg:col-span-2 space-y-6">
          
          {activeDoc ? (
            <div className="space-y-6">
              
              {/* Document Banner status */}
              <div className="glass-card p-6 rounded-3xl border border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 flex items-center justify-center rounded-2xl shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-200">{activeDoc.original_filename}</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1.5">
                      Status: 
                      <span className={activeDoc.processing_status === 'COMPLETED' ? 'text-emerald-400 font-bold' : activeDoc.processing_status === 'FAILED' ? 'text-rose-400' : 'text-indigo-400 animate-pulse'}>
                        {activeDoc.processing_status === 'COMPLETED' ? 'Processed' : activeDoc.processing_status === 'FAILED' ? 'FAILED' : 'Extracting text...'}
                      </span>
                    </p>
                  </div>
                </div>

                {activeDoc.processing_status === 'COMPLETED' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDoubtSession(prev => !prev)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all border ${
                        showDoubtSession
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/25'
                          : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                      }`}
                    >
                      <HelpCircle className="w-4 h-4 text-indigo-400" />
                      <span>💬 Doubt Session</span>
                    </button>

                    {!summaryContent && !summaryLoading && (
                      <button
                        type="button"
                        onClick={handleAnalyzeDocument}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Sparkles className="w-4 h-4 animate-pulse" />
                        Analyze Document
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Doubt Session Component Panel */}
              {showDoubtSession && (
                <div className="animate-fadeIn">
                  <DoubtSessionView activeDocument={activeDoc} onClose={() => setShowDoubtSession(false)} />
                </div>
              )}


              {/* Status Indicator Screen: Processing */}
              {activeDoc.processing_status === 'PROCESSING' && (
                <div className="glass-card p-8 rounded-3xl border border-indigo-500/25 bg-slate-900/30 text-center space-y-4 py-16 animate-pulse">
                  <RotateCw className="w-10 h-10 text-indigo-400 animate-spin mx-auto" />
                  <h3 className="text-sm font-bold text-slate-200">Extracting text...</h3>
                  <p className="text-[10px] text-slate-500 max-w-xs mx-auto">
                    We are extracting raw text content from the document file. Please wait.
                  </p>
                </div>
              )}

              {/* Status Indicator Screen: Failed */}
              {activeDoc.processing_status === 'FAILED' && (
                <div className="glass-card p-8 rounded-3xl border border-rose-500/20 bg-rose-500/5 text-center space-y-4 py-16">
                  <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-200">Text Extraction Failed</h3>
                  <p className="text-[10px] text-rose-400 max-w-xs mx-auto leading-relaxed">
                    {activeDoc.extracted_text || "The file could not be parsed. Make sure it is not scanned or corrupted."}
                  </p>
                </div>
              )}

              {/* Summary Loading indicator */}
              {summaryLoading && (
                <div className="glass-card p-6 rounded-3xl border border-white/5 flex flex-col items-center justify-center py-16 space-y-2">
                  <RotateCw className="w-6 h-6 text-indigo-400 animate-spin" />
                  <span className="text-[10px] text-slate-500 font-semibold animate-pulse font-mono">Analyzing document...</span>
                </div>
              )}

              {/* Document Summary display */}
              {summaryContent && (
                <div className="glass-card p-6 rounded-3xl border border-white/5 space-y-4">
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2.5">
                    <BookOpen className="w-4 h-4 text-indigo-400" />
                    Document Summary
                  </h3>

                  <div className="p-4 rounded-xl bg-slate-950/20 border border-white/5 text-[11px] text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
                    {summaryContent}
                  </div>

                  {/* Explain buttons container */}
                  <div className="flex gap-2.5 pt-2 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => handleExplain('english')}
                      disabled={aiLoading}
                      className={`px-3.5 py-2 rounded-xl text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1.5 border border-white/5 ${
                        activeLanguage === 'english' && explanation
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Explain English
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExplain('telugu')}
                      disabled={aiLoading}
                      className={`px-3.5 py-2 rounded-xl text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1.5 border border-white/5 ${
                        activeLanguage === 'telugu' && explanation
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Explain Telugu
                    </button>
                  </div>
                </div>
              )}

              {/* AI Loading explanation indicator */}
              {aiLoading && (
                <div className="glass-card p-6 rounded-3xl border border-white/5 flex flex-col items-center justify-center py-16 space-y-2">
                  <RotateCw className="w-6 h-6 text-indigo-400 animate-spin" />
                  <span className="text-[10px] text-slate-500 font-semibold animate-pulse font-mono">
                    Generating learning content...
                  </span>
                </div>
              )}

              {/* Explain Text + Voice Panel */}
              {explanation && (
                <div className="glass-card p-6 rounded-3xl border border-white/5 space-y-4 animate-fadeIn">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-indigo-400" />
                      {activeLanguage === 'telugu' ? '🇮🇳 Telugu Explanation' : 'AI Explanation'}
                    </h3>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-950/40 border border-white/5 text-[11px] text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
                    {explanation}
                  </div>

                  {/* Audio Controls for Explanation */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handlePlayPause(explanation, activeLanguage, 'explanation')}
                      className="py-2.5 px-4 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 rounded-xl text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      {isSpeaking && activeAudioSource === 'explanation' && !isPaused ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          Pause
                        </>
                      ) : isSpeaking && activeAudioSource === 'explanation' && isPaused ? (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          Resume
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                          {activeLanguage === 'telugu' ? 'Listen in Telugu' : 'Listen'}
                        </>
                      )}
                    </button>

                    {isSpeaking && activeAudioSource === 'explanation' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleReplaySpeech(explanation, activeLanguage, 'explanation')}
                          className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Replay Audio"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Replay
                        </button>

                        <button
                          type="button"
                          onClick={handleStopSpeech}
                          className="py-2.5 px-3 bg-rose-950/20 hover:bg-rose-950/30 text-rose-400 border border-rose-500/10 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Stop Audio"
                        >
                          <X className="w-3.5 h-3.5" />
                          Stop
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Simple Exam Notes Section */}
              {summaryContent && (
                <div className="glass-card p-6 rounded-3xl border border-white/5 space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-purple-400" />
                      📚 Simple Exam Notes
                    </h3>
                    
                    {/* Notes load trigger */}
                    {!examNotesContent && !examNotesLoading && (
                      <button
                        type="button"
                        onClick={() => handleLoadExamNotes('english')}
                        className="px-3.5 py-1.5 bg-indigo-650/20 border border-indigo-500/30 text-indigo-400 rounded-lg text-[9px] font-bold cursor-pointer hover:bg-indigo-650/30"
                      >
                        Load Notes
                      </button>
                    )}
                  </div>

                  {examNotesContent && (
                    <div className="flex justify-between items-center bg-slate-950/20 p-2 rounded-xl border border-white/5">
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleLoadExamNotes('english')}
                          className={`px-3 py-1 rounded-md text-[9px] font-bold cursor-pointer transition-colors ${examNotesLang === 'english' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-355'}`}
                        >
                          English
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLoadExamNotes('telugu')}
                          className={`px-3 py-1 rounded-md text-[9px] font-bold cursor-pointer transition-colors ${examNotesLang === 'telugu' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-355'}`}
                        >
                          తెలుగు
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handlePlayPause(examNotesContent, examNotesLang, 'exam_notes')}
                        className="py-1 px-3 bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600/20 text-indigo-400 rounded-lg text-[9px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        {isSpeaking && activeAudioSource === 'exam_notes' && !isPaused ? 'Pause' : 'Listen'}
                      </button>
                    </div>
                  )}

                  {examNotesLoading ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-2">
                      <RotateCw className="w-5 h-5 text-indigo-400 animate-spin" />
                      <span className="text-[10px] text-slate-500 font-semibold animate-pulse font-mono">Generating learning content...</span>
                    </div>
                  ) : examNotesContent ? (
                    <div className="p-4 rounded-xl bg-slate-950/30 border border-white/5 text-[11px] text-slate-300 font-mono leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                      {examNotesContent}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-500 text-center py-6">Select load notes to compile quick notes, keywords, definitions and expected exam questions from PDF.</p>
                  )}

                  {/* Quiz Generation container */}
                  {examNotesContent && (
                    <div className="border-t border-white/5 pt-4 flex justify-between items-center gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-300">Generate Active Quiz</h4>
                        <p className="text-[9px] text-slate-500 font-medium">Evaluate your learning with multiple choice mock quiz slides.</p>
                      </div>

                      <button
                        type="button"
                        onClick={handleGenerateQuiz}
                        disabled={quizLoading}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-650 text-white rounded-xl text-[10px] font-bold cursor-pointer hover:scale-98 transition-all flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Generate Quiz
                      </button>
                    </div>
                  )}

                  {/* Quiz Module Display */}
                  {quizLoading ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-2">
                      <RotateCw className="w-6 h-6 text-indigo-400 animate-spin" />
                      <span className="text-[10px] text-slate-500 font-semibold animate-pulse font-mono">Generating learning content...</span>
                    </div>
                  ) : quizQuestions.length > 0 && (
                    <div className="p-5 rounded-2xl bg-slate-950/30 border border-white/5 space-y-4 animate-fadeIn">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-[9px] text-slate-400 font-mono font-bold uppercase">
                          Question {currentQuizIdx + 1} of {quizQuestions.length}
                        </span>

                        <button
                          type="button"
                          onClick={() => speakText(
                            `Question ${currentQuizIdx + 1}: ${quizQuestions[currentQuizIdx].question_text}. Options are: ${quizQuestions[currentQuizIdx].options.join(', ')}`,
                            'english',
                            'quiz'
                          )}
                          className="py-1 px-2.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg text-[9px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          Listen
                        </button>
                      </div>

                      <p className="text-xs font-bold text-slate-200">
                        {quizQuestions[currentQuizIdx].question_text}
                      </p>

                      <div className="grid gap-2">
                        {quizQuestions[currentQuizIdx].options.map((opt, oIdx) => {
                          const isSelected = selectedAnswers[currentQuizIdx] === opt;
                          const isCorrect = opt === quizQuestions[currentQuizIdx].correct_answer;
                          
                          let cardStyle = "border-white/5 bg-slate-900/40 hover:bg-slate-900/60 text-slate-300";
                          if (isSelected) {
                            cardStyle = "border-indigo-500 bg-indigo-500/10 text-indigo-300";
                          }
                          if (submittedQuiz) {
                            if (isCorrect) {
                              cardStyle = "border-emerald-500 bg-emerald-500/15 text-emerald-400";
                            } else if (isSelected) {
                              cardStyle = "border-rose-500 bg-rose-500/15 text-rose-400";
                            } else {
                              cardStyle = "border-white/5 opacity-50 text-slate-500";
                            }
                          }

                          return (
                            <button
                              key={oIdx}
                              type="button"
                              onClick={() => handleSelectOption(opt)}
                              disabled={submittedQuiz}
                              className={`w-full text-left p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 cursor-pointer transition-all duration-200 ${cardStyle}`}
                            >
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 text-[10px] ${
                                isSelected ? 'border-indigo-500 text-indigo-400' : 'border-slate-600'
                              }`}>
                                {isSelected && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                              </div>
                              <span className="font-semibold text-left">{opt}</span>
                            </button>
                          );
                        })}
                      </div>

                      {submittedQuiz && quizQuestions[currentQuizIdx].explanation && (
                        <div className="p-3.5 rounded-xl bg-indigo-650/5 border border-indigo-500/10 space-y-1">
                          <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wide">Explanation</span>
                          <p className="text-[10px] text-slate-300 leading-relaxed font-semibold">
                            {quizQuestions[currentQuizIdx].explanation}
                          </p>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setCurrentQuizIdx(prev => Math.max(0, prev - 1))}
                            disabled={currentQuizIdx === 0}
                            className="p-2 bg-slate-800 disabled:opacity-50 text-slate-300 rounded-xl cursor-pointer"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCurrentQuizIdx(prev => Math.min(quizQuestions.length - 1, prev + 1))}
                            disabled={currentQuizIdx === quizQuestions.length - 1}
                            className="p-2 bg-slate-800 disabled:opacity-50 text-slate-300 rounded-xl cursor-pointer"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>

                        {!submittedQuiz ? (
                          <button
                            type="button"
                            onClick={handleQuizSubmit}
                            disabled={Object.keys(selectedAnswers).length < quizQuestions.length}
                            className="py-2 px-5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-md shadow-emerald-500/10"
                          >
                            Submit
                          </button>
                        ) : (
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-bold text-slate-350">
                              Score: <span className="text-emerald-400">{quizScore}</span> / {quizQuestions.length}
                            </span>
                            <button
                              type="button"
                              onClick={handleGenerateQuiz}
                              className="py-2 px-4 bg-slate-850 hover:bg-slate-800 text-slate-300 border border-white/5 text-xs font-bold rounded-xl cursor-pointer"
                            >
                              Retry Quiz
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          ) : (
            <div className="glass-card p-8 rounded-3xl border border-white/5 min-h-[500px] flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
              <FileText className="w-12 h-12 text-slate-700" />
              <h3 className="font-bold text-slate-350 text-sm">No Document Active</h3>
              <p className="text-xs max-w-sm">Select an uploaded PDF from the directory on the left to load the integrated AI Voice learning workspace classroom.</p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
