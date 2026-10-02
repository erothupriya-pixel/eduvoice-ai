import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Classrooms from './pages/Classrooms';
import ClassroomDetail from './pages/ClassroomDetail';
import Lectures from './pages/Lectures';
import LectureDetail from './pages/LectureDetail';
import Results from './pages/Results';
import UploadLecture from './pages/UploadLecture';
import Grades from './pages/Grades';
import Collaboration from './pages/Collaboration';
import AIChat from './pages/AIChat';
import CodingAssistant from './pages/CodingAssistant';
import Documents from './pages/Documents';
import DoubtSessionPage from './pages/DoubtSession';
import Settings from './pages/Settings';
import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <Routes>
            {/* Public Views */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected Panel Views */}
            <Route element={<DashboardLayout />}>
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/classrooms" element={<Classrooms />} />
              <Route path="/classrooms/:id" element={<ClassroomDetail />} />
              <Route path="/lectures" element={<Lectures />} />
              <Route path="/lectures/:id" element={<LectureDetail />} />
              <Route path="/results" element={<Results />} />
              <Route path="/upload" element={<UploadLecture />} />
              <Route path="/grades" element={<Grades />} />
              <Route path="/collaboration" element={<Collaboration />} />
              <Route path="/ai-chat" element={<AIChat />} />
              <Route path="/doubt-session" element={<DoubtSessionPage />} />
              <Route path="/coding-assistant" element={<CodingAssistant />} />
              <Route path="/student/documents" element={<Documents />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

