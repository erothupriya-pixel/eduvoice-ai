import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { UploadCloud, AudioLines, FileAudio, FileText, AlertTriangle } from 'lucide-react';

export default function UploadLecture() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialClassroomId = location.state?.classroomId || '';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState(initialClassroomId);
  
  // File States
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileType, setFileType] = useState('AUDIO'); // 'AUDIO', 'PDF', 'PPTX', 'DOCX'
  
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      const res = await api.get('/api/classrooms/');
      setClassrooms(res.data);
      if (res.data.length > 0 && !selectedClassroom) {
        setSelectedClassroom(res.data[0].id);
      }
    } catch (e) {
      console.error('Failed to load classrooms for upload context:', e);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase();
      let detectedType = 'AUDIO';
      
      if (ext === 'pdf') {
        detectedType = 'PDF';
      } else if (['docx', 'doc'].includes(ext)) {
        detectedType = 'DOCX';
      } else if (['pptx', 'ppt'].includes(ext)) {
        detectedType = 'PPTX';
      } else if (file.type.startsWith('audio/') || ['mp3', 'wav', 'm4a', 'ogg'].includes(ext)) {
        detectedType = 'AUDIO';
      } else {
        setError('Unsupported format. Please select an Audio file, PDF, PPTX, or DOCX document.');
        setSelectedFile(null);
        return;
      }

      setError('');
      setSelectedFile(file);
      setFileType(detectedType);
      
      if (!title) {
        // Remove file extension for name default
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('file_type', fileType);
    
    if (fileType === 'AUDIO') {
      formData.append('audio_file', selectedFile);
    } else {
      formData.append('document_file', selectedFile);
    }
    
    if (selectedClassroom) {
      formData.append('classroom', selectedClassroom);
    }

    try {
      const res = await api.post('/api/lectures/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        }
      });
      // Redirect to lecture detail page to monitor transcription status
      navigate(`/lectures/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload lecture file.');
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Upload Learning Material</h1>
        <p className="text-xs text-slate-400">Upload lecture audio or slide presentation documents to generate study aids.</p>
      </div>

      <div className="glass-card p-8 rounded-3xl border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[40px] pointer-events-none" />

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* File Upload drag area */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Lecture Recording or Document</label>
            <div className="relative border border-dashed border-white/10 rounded-2xl p-8 hover:bg-white/5 hover:border-indigo-500/30 transition-all flex flex-col items-center justify-center text-center cursor-pointer">
              <input
                type="file"
                accept="audio/*,.pdf,.docx,.doc,.pptx,.ppt"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploading}
              />
              
              {selectedFile ? (
                <div className="space-y-2 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    {fileType === 'AUDIO' ? (
                      <FileAudio className="w-6 h-6 animate-pulse" />
                    ) : (
                      <FileText className="w-6 h-6 animate-pulse" />
                    )}
                  </div>
                  <p className="text-sm font-semibold text-slate-200">{selectedFile.name}</p>
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider bg-indigo-950/45 px-2.5 py-0.5 rounded-lg border border-indigo-500/15 mt-1">
                    Type: {fileType}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
              ) : (
                <div className="space-y-2 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-center text-slate-400">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-300">Drag and drop file here</p>
                  <span className="text-[10px] text-slate-500">Supports MP3, WAV, PDF, PPTX, DOCX up to 50MB</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Material Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g. Cell Division Lecture"
                className="w-full px-4 py-2.5 rounded-xl glass-input"
                disabled={uploading}
                required
              />
            </div>

            {/* Classroom */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Classroom / Course</label>
              <select
                value={selectedClassroom}
                onChange={(e) => setSelectedClassroom(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl glass-input appearance-none bg-slate-900/60"
                disabled={uploading}
              >
                <option value="">Personal Study (No Classroom)</option>
                {classrooms.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Syllabus Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Lecture topic guidelines and chapter context..."
              className="w-full px-4 py-3 rounded-xl glass-input h-24 resize-none"
              disabled={uploading}
            />
          </div>

          {uploading ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-400 font-semibold">
                <span>Uploading Lecture Stream...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <AudioLines className="w-4 h-4 text-indigo-200" />
              Upload & Process with Gemini AI
            </button>
          )}

        </form>
      </div>
    </div>
  );
}
