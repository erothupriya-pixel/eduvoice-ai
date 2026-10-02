import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Sparkles,
  MessageSquare,
  FileText,
  Code,
  Users,
  TrendingUp,
  Settings,
  Shield,
  HelpCircle
} from 'lucide-react';

export default function Sidebar({ mobile }) {
  const { user } = useAuth();

  if (!user) return null;

  const getLinks = () => {
    switch (user.role) {
      case 'STUDENT':
        return [
          { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/student/documents', label: 'AI Learning Assistant', icon: Sparkles },
          { to: '/doubt-session', label: 'Doubt Session', icon: HelpCircle },
          { to: '/ai-chat', label: 'AI Chat', icon: MessageSquare },
          { to: '/student/documents', label: 'Documents', icon: FileText },
          { to: '/coding-assistant', label: 'Coding Assistant', icon: Code },
          { to: '/collaboration', label: 'Collaboration', icon: Users },
          { to: '/results', label: 'Progress', icon: TrendingUp },
          { to: '/settings', label: 'Settings', icon: Settings },
        ];

      case 'TEACHER':
        return [
          { to: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/classrooms', label: 'Manage Classes', icon: Users },
          { to: '/lectures', label: 'Lectures', icon: FileText },
          { to: '/upload', label: 'Upload Lecture', icon: Sparkles },
          { to: '/grades', label: 'Student Progress', icon: TrendingUp },
        ];
      case 'ADMIN':
        return [
          { to: '/admin/dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
          { to: '/users', label: 'Manage Users', icon: Users },
          { to: '/system-logs', label: 'API Auditing', icon: Shield },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <aside className={mobile ? "flex flex-col h-full overflow-y-auto" : "fixed left-0 top-16 bottom-0 w-64 glass-card border-t-0 border-l-0 border-b-0 hidden md:flex flex-col p-4 z-40 overflow-y-auto"}>
      <div className="flex-1 flex flex-col gap-1 mt-2">
        {links.map((link, idx) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={idx}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
                  isActive
                    ? 'bg-indigo-600/10 border border-indigo-500/25 text-indigo-400'
                    : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-white/5'
                }`
              }
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </div>
      
      <div className="p-3 border-t border-slate-800 flex flex-col gap-1 shrink-0 mt-4">
        <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">
          Gemini Connection
        </span>
        <div className="flex items-center gap-2 mt-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping absolute" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] text-slate-400 font-semibold">Bilingual Engine Active</span>
        </div>
      </div>
    </aside>
  );
}
