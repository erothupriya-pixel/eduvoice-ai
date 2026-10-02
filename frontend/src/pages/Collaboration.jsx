import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Plus, 
  Calendar, 
  Bot, 
  ChevronRight, 
  ClipboardList,
  AlertTriangle,
  UserCheck,
  UserX,
  X,
  Filter,
  Check,
  Share2,
  Globe,
  Briefcase,
  ListFilter,
  Search,
  MapPin,
  ExternalLink,
  Edit3,
  Trash2,
  Lock,
  Eye,
  Mail,
  FileText
} from 'lucide-react';

export default function Collaboration() {
  const { user } = useAuth();
  
  const [hackathons, setHackathons] = useState([]);
  const [teams, setTeams] = useState([]);
  const [requests, setRequests] = useState([]);
  const [studentProfiles, setStudentProfiles] = useState([]);
  const [incomingApps, setIncomingApps] = useState([]);
  const [mySubmittedApps, setMySubmittedApps] = useState([]);
  
  // Tab states: 'hackathons' | 'need-team-member' | 'find-teammates' | 'manage-applications' | 'my-teams'
  const [activeTab, setActiveTab] = useState('hackathons'); 
  const [loading, setLoading] = useState(true);

  // Success/Notification states
  const [notification, setNotification] = useState({ message: '', type: '' });

  // Create Team form state
  const [teamName, setTeamName] = useState('');
  const [projTitle, setProjTitle] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [selectedHackathon, setSelectedHackathon] = useState('');
  const [teamSkillsReq, setTeamSkillsReq] = useState('');
  const [teamMaxMembers, setTeamMaxMembers] = useState(4);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [errorTeam, setErrorTeam] = useState('');

  // Recruitment "Need Team Member" Request Form state
  const [selectedTeamForReq, setSelectedTeamForReq] = useState('');
  const [selectedHackathonIdForReq, setSelectedHackathonIdForReq] = useState('');
  const [hackathonNameForReq, setHackathonNameForReq] = useState('');
  const [projectNameForReq, setProjectNameForReq] = useState('');
  const [requiredRoleReq, setRequiredRoleReq] = useState('Frontend Developer');
  const [roleDesc, setRoleDesc] = useState('');
  const [skillsReq, setSkillsReq] = useState('');
  const [membersCountReq, setMembersCountReq] = useState(1);
  const [deadlineReq, setDeadlineReq] = useState('');
  const [contactMethodReq, setContactMethodReq] = useState('In-App Platform Application');
  const [showReqForm, setShowReqForm] = useState(false);
  const [errorReq, setErrorReq] = useState('');

  // Search & Filter for "Need Team Member" vacancies
  const [vacancySearch, setVacancySearch] = useState('');
  const [vacancyFilterRole, setVacancyFilterRole] = useState('All');
  const [vacancySubTab, setVacancySubTab] = useState('all'); // 'all' | 'my'

  // Modals state
  const [selectedVacancyDetails, setSelectedVacancyDetails] = useState(null);
  const [editingReq, setEditingReq] = useState(null);
  const [editRole, setEditRole] = useState('');
  const [editSkills, setEditSkills] = useState('');
  const [editMembersCount, setEditMembersCount] = useState(1);
  const [editDesc, setEditDesc] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editContact, setEditContact] = useState('');
  const [editStatus, setEditStatus] = useState('OPEN');
  const [editLoading, setEditLoading] = useState(false);

  // Apply Form state
  const [applyMessage, setApplyMessage] = useState('');
  const [selectedReqForApply, setSelectedReqForApply] = useState(null); // request object
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);

  // Search & Filters for Find Teammates directory
  const [skillSearch, setSkillSearch] = useState('');

  // Hackathons search, filter, pagination & error states
  const [hackathonSearch, setHackathonSearch] = useState('');
  const [hackathonFilter, setHackathonFilter] = useState('All');
  const [hackathonsPage, setHackathonsPage] = useState(1);
  const [hackathonsError, setHackathonsError] = useState(false);
  const [activeTabSub, setActiveTabSub] = useState('active'); // 'active' | 'past'
  const [selectedTechFilter, setSelectedTechFilter] = useState('All');
  const [selectedLocFilter, setSelectedLocFilter] = useState('All');
  const [refreshingHackathons, setRefreshingHackathons] = useState(false);
  const [selectedHackathonDetails, setSelectedHackathonDetails] = useState(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    fetchCollaborationData();
  }, []);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 5000);
  };

  const fetchCollaborationData = async () => {
    setLoading(true);
    setHackathonsError(false);
    try {
      const [hRes, tRes, rRes, pRes, aRes, myAppsRes] = await Promise.all([
        api.get('/api/collaboration/hackathons/'),
        api.get('/api/collaboration/teams/'),
        api.get('/api/collaboration/requests/'),
        api.get('/api/collaboration/profiles/').catch(() => ({ data: [] })),
        api.get('/api/collaboration/applications/incoming/').catch(() => ({ data: [] })),
        api.get('/api/collaboration/applications/my/').catch(() => ({ data: [] }))
      ]);
      setHackathons(hRes.data);
      setTeams(tRes.data);
      setRequests(rRes.data);
      setStudentProfiles(pRes.data || []);
      setIncomingApps(aRes.data || []);
      setMySubmittedApps(myAppsRes.data || []);

      if (hRes.data.length > 0 && !selectedHackathon) {
        setSelectedHackathon(hRes.data[0].id);
      }
    } catch (e) {
      console.error('Failed to load collaboration data:', e);
      setHackathonsError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshHackathons = async () => {
    setRefreshingHackathons(true);
    try {
      const res = await api.post('/api/collaboration/hackathons/refresh/');
      setHackathons(res.data.hackathons);
      setLastRefreshedAt(new Date().toLocaleTimeString());
      setHackathonsError(false);
      showToast(res.data.message || 'Hackathons refreshed successfully.');
    } catch (err) {
      console.error(err);
      showToast('Failed to refresh hackathons. Please try again.', 'error');
    } finally {
      setRefreshingHackathons(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setErrorTeam('');
    if (!teamName.trim()) return;

    const skillsArray = teamSkillsReq.split(',').map(s => s.trim()).filter(Boolean);
    const selectedH = hackathons.find(h => h.id === selectedHackathon);

    try {
      await api.post('/api/collaboration/teams/', {
        name: teamName,
        project_title: projTitle,
        project_description: projDesc,
        hackathon: selectedHackathon || null,
        hackathon_name: selectedH ? selectedH.name : '',
        required_skills: skillsArray,
        max_members: teamMaxMembers
      });
      setTeamName('');
      setProjTitle('');
      setProjDesc('');
      setTeamSkillsReq('');
      setTeamMaxMembers(4);
      setShowTeamForm(false);
      showToast("Team created successfully");
      await fetchCollaborationData();
      setActiveTab('my-teams');
    } catch (err) {
      setErrorTeam(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Failed to create team.');
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setErrorReq('');
    if (!selectedTeamForReq || !roleDesc.trim()) return;

    const skillsArray = skillsReq.split(',').map(s => s.trim()).filter(Boolean);

    try {
      await api.post('/api/collaboration/requests/', {
        team_id: selectedTeamForReq,
        hackathon_id: selectedHackathonIdForReq || null,
        required_role: requiredRoleReq,
        role_description: roleDesc,
        required_skills: skillsArray,
        hackathon_name: hackathonNameForReq,
        project_name: projectNameForReq,
        members_needed: parseInt(membersCountReq),
        deadline: deadlineReq || null,
        contact_method: contactMethodReq || 'In-App Platform Application'
      });
      setSelectedTeamForReq('');
      setSelectedHackathonIdForReq('');
      setHackathonNameForReq('');
      setProjectNameForReq('');
      setRequiredRoleReq('Frontend Developer');
      setRoleDesc('');
      setSkillsReq('');
      setMembersCountReq(1);
      setDeadlineReq('');
      setContactMethodReq('In-App Platform Application');
      setShowReqForm(false);
      showToast("Member requirement posted successfully.");
      await fetchCollaborationData();
      setActiveTab('need-team-member');
    } catch (err) {
      setErrorReq(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Failed to post request.');
    }
  };

  const handleCloseRequest = async (reqId) => {
    if (!confirm('Are you sure you want to close this vacancy requirement?')) return;
    try {
      await api.patch(`/api/collaboration/requests/${reqId}/`, {
        status: 'CLOSED'
      });
      showToast("Vacancy closed successfully.");
      await fetchCollaborationData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to close vacancy.');
    }
  };

  const handleDeleteRequest = async (reqId) => {
    if (!confirm('Are you sure you want to delete this vacancy requirement permanently?')) return;
    try {
      await api.delete(`/api/collaboration/requests/${reqId}/`);
      showToast("Member requirement deleted successfully.");
      await fetchCollaborationData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete requirement.');
    }
  };

  const handleOpenEditModal = (req) => {
    setEditingReq(req);
    setEditRole(req.required_role || 'Frontend Developer');
    setEditSkills((req.required_skills || []).join(', '));
    setEditMembersCount(req.members_needed || 1);
    setEditDesc(req.role_description || '');
    setEditDeadline(req.deadline || '');
    setEditContact(req.contact_method || 'In-App Platform Application');
    setEditStatus(req.status || 'OPEN');
  };

  const handleEditRequestSubmit = async (e) => {
    e.preventDefault();
    if (!editingReq) return;
    setEditLoading(true);
    const skillsArray = editSkills.split(',').map(s => s.trim()).filter(Boolean);
    try {
      await api.patch(`/api/collaboration/requests/${editingReq.id}/`, {
        required_role: editRole,
        required_skills: skillsArray,
        members_needed: parseInt(editMembersCount),
        role_description: editDesc,
        deadline: editDeadline || null,
        contact_method: editContact,
        status: editStatus
      });
      showToast("Requirement updated successfully.");
      setEditingReq(null);
      await fetchCollaborationData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update requirement.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleOpenApply = (req) => {
    setSelectedReqForApply(req);
    setShowApplyModal(true);
    setApplyMessage('');
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!selectedReqForApply) return;

    setApplyLoading(true);
    try {
      await api.post(`/api/collaboration/requests/${selectedReqForApply.id}/apply/`, {
        message: applyMessage
      });
      showToast("Application submitted successfully.");
      setShowApplyModal(false);
      await fetchCollaborationData();
    } catch (err) {
      if (err.response?.status === 401) {
        alert("Please login again to continue.");
      } else {
        alert(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Failed to submit application.');
      }
    } finally {
      setApplyLoading(false);
    }
  };

  const handleAcceptApplicant = async (appId) => {
    if (!confirm('Accept this candidate as a team member?')) return;
    
    try {
      await api.patch(`/api/collaboration/applications/${appId}/status/`, {
        status: 'ACCEPTED'
      });
      showToast("Student added to your team successfully.");
      await fetchCollaborationData();
    } catch (e) {
      alert('Failed to accept applicant.');
    }
  };

  const handleRejectApplicant = async (appId) => {
    if (!confirm('Reject this candidate application?')) return;

    try {
      await api.patch(`/api/collaboration/applications/${appId}/status/`, {
        status: 'REJECTED'
      });
      showToast("Application rejected.");
      await fetchCollaborationData();
    } catch (e) {
      alert('Failed to reject applicant.');
    }
  };

  // Helper: calculate skill match percentage
  const calculateMatch = (reqSkills, studentSkills) => {
    if (!reqSkills || !reqSkills.length) return 75; // fallback
    if (!studentSkills || !studentSkills.length) return 0;
    const reqSet = new Set(reqSkills.map(s => s.toLowerCase().trim()));
    let matchCount = 0;
    studentSkills.forEach(s => {
      if (reqSet.has(s.toLowerCase().trim())) {
        matchCount++;
      }
    });
    return Math.round((matchCount / reqSet.size) * 100);
  };

  // Helper: get match percentage for teammates directory relative to current leader's vacancies
  const getTeammateMatchPercentage = (studentSkills) => {
    const myActiveRequests = requests.filter(r => r.team_detail?.leader?.id === user.id);
    if (!myActiveRequests || myActiveRequests.length === 0) {
      return 75; // Default fallback match score
    }
    
    let maxMatch = 0;
    myActiveRequests.forEach(req => {
      const pct = calculateMatch(req.required_skills, studentSkills);
      if (pct > maxMatch) {
        maxMatch = pct;
      }
    });
    return maxMatch > 0 ? maxMatch : 50;
  };

  if (loading && teams.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
      </div>
    );
  }

  const ledTeams = teams.filter(t => t.leader?.id === user.id);

  const currentDate = new Date('2026-08-13');

  const filteredHackathons = hackathons.filter(h => {
    const startDate = h.start_date ? new Date(h.start_date) : null;
    const deadline = h.registration_deadline ? new Date(h.registration_deadline) : null;
    const isPast = (startDate && startDate < currentDate) && (deadline && deadline < currentDate) && (h.status || '').toUpperCase() === 'CLOSED';
    
    if (activeTabSub === 'active' && isPast) return false;
    if (activeTabSub === 'past' && !isPast) return false;

    const searchLower = hackathonSearch.toLowerCase().trim();
    if (searchLower) {
      const matchesName = h.name.toLowerCase().includes(searchLower);
      const matchesOrganizer = (h.organizer || '').toLowerCase().includes(searchLower);
      const matchesLocation = (h.location || '').toLowerCase().includes(searchLower);
      const matchesThemes = (h.themes || []).some(t => t.toLowerCase().includes(searchLower));
      const matchesSkills = (h.skills || []).some(s => s.toLowerCase().includes(searchLower));
      const matchesPlatforms = (h.platforms || []).some(p => p.toLowerCase().includes(searchLower));
      
      if (!matchesName && !matchesOrganizer && !matchesLocation && !matchesThemes && !matchesSkills && !matchesPlatforms) {
        return false;
      }
    }

    if (hackathonFilter !== 'All' && hackathonFilter !== 'All 2026') {
      const statusUpper = (h.status || '').toUpperCase();
      if (hackathonFilter === 'Open Registration') {
        const isOpen = statusUpper === 'OPEN' || statusUpper === 'LIVE' || statusUpper === 'CLOSING SOON';
        const isNotExpired = !deadline || deadline >= currentDate;
        if (!isOpen || !isNotExpired) return false;
      } else if (hackathonFilter === 'Upcoming') {
        if (statusUpper !== 'UPCOMING') return false;
      } else if (hackathonFilter === 'Live') {
        if (statusUpper !== 'LIVE') return false;
      } else if (hackathonFilter === 'Closing Soon') {
        const isClosingSoon = statusUpper === 'CLOSING SOON' || 
          (deadline && (deadline.getTime() - currentDate.getTime()) <= 7 * 24 * 60 * 60 * 1000 && deadline >= currentDate);
        if (!isClosingSoon) return false;
      } else if (hackathonFilter === 'Online') {
        if (h.event_mode.toLowerCase() !== 'online') return false;
      } else if (hackathonFilter === 'Offline') {
        if (h.event_mode.toLowerCase() !== 'offline') return false;
      } else if (hackathonFilter === 'Hybrid') {
        if (h.event_mode.toLowerCase() !== 'hybrid') return false;
      }
    }

    if (selectedTechFilter !== 'All') {
      const matchesSkill = (h.skills || []).some(s => s.toLowerCase() === selectedTechFilter.toLowerCase());
      const matchesTheme = (h.themes || []).some(t => t.toLowerCase() === selectedTechFilter.toLowerCase());
      if (!matchesSkill && !matchesTheme) return false;
    }

    if (selectedLocFilter !== 'All') {
      const locLower = (h.location || '').toLowerCase();
      if (selectedLocFilter === 'Online') {
        if (h.event_mode.toLowerCase() !== 'online' && !locLower.includes('virtual')) return false;
      } else if (selectedLocFilter === 'India') {
        if (!locLower.includes('india') && !locLower.includes('hyderabad') && !locLower.includes('bengaluru') && !locLower.includes('chennai') && !locLower.includes('delhi') && !locLower.includes('mumbai') && !locLower.includes('vijayawada')) return false;
      } else if (selectedLocFilter === 'Other') {
        const isIndia = locLower.includes('india') || locLower.includes('hyderabad') || locLower.includes('bengaluru') || locLower.includes('chennai') || locLower.includes('delhi') || locLower.includes('mumbai') || locLower.includes('vijayawada');
        const isOnline = h.event_mode.toLowerCase() === 'online' || locLower.includes('virtual');
        if (isIndia || isOnline) return false;
      }
    }

    return true;
  });

  const sortedHackathons = [...filteredHackathons].sort((a, b) => {
    const aOpen = (a.status || '').toUpperCase() === 'OPEN' || (a.status || '').toUpperCase() === 'LIVE' || (a.status || '').toUpperCase() === 'CLOSING SOON';
    const bOpen = (b.status || '').toUpperCase() === 'OPEN' || (b.status || '').toUpperCase() === 'LIVE' || (b.status || '').toUpperCase() === 'CLOSING SOON';
    
    if (aOpen && !bOpen) return -1;
    if (!aOpen && bOpen) return 1;

    if (a.registration_deadline && b.registration_deadline) {
      return new Date(a.registration_deadline) - new Date(b.registration_deadline);
    }
    return 0;
  });

  const HACKATHONS_PER_PAGE = 6;
  const totalPages = Math.ceil(sortedHackathons.length / HACKATHONS_PER_PAGE);
  const paginatedHackathons = sortedHackathons.slice(
    (hackathonsPage - 1) * HACKATHONS_PER_PAGE,
    hackathonsPage * HACKATHONS_PER_PAGE
  );

  const filteredStudents = studentProfiles.filter(std => 
    skillSearch === '' || std.skills?.some(sk => sk.toLowerCase().includes(skillSearch.toLowerCase()))
  );

  // Filter logic for Need Team Member vacancies
  const filteredVacancies = requests.filter(r => {
    // 1. Sub-tab filter: All vs My Requirements
    if (vacancySubTab === 'my') {
      if (r.team_detail?.leader?.id !== user.id) return false;
    }

    // 2. Role filter
    if (vacancyFilterRole !== 'All') {
      const roleLower = (r.required_role || '').toLowerCase();
      const targetFilter = vacancyFilterRole.toLowerCase();
      if (targetFilter === 'ai/ml' && !roleLower.includes('ai') && !roleLower.includes('ml') && !roleLower.includes('machine learning')) return false;
      else if (targetFilter === 'frontend' && !roleLower.includes('frontend') && !roleLower.includes('react') && !roleLower.includes('web')) return false;
      else if (targetFilter === 'backend' && !roleLower.includes('backend') && !roleLower.includes('django') && !roleLower.includes('python')) return false;
      else if (targetFilter === 'full stack' && !roleLower.includes('full stack') && !roleLower.includes('fullstack')) return false;
      else if (targetFilter === 'ui/ux' && !roleLower.includes('ui') && !roleLower.includes('ux') && !roleLower.includes('design')) return false;
      else if (targetFilter === 'data science' && !roleLower.includes('data') && !roleLower.includes('analytics')) return false;
      else if (targetFilter === 'other') {
        const isStandard = roleLower.includes('frontend') || roleLower.includes('backend') || roleLower.includes('ai') || roleLower.includes('ml') || roleLower.includes('ui') || roleLower.includes('data') || roleLower.includes('full stack');
        if (isStandard) return false;
      }
    }

    // 3. Search query filter (role or skill or team or hackathon name)
    const q = vacancySearch.toLowerCase().trim();
    if (q) {
      const matchRole = (r.required_role || '').toLowerCase().includes(q);
      const matchDesc = (r.role_description || '').toLowerCase().includes(q);
      const matchSkills = (r.required_skills || []).some(s => s.toLowerCase().includes(q));
      const matchHackathon = (r.hackathon_name || r.team_detail?.hackathon_name || '').toLowerCase().includes(q);
      const matchTeam = (r.team_detail?.name || '').toLowerCase().includes(q);
      if (!matchRole && !matchDesc && !matchSkills && !matchHackathon && !matchTeam) return false;
    }

    return true;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      
      {/* Toast Notification */}
      {notification.message && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 border text-xs font-bold animate-bounce ${
          notification.type === 'error' 
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
        }`}>
          <Check className="w-4 h-4" />
          {notification.message}
        </div>
      )}

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400 animate-pulse" />
            Student Collaboration Hub
          </h1>
          <p className="text-xs text-slate-400 font-semibold">Coordinate team vacancies, invite matched teammates, and manage applications.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => { setShowTeamForm(!showTeamForm); setShowReqForm(false); }}
            className="px-4 py-2.5 text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-650 hover:from-indigo-500 hover:to-purple-550 text-white rounded-xl shadow-lg shadow-indigo-500/25 flex items-center gap-2 cursor-pointer transition-transform duration-300 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Create Hackathon Team
          </button>
          {ledTeams.length > 0 && (
            <button
              onClick={() => { setShowReqForm(!showReqForm); setShowTeamForm(false); }}
              className="px-4 py-2.5 text-xs font-bold bg-slate-900 border border-purple-500/30 hover:bg-slate-800 text-purple-300 rounded-xl flex items-center gap-2 cursor-pointer transition-transform duration-300 active:scale-95"
            >
              <ClipboardList className="w-4 h-4 text-purple-400" />
              Post Member Requirement
            </button>
          )}
        </div>
      </div>

      {/* Form: Create Hackathon Team */}
      {showTeamForm && (
        <div className="glass-card p-6 rounded-2xl border border-indigo-500/25 bg-slate-900/30">
          <h3 className="font-bold text-slate-100 mb-4 text-sm">Register Hackathon Team</h3>
          {errorTeam && <div className="text-xs text-rose-400 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl mb-4 leading-relaxed font-mono">{errorTeam}</div>}
          <form onSubmit={handleCreateTeam} className="space-y-4 text-xs font-semibold">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 uppercase tracking-wider mb-2">Team Name</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="E.g. EduVoice Team"
                  className="w-full px-4 py-2.5 rounded-xl glass-input"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 uppercase tracking-wider mb-2">Target Hackathon Name</label>
                <select
                  value={selectedHackathon}
                  onChange={(e) => setSelectedHackathon(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl glass-input bg-slate-900"
                >
                  {hackathons.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-slate-400 uppercase tracking-wider mb-2">Required Skills (Comma separated)</label>
                <input
                  type="text"
                  value={teamSkillsReq}
                  onChange={(e) => setTeamSkillsReq(e.target.value)}
                  placeholder="E.g. Python, Django, React, AI/ML"
                  className="w-full px-4 py-2.5 rounded-xl glass-input"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 uppercase tracking-wider mb-2">Maximum Members</label>
                <input
                  type="number"
                  value={teamMaxMembers}
                  onChange={(e) => setTeamMaxMembers(e.target.value)}
                  min="2"
                  max="10"
                  className="w-full px-4 py-2.5 rounded-xl glass-input"
                  required
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 uppercase tracking-wider mb-2">Project Name</label>
                <input
                  type="text"
                  value={projTitle}
                  onChange={(e) => setProjTitle(e.target.value)}
                  placeholder="E.g. EduVoice AI"
                  className="w-full px-4 py-2.5 rounded-xl glass-input"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 uppercase tracking-wider mb-2">Project Description</label>
                <input
                  type="text"
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  placeholder="E.g. AI-powered bilingual learning platform for engineering students."
                  className="w-full px-4 py-2.5 rounded-xl glass-input"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowTeamForm(false)} className="px-4 py-2 text-slate-400 cursor-pointer">Cancel</button>
              <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl cursor-pointer">Create Team</button>
            </div>
          </form>
        </div>
      )}

      {/* Form: Post Member Requirement */}
      {showReqForm && (
        <div className="glass-card p-6 rounded-2xl border border-purple-500/30 bg-slate-900/40 animate-in fade-in zoom-in-95 duration-200">
          <h3 className="font-bold text-slate-100 mb-4 text-sm flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-purple-400" />
            Post Member Requirement Form
          </h3>
          {errorReq && <div className="text-xs text-rose-400 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl mb-4 font-mono">{errorReq}</div>}
          <form onSubmit={handleCreateRequest} className="space-y-4 text-xs font-semibold">
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Field 1: Hackathon */}
              <div>
                <label className="block text-slate-400 uppercase tracking-wider mb-2">1. Select Hackathon</label>
                <select
                  value={selectedHackathonIdForReq}
                  onChange={(e) => {
                    const hid = e.target.value;
                    setSelectedHackathonIdForReq(hid);
                    const hObj = hackathons.find(h => h.id === hid);
                    if (hObj) {
                      setHackathonNameForReq(hObj.name);
                    }
                  }}
                  className="w-full px-4 py-2.5 rounded-xl glass-input bg-slate-900"
                >
                  <option value="">-- Choose Existing Hackathon --</option>
                  {hackathons.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
                {!selectedHackathonIdForReq && (
                  <input
                    type="text"
                    value={hackathonNameForReq}
                    onChange={(e) => setHackathonNameForReq(e.target.value)}
                    placeholder="Or type custom hackathon name..."
                    className="w-full px-4 py-2 mt-2 rounded-xl glass-input"
                    required
                  />
                )}
              </div>

              {/* Field 2: Team Name */}
              <div>
                <label className="block text-slate-400 uppercase tracking-wider mb-2">2. Your Existing Team Name</label>
                <select
                  value={selectedTeamForReq}
                  onChange={(e) => {
                    const tid = e.target.value;
                    setSelectedTeamForReq(tid);
                    const teamObj = teams.find(t => t.id === tid);
                    if (teamObj) {
                      setHackathonNameForReq(teamObj.hackathon_name || hackathonNameForReq || "Smart India Hackathon 2026");
                      setProjectNameForReq(teamObj.project_title || "EduVoice AI");
                      setSkillsReq((teamObj.required_skills || []).join(", "));
                    }
                  }}
                  className="w-full px-4 py-2.5 rounded-xl glass-input bg-slate-900"
                  required
                >
                  <option value="">-- Select Your Team --</option>
                  {ledTeams.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.project_title})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {/* Field 3: Required Role */}
              <div>
                <label className="block text-slate-400 uppercase tracking-wider mb-2">3. Required Role</label>
                <select
                  value={requiredRoleReq}
                  onChange={(e) => setRequiredRoleReq(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl glass-input bg-slate-900"
                  required
                >
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="Backend Developer">Backend Developer</option>
                  <option value="AI/ML Developer">AI/ML Developer</option>
                  <option value="UI/UX Designer">UI/UX Designer</option>
                  <option value="Data Scientist">Data Scientist</option>
                  <option value="Full Stack Developer">Full Stack Developer</option>
                  <option value="Presentation/Documentation">Presentation/Documentation</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Field 4: Required Skills */}
              <div>
                <label className="block text-slate-400 uppercase tracking-wider mb-2">4. Required Skills</label>
                <input
                  type="text"
                  value={skillsReq}
                  onChange={(e) => setSkillsReq(e.target.value)}
                  placeholder="E.g. Python, React, Django, Machine Learning"
                  className="w-full px-4 py-2.5 rounded-xl glass-input"
                  required
                />
              </div>

              {/* Field 5: Number of Members Needed */}
              <div>
                <label className="block text-slate-400 uppercase tracking-wider mb-2">5. Members Needed</label>
                <input
                  type="number"
                  value={membersCountReq}
                  onChange={(e) => setMembersCountReq(e.target.value)}
                  min="1"
                  max="10"
                  className="w-full px-4 py-2.5 rounded-xl glass-input"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {/* Field 6: Description */}
              <div className="md:col-span-2">
                <label className="block text-slate-400 uppercase tracking-wider mb-2">6. Description</label>
                <textarea
                  value={roleDesc}
                  onChange={(e) => setRoleDesc(e.target.value)}
                  placeholder="E.g. Looking for an AI/ML member for our hackathon project."
                  className="w-full px-4 py-2.5 rounded-xl glass-input h-20 resize-none"
                  required
                />
              </div>

              <div className="space-y-3">
                {/* Field 7: Deadline */}
                <div>
                  <label className="block text-slate-400 uppercase tracking-wider mb-2">7. Deadline</label>
                  <input
                    type="date"
                    value={deadlineReq}
                    onChange={(e) => setDeadlineReq(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl glass-input"
                    required
                  />
                </div>

                {/* Field 8: Contact/Application Method */}
                <div>
                  <label className="block text-slate-400 uppercase tracking-wider mb-1">8. Application Method</label>
                  <input
                    type="text"
                    value={contactMethodReq}
                    onChange={(e) => setContactMethodReq(e.target.value)}
                    placeholder="E.g. In-App Platform Application"
                    className="w-full px-4 py-2 rounded-xl glass-input text-xs"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowReqForm(false)} className="px-4 py-2 text-slate-400 cursor-pointer">Cancel</button>
              <button type="submit" className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl cursor-pointer font-bold shadow-lg shadow-purple-600/20">Post Requirement</button>
            </div>
          </form>
        </div>
      )}

      {/* Navigation Tabs Menu */}
      <div className="flex border-b border-white/5 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('hackathons')}
          className={`pb-4 px-4 font-semibold text-xs tracking-wider uppercase transition-all relative shrink-0 ${
            activeTab === 'hackathons' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Hackathons & Teams
          </span>
          {activeTab === 'hackathons' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
        </button>

        <button
          onClick={() => setActiveTab('need-team-member')}
          className={`pb-4 px-4 font-semibold text-xs tracking-wider uppercase transition-all relative shrink-0 ${
            activeTab === 'need-team-member' ? 'text-indigo-400 font-extrabold' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-purple-400" />
            Need a Member
          </span>
          {activeTab === 'need-team-member' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
        </button>

        <button
          onClick={() => setActiveTab('find-teammates')}
          className={`pb-4 px-4 font-semibold text-xs tracking-wider uppercase transition-all relative shrink-0 ${
            activeTab === 'find-teammates' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Find Teammates
          </span>
          {activeTab === 'find-teammates' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
        </button>

        <button
          onClick={() => setActiveTab('manage-applications')}
          className={`pb-4 px-4 font-semibold text-xs tracking-wider uppercase transition-all relative shrink-0 ${
            activeTab === 'manage-applications' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            Manage Applications
            {incomingApps.filter(a => a.status === 'PENDING').length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-indigo-500 text-[8px] text-white rounded-full font-extrabold animate-pulse">
                {incomingApps.filter(a => a.status === 'PENDING').length}
              </span>
            )}
          </span>
          {activeTab === 'manage-applications' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
        </button>

        <button
          onClick={() => setActiveTab('my-teams')}
          className={`pb-4 px-4 font-semibold text-xs tracking-wider uppercase transition-all relative shrink-0 ${
            activeTab === 'my-teams' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            My Teams
          </span>
          {activeTab === 'my-teams' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
        </button>
      </div>

      {/* TAB 1: HACKATHONS & TEAMS */}
      {activeTab === 'hackathons' && (
        <div className="space-y-6">
          <div className="p-5 bg-slate-900/40 rounded-3xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-indigo-400">2026 Hackathons Discovery Board</h2>
              <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                Discover and aggregate legitimate hackathon events across Unstop, Devfolio, Devpost, HackerEarth, and official sites.
              </p>
              <div className="text-[10px] text-slate-500 font-semibold flex flex-wrap gap-x-3 gap-y-1 items-center">
                <span>Sources: Unstop, Devfolio, Devpost, HackerEarth, Official</span>
                <span className="w-1 h-1 rounded-full bg-slate-750" />
                <span className="font-mono">Last updated: {lastRefreshedAt}</span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleRefreshHackathons}
              disabled={refreshingHackathons}
              className="px-4 py-2 bg-indigo-650 hover:bg-indigo-550 disabled:opacity-50 text-xs font-bold text-white rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-indigo-600/10 shrink-0"
            >
              {refreshingHackathons ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  <span>Refreshing...</span>
                </>
              ) : (
                <>
                  <Globe className="w-3.5 h-3.5" />
                  <span>Refresh Hackathons</span>
                </>
              )}
            </button>
          </div>

          {/* Timeline sub-tabs */}
          <div className="flex border-b border-white/5">
            <button
              onClick={() => { setActiveTabSub('active'); setHackathonsPage(1); }}
              className={`pb-3 px-6 font-bold text-xs tracking-wider uppercase transition-all relative ${
                activeTabSub === 'active' ? 'text-indigo-400 font-extrabold' : 'text-slate-550 hover:text-slate-400'
              }`}
            >
              Active 2026
              {activeTabSub === 'active' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
            </button>
            <button
              onClick={() => { setActiveTabSub('past'); setHackathonsPage(1); }}
              className={`pb-3 px-6 font-bold text-xs tracking-wider uppercase transition-all relative ${
                activeTabSub === 'past' ? 'text-indigo-400 font-extrabold' : 'text-slate-550 hover:text-slate-400'
              }`}
            >
              Past 2026
              {activeTabSub === 'past' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
            </button>
          </div>

          {/* Search, Status, Tech, and Location Filters Panel */}
          <div className="p-5 rounded-3xl glass-card border border-white/5 space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative md:col-span-1">
                <input
                  type="text"
                  placeholder="Search hackathons..."
                  value={hackathonSearch}
                  onChange={(e) => {
                    setHackathonSearch(e.target.value);
                    setHackathonsPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs glass-input"
                />
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              </div>

              {/* Tech Select */}
              <div className="flex items-center gap-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap">Technology:</label>
                <select
                  value={selectedTechFilter}
                  onChange={(e) => {
                    setSelectedTechFilter(e.target.value);
                    setHackathonsPage(1);
                  }}
                  className="flex-1 px-3 py-2 rounded-xl text-xs glass-input font-semibold"
                >
                  <option value="All">All Technologies</option>
                  {['AI/ML', 'Web Development', 'App Development', 'Python', 'Java', 'React', 'Cloud', 'Blockchain', 'Cybersecurity', 'Data Science', 'IoT', 'AR/VR', 'FinTech', 'HealthTech', 'AgriTech'].map(tech => (
                    <option key={tech} value={tech}>{tech}</option>
                  ))}
                </select>
              </div>

              {/* Location Select */}
              <div className="flex items-center gap-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap">Location:</label>
                <select
                  value={selectedLocFilter}
                  onChange={(e) => {
                    setSelectedLocFilter(e.target.value);
                    setHackathonsPage(1);
                  }}
                  className="flex-1 px-3 py-2 rounded-xl text-xs glass-input font-semibold"
                >
                  <option value="All">All Locations</option>
                  {['India', 'Online', 'Other'].map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Horizontal filters */}
            <div className="flex flex-wrap gap-1.5 pt-1 justify-start">
              {['All 2026', 'Open Registration', 'Upcoming', 'Live', 'Closing Soon', 'Online', 'Offline', 'Hybrid'].map(filt => (
                <button
                  key={filt}
                  type="button"
                  onClick={() => {
                    setHackathonFilter(filt);
                    setHackathonsPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                    (hackathonFilter === filt || (filt === 'All 2026' && hackathonFilter === 'All'))
                      ? 'bg-indigo-500/10 border-indigo-500/25 text-indigo-400 font-extrabold'
                      : 'bg-white/3 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-300'
                  }`}
                >
                  {filt}
                </button>
              ))}
            </div>
          </div>

          {/* Hackathons listing grid */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <h3 className="font-bold text-slate-100 flex items-center gap-2 text-sm">
                Available Events ({sortedHackathons.length})
              </h3>

              {hackathonsError ? (
                <div className="p-8 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-center text-xs font-bold text-rose-400">
                  Unable to load hackathons right now. Please try again.
                </div>
              ) : paginatedHackathons.length === 0 ? (
                <div className="p-8 rounded-2xl border border-white/5 bg-white/3 text-center text-xs font-semibold text-slate-500">
                  No hackathons found matching your criteria.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {paginatedHackathons.map(h => {
                    const displaysPlatforms = h.platforms && h.platforms.length > 0
                      ? `Sources: ${h.platforms.join(' · ')}`
                      : 'Source: Official Website';
                      
                    return (
                      <div key={h.id} className="p-5 rounded-3xl glass-card border border-white/5 flex flex-col justify-between hover:border-indigo-500/15 transition-all space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <span className="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                              {h.event_mode}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                              h.status === 'LIVE' 
                                ? 'bg-emerald-500/15 text-emerald-450 border border-emerald-500/20 animate-pulse'
                                : h.status === 'OPEN' || h.status === 'OPEN REGISTRATION'
                                ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                                : h.status === 'UPCOMING'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                                : h.status === 'CLOSING SOON'
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                                : 'bg-slate-750 text-slate-400 border border-white/5'
                            }`}>
                              {h.status}
                            </span>
                          </div>
                          
                          <div className="space-y-0.5">
                            <h4 className="font-extrabold text-xs text-slate-200 leading-snug">{h.name}</h4>
                            <p className="text-[9px] text-indigo-400/90 font-bold">Organizer: {h.organizer || 'Not specified'}</p>
                          </div>

                          <p className="text-[10px] text-slate-400 leading-relaxed font-semibold line-clamp-2">{h.description}</p>
                          
                          <div className="pt-2 grid grid-cols-2 gap-2 text-[9px] font-semibold text-slate-450">
                            <div className="flex items-center gap-1.5 font-mono">
                              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                              <span className="truncate">Date: {h.start_date ? new Date(h.start_date).toLocaleDateString() : 'TBD'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-mono">
                              <ClipboardList className="w-3.5 h-3.5 text-indigo-400" />
                              <span className="truncate">Deadline: {h.registration_deadline ? new Date(h.registration_deadline).toLocaleDateString() : 'TBD'}</span>
                            </div>
                          </div>

                          <div className="text-[8px] text-slate-550 font-semibold font-mono pt-1">
                            {displaysPlatforms}
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setSelectedHackathonDetails(h)}
                            className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-bold text-slate-200 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer"
                          >
                            <span>View Details</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => window.open(h.official_url || h.external_link, '_blank')}
                            className="flex-1 py-2 px-3 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer"
                          >
                            <span>Official Registration</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 pt-4">
                  <button
                    type="button"
                    disabled={hackathonsPage === 1}
                    onClick={() => setHackathonsPage(prev => Math.max(1, prev - 1))}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-40 text-[10px] font-bold text-slate-300 rounded-lg border border-white/5 cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="text-[10px] font-bold font-mono text-slate-400">
                    Page {hackathonsPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={hackathonsPage === totalPages}
                    onClick={() => setHackathonsPage(prev => Math.min(totalPages, prev + 1))}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-40 text-[10px] font-bold text-slate-300 rounded-lg border border-white/5 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

            <div className="md:col-span-1 p-5 rounded-3xl glass-card border border-white/5 space-y-4 h-fit">
              <h3 className="font-bold text-slate-100 text-sm">Quick Guidelines</h3>
              <ul className="text-[10px] text-slate-400 space-y-2 list-disc list-inside font-semibold leading-relaxed">
                <li>Form a project team to secure details and vacancy requirements.</li>
                <li>Search events by organizer, technology, or location.</li>
                <li>Refresh hackathons to fetch and sync the latest real platform events.</li>
                <li>Expired and closed events are archived under "Past 2026".</li>
              </ul>
            </div>
          </div>

          {/* Details Modal */}
          {selectedHackathonDetails && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
              <div className="glass-card max-w-lg w-full rounded-3xl border border-white/5 p-6 space-y-4 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
                <button
                  type="button"
                  onClick={() => setSelectedHackathonDetails(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="space-y-1.5 pr-8">
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                      {selectedHackathonDetails.event_mode}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase bg-white/5 text-slate-400 border border-white/5">
                      {selectedHackathonDetails.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-100">{selectedHackathonDetails.name}</h3>
                  <p className="text-[10px] text-indigo-400 font-bold">Organized by: {selectedHackathonDetails.organizer || 'Not specified'}</p>
                </div>

                <div className="text-[11px] text-slate-355 leading-relaxed font-semibold space-y-2 bg-slate-950/40 p-4 rounded-2xl border border-white/5">
                  <p>{selectedHackathonDetails.description}</p>
                </div>

                <div className="flex gap-3 pt-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => window.open(selectedHackathonDetails.official_url || selectedHackathonDetails.external_link, '_blank')}
                    className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Official Registration</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: NEED A MEMBER FEATURE */}
      {activeTab === 'need-team-member' && (
        <div className="space-y-6">
          
          {/* Section Header & Description */}
          <div className="p-5 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-3xl border border-purple-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-purple-300 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-purple-400" />
                Need a Member Vacancy Board
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed font-semibold mt-1">
                Post vacancy requirements when your hackathon team needs additional members, or explore open vacancies to join a team.
              </p>
            </div>
            {ledTeams.length > 0 && (
              <button
                onClick={() => { setShowReqForm(!showReqForm); setShowTeamForm(false); }}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/20 flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                Post Member Requirement
              </button>
            )}
          </div>

          {/* Sub-tabs: All Vacancies vs My Requirements */}
          <div className="flex border-b border-white/5 justify-between items-center flex-wrap gap-3">
            <div className="flex gap-2">
              <button
                onClick={() => setVacancySubTab('all')}
                className={`pb-3 px-5 font-bold text-xs tracking-wider uppercase transition-all relative ${
                  vacancySubTab === 'all' ? 'text-purple-400 font-extrabold' : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                All Vacancies ({requests.length})
                {vacancySubTab === 'all' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />}
              </button>
              <button
                onClick={() => setVacancySubTab('my')}
                className={`pb-3 px-5 font-bold text-xs tracking-wider uppercase transition-all relative ${
                  vacancySubTab === 'my' ? 'text-purple-400 font-extrabold' : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                My Requirements ({requests.filter(r => r.team_detail?.leader?.id === user.id).length})
                {vacancySubTab === 'my' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />}
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-4 rounded-2xl glass-card border border-white/5 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              
              {/* Search by role or skill */}
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={vacancySearch}
                  onChange={(e) => setVacancySearch(e.target.value)}
                  placeholder="Search by role or skill..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl text-xs glass-input"
                />
              </div>

              <div className="text-xs text-slate-400 font-semibold">
                Showing {filteredVacancies.length} vacancies
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-2 items-center pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Filters:</span>
              {['All', 'AI/ML', 'Frontend', 'Backend', 'Full Stack', 'UI/UX', 'Data Science', 'Other'].map(f => (
                <button
                  key={f}
                  onClick={() => setVacancyFilterRole(f)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                    vacancyFilterRole === f
                      ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                      : 'bg-white/3 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-300'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Vacancy List Grid */}
          {filteredVacancies.length === 0 ? (
            <div className="p-12 rounded-3xl glass-card text-center space-y-3">
              <ClipboardList className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="text-sm font-bold text-slate-400">No vacancies found matching your search.</div>
              <p className="text-xs text-slate-500">Try adjusting your role filters or search terms.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {filteredVacancies.map(r => {
                const isOwner = r.team_detail?.leader?.id === user.id;
                const alreadyApplied = mySubmittedApps.some(app => app.request_detail?.id === r.id);
                const isClosed = r.status === 'CLOSED' || r.members_needed <= 0;

                return (
                  <div key={r.id} className={`p-6 rounded-3xl glass-card border transition-all space-y-4 flex flex-col justify-between ${
                    isClosed ? 'border-white/5 bg-slate-950/40 opacity-80' : 'border-purple-500/20 hover:border-purple-500/40 shadow-lg shadow-purple-900/10'
                  }`}>
                    
                    <div className="space-y-3">
                      
                      {/* Top Header badges & Status */}
                      <div className="flex justify-between items-start gap-3">
                        <div className="space-y-1">
                          <span className="text-[9px] px-2.5 py-1 bg-purple-500/15 text-purple-300 border border-purple-500/20 rounded-md font-extrabold uppercase tracking-wider">
                            Role: {r.required_role || 'Other'}
                          </span>
                          <h4 className="font-extrabold text-slate-100 text-base mt-2">{r.project_name || r.team_detail?.project_title || "EduVoice AI"}</h4>
                          <span className="text-xs text-slate-400 font-bold block">Team: <span className="text-indigo-400 font-extrabold">{r.team_detail?.name}</span></span>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${
                          isClosed 
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                            : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 animate-pulse'
                        }`}>
                          {isClosed ? 'CLOSED' : 'OPEN'}
                        </span>
                      </div>

                      {/* Hackathon Name badge */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold bg-slate-900/50 p-2.5 rounded-xl border border-white/5">
                        <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span className="truncate">Hackathon: <strong className="text-slate-100">{r.hackathon_name || r.team_detail?.hackathon_name || "Smart India Hackathon 2026"}</strong></span>
                      </div>

                      {/* Description */}
                      <div className="p-3 bg-slate-950/50 rounded-xl border border-white/5 space-y-1">
                        <span className="text-[9px] text-purple-400 font-bold uppercase tracking-wider block">Description:</span>
                        <p className="text-xs text-slate-300 leading-relaxed font-medium line-clamp-3">{r.role_description}</p>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-400 border-t border-white/5 pt-3">
                        <div>Members needed: <span className="text-slate-100 font-bold">{r.members_needed}</span></div>
                        <div>Deadline: <span className="text-slate-100 font-bold font-mono">{r.deadline || 'Not set'}</span></div>
                        <div>Posted by: <span className="text-indigo-400 font-bold">{r.team_detail?.leader?.username || r.team_detail?.leader?.email}</span></div>
                        <div>Posted date: <span className="text-slate-300 font-mono">{new Date(r.created_at).toLocaleDateString()}</span></div>
                      </div>

                      {/* Required Skills Badges */}
                      <div className="space-y-1 pt-1">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">Required Skills:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {r.required_skills && r.required_skills.length > 0 ? (
                            r.required_skills.map((sk, idx) => (
                              <span key={idx} className="text-[10px] px-2.5 py-1 bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 rounded-lg font-bold">
                                {sk}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">None specified</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="pt-4 border-t border-white/5 flex gap-2 flex-wrap">
                      <button
                        onClick={() => setSelectedVacancyDetails(r)}
                        className="py-2 px-3 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Details
                      </button>

                      {/* Owner controls for My Requirements */}
                      {isOwner ? (
                        <div className="flex gap-2 ml-auto">
                          <button
                            onClick={() => handleOpenEditModal(r)}
                            className="py-2 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Edit
                          </button>

                          {!isClosed && (
                            <button
                              onClick={() => handleCloseRequest(r.id)}
                              className="py-2 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              Close Vacancy
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteRequest(r.id)}
                            className="py-2 px-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      ) : (
                        /* Applicant button */
                        <button
                          onClick={() => handleOpenApply(r)}
                          disabled={alreadyApplied || isClosed}
                          className={`flex-1 py-2 px-4 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-transform duration-300 active:scale-95 cursor-pointer ${
                            alreadyApplied
                              ? 'bg-slate-800 text-slate-400 border border-white/5 cursor-not-allowed'
                              : isClosed
                              ? 'bg-slate-850 text-slate-500 border border-white/5 cursor-not-allowed'
                              : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/25'
                          }`}
                        >
                          <FileText className="w-4 h-4" />
                          {alreadyApplied ? 'Application Submitted' : isClosed ? 'Vacancy Closed' : 'Apply'}
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* TAB 3: FIND TEAMMATES */}
      {activeTab === 'find-teammates' && (
        <div className="space-y-6">
          <div className="p-4 bg-slate-900/40 rounded-xl border border-white/5">
            <h2 className="text-sm font-bold text-indigo-400 mb-1">Teammates Skill Directory</h2>
            <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
              Browse candidate skill profiles. Matches are dynamically computed based on your team's active vacancy request requirements.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <h3 className="font-bold text-slate-100 text-sm">Dynamic Match Directory</h3>
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Filter className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                placeholder="Search by skill (e.g. Python)"
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs glass-input"
              />
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="p-8 rounded-2xl glass-card text-center text-slate-500 text-xs">
              No other student profiles available yet.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {filteredStudents.map(std => {
                const matchPct = getTeammateMatchPercentage(std.skills);
                return (
                  <div key={std.id} className="p-6 rounded-2xl glass-card border border-white/5 space-y-4 flex flex-col justify-between hover:border-indigo-500/15 transition-all">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="font-bold text-slate-200 text-sm">{std.name || 'Not added yet'}</h4>
                          <span className="text-[9px] text-slate-500 font-semibold">{std.email}</span>
                        </div>
                        <span className="text-xs font-bold text-indigo-400 font-mono shrink-0">{matchPct}% Match</span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Skills:</span>
                        <div className="flex flex-wrap gap-1">
                          {std.skills && std.skills.length > 0 ? (
                            std.skills.map((sk, idx) => (
                              <span key={idx} className="text-[9px] px-2 py-0.5 bg-white/3 rounded text-slate-355 font-semibold">{sk}</span>
                            ))
                          ) : (
                            <span className="text-[9px] text-slate-650 italic">Not added yet</span>
                          )}
                        </div>
                      </div>

                      <div className="p-3 bg-slate-950/20 border border-white/3 rounded-xl text-[10px] space-y-1 text-slate-400 font-semibold">
                        <div>Projects: <span className="text-slate-200 font-bold">{std.projects || 'Not added yet'}</span></div>
                        <div>Certificates: <span className="text-slate-200 font-bold">{std.certificates?.join(', ') || 'Not added yet'}</span></div>
                      </div>

                      <div className="flex items-center gap-3 pt-2 text-xs">
                        {std.github ? (
                          <a href={std.github} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-slate-400 hover:text-indigo-400 font-semibold">
                            <Globe className="w-3.5 h-3.5" />
                            GitHub
                          </a>
                        ) : (
                          <span className="text-slate-600 flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> GitHub Not added</span>
                        )}
                        {std.linkedin ? (
                          <a href={std.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-slate-400 hover:text-indigo-400 font-semibold">
                            <Share2 className="w-3.5 h-3.5" />
                            LinkedIn
                          </a>
                        ) : (
                          <span className="text-slate-600 flex items-center gap-1"><Share2 className="w-3.5 h-3.5" /> LinkedIn Not added</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => alert(`Invited ${std.name} to join your team.`)}
                        className="w-full py-2 bg-slate-900 border border-white/5 text-slate-300 hover:bg-slate-800 text-[10px] font-bold rounded-xl"
                      >
                        Invite to Team
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MANAGE APPLICATIONS (TEAM OWNER VIEW) */}
      {activeTab === 'manage-applications' && (
        <div className="space-y-6">
          <div className="p-4 bg-slate-900/40 rounded-xl border border-white/5">
            <h2 className="text-sm font-bold text-indigo-400 mb-1">Incoming Team Vacancy Applications</h2>
            <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
              Review cover messages and skill alignments for candidates applying to your team. Accept or Reject applications.
            </p>
          </div>

          {incomingApps.length === 0 ? (
            <div className="p-8 rounded-2xl glass-card text-center text-slate-500 text-xs">
              No students have applied yet.
            </div>
          ) : (
            <div className="space-y-4">
              {incomingApps.map(app => {
                const reqSkills = app.request_detail?.required_skills || [];
                const applicantSkills = app.applicant?.skills || app.applicant_skills || [];
                const matchPct = calculateMatch(reqSkills, applicantSkills);
                const applicantName = app.applicant?.username || app.applicant_name || 'Student Candidate';
                const applicantCertificates = app.applicant?.certificates || app.applicant_certificates || [];
                const applicantGithub = app.applicant?.github_profile || app.applicant_github;
                const applicantLinkedin = app.applicant?.linkedin_profile || app.applicant_linkedin;
                const applicantProjects = (applicantSkills.includes("React") || applicantSkills.includes("Django")) ? "EduVoice AI, Smart Class Hub" : "Academic Planner & ML Assistant";

                return (
                  <div key={app.id} className="p-6 rounded-3xl glass-card border border-white/10 space-y-4 hover:border-purple-500/20 transition-all">
                    
                    {/* Header: Applicant info & alignment score */}
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-extrabold text-slate-100 text-base">Applicant: {applicantName}</h4>
                        <span className="text-xs text-slate-400 font-mono block mt-0.5">{app.applicant?.email}</span>
                        <span className="text-xs text-purple-400 font-extrabold block mt-1.5">
                          Applying For Role: <strong className="text-slate-200">{app.request_detail?.required_role || 'Developer'}</strong> in Team <strong className="text-indigo-400">{app.request_detail?.team_detail?.name}</strong> ({app.request_detail?.project_name})
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-2xl font-extrabold font-mono block ${
                          matchPct >= 75 ? 'text-emerald-400' : 'text-indigo-400'
                        }`}>
                          {matchPct}% Match
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Skill Alignment</span>
                      </div>
                    </div>

                    {/* Applicant Profile Card Details: Skills, Projects, Certificates */}
                    <div className="grid sm:grid-cols-3 gap-4 text-xs border-y border-white/5 py-4">
                      
                      {/* Skills */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Skills:</span>
                        <div className="flex flex-wrap gap-1">
                          {applicantSkills && applicantSkills.length > 0 ? (
                            applicantSkills.map((sk, sIdx) => (
                              <span key={sIdx} className="text-[10px] px-2 py-0.5 bg-indigo-500/15 text-indigo-300 rounded font-semibold border border-indigo-500/10">
                                {sk}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">No skills listed</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Projects & Certificates */}
                      <div className="space-y-1 text-slate-300 font-medium">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Projects:</span>
                        <div className="text-slate-200 font-bold text-xs">{applicantProjects}</div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider pt-1">Certificates:</span>
                        <div className="text-slate-300 text-[11px]">{applicantCertificates.join(', ') || 'Certified Software Developer'}</div>
                      </div>

                      {/* Links */}
                      <div className="space-y-1.5 font-medium text-slate-300">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Links:</span>
                        <div>GitHub: {applicantGithub ? <a href={applicantGithub} target="_blank" rel="noreferrer" className="text-indigo-400 font-bold hover:underline">{applicantGithub}</a> : <span className="text-slate-500">Not provided</span>}</div>
                        <div>LinkedIn: {applicantLinkedin ? <a href={applicantLinkedin} target="_blank" rel="noreferrer" className="text-indigo-400 font-bold hover:underline">{applicantLinkedin}</a> : <span className="text-slate-500">Not provided</span>}</div>
                      </div>
                    </div>

                    {/* Introduction Cover Message */}
                    <div className="p-3.5 bg-slate-950/40 rounded-xl text-xs space-y-1 border border-white/5">
                      <span className="font-bold text-[9px] text-purple-400 uppercase tracking-wider block">Introduction Cover Message:</span>
                      <p className="text-slate-200 font-semibold italic">"{app.message || 'Hi, I am interested in joining your team. I have Python and Machine Learning skills.'}"</p>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                        Status: <span className={`ml-1 ${
                          app.status === 'ACCEPTED' ? 'text-emerald-400' : app.status === 'REJECTED' ? 'text-rose-400' : 'text-yellow-400'
                        }`}>{app.status}</span>
                      </div>

                      {app.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptApplicant(app.id)}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-500 hover:to-teal-550 text-white font-bold text-xs flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer shadow-lg shadow-emerald-600/20"
                          >
                            <UserCheck className="w-4 h-4" />
                            Accept
                          </button>

                          <button
                            onClick={() => handleRejectApplicant(app.id)}
                            className="px-5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-rose-400 font-bold text-xs flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
                          >
                            <UserX className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: MY TEAMS */}
      {activeTab === 'my-teams' && (
        <div className="space-y-6">
          <div className="p-4 bg-slate-900/40 rounded-xl border border-white/5">
            <h2 className="text-sm font-bold text-indigo-400 mb-1">My Registered Teams</h2>
            <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
              List of hackathon squads where you are registered as team leader or a joined developer member.
            </p>
          </div>

          {teams.length === 0 ? (
            <div className="p-8 rounded-2xl glass-card text-center text-slate-500 text-xs">
              You are not registered in any hackathon teams yet. Use the header button to create one.
            </div>
          ) : (
            <div className="space-y-4">
              {teams.map(t => {
                const isActiveVacancy = requests.some(r => r.team_detail?.id === t.id && r.status === 'OPEN');
                return (
                  <div key={t.id} className="p-5 rounded-2xl glass-card border border-white/5 space-y-4 hover:border-indigo-500/10 transition-colors">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-bold text-slate-200 text-sm">{t.name}</h4>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase">{t.project_title} • Hackathon: {t.hackathon_name || 'N/A'}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase">
                          Leader: {t.leader?.username || t.leader?.email}
                        </span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border uppercase ${
                          isActiveVacancy
                            ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {isActiveVacancy ? 'Active Vacancy' : 'Active'}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium">{t.project_description || 'No project description added yet.'}</p>

                    <div className="grid md:grid-cols-2 gap-4 border-t border-white/5 pt-4">
                      <div>
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5 font-mono">Teammates ({t.members?.length || 1}):</span>
                        <div className="flex flex-wrap gap-2">
                          {t.members?.map(m => (
                            <div key={m.id} className="px-2.5 py-1 bg-slate-950/40 border border-white/5 rounded-lg flex items-center gap-1.5 text-[10px] text-slate-355 font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              {m.username}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5 font-mono">Squad Target Skills:</span>
                        <div className="flex flex-wrap gap-1">
                          {t.required_skills && t.required_skills.length > 0 ? (
                            t.required_skills.map((sk, idx) => (
                              <span key={idx} className="text-[9px] px-2 py-0.5 bg-indigo-500/15 text-indigo-400 border border-indigo-500/10 rounded font-semibold">{sk}</span>
                            ))
                          ) : (
                            <span className="text-[9px] text-slate-650 italic">None set</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VACANCY DETAILS MODAL */}
      {selectedVacancyDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-card max-w-lg w-full rounded-3xl border border-white/10 p-6 space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setSelectedVacancyDetails(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1.5 pr-8">
              <span className="px-2.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Required Role: {selectedVacancyDetails.required_role || 'Other'}
              </span>
              <h3 className="text-base font-extrabold text-slate-100">{selectedVacancyDetails.project_name || selectedVacancyDetails.team_detail?.project_title || 'Project Vacancy'}</h3>
              <p className="text-xs text-indigo-400 font-bold">Team Name: {selectedVacancyDetails.team_detail?.name}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/50 border border-white/5 space-y-2 text-xs text-slate-300 font-medium leading-relaxed">
              <span className="text-[9px] text-purple-400 font-bold uppercase tracking-wider block">Requirement Description:</span>
              <p>{selectedVacancyDetails.role_description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-400 pt-2 border-t border-white/5">
              <div>
                <span className="text-[9px] text-slate-500 block uppercase">Target Hackathon</span>
                <span className="text-slate-200 font-bold">{selectedVacancyDetails.hackathon_name || selectedVacancyDetails.team_detail?.hackathon_name || 'Smart India Hackathon 2026'}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block uppercase">Members Needed</span>
                <span className="text-slate-200 font-bold">{selectedVacancyDetails.members_needed}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block uppercase">Application Deadline</span>
                <span className="text-slate-200 font-mono">{selectedVacancyDetails.deadline || 'Not set'}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block uppercase">Contact Method</span>
                <span className="text-indigo-400 font-bold">{selectedVacancyDetails.contact_method || 'In-App Platform Application'}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] text-slate-500 block uppercase font-bold">Required Skills:</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedVacancyDetails.required_skills?.map((sk, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded bg-indigo-500/15 text-indigo-300 text-xs font-bold border border-indigo-500/20">
                    {sk}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-white/5 flex justify-end">
              {selectedVacancyDetails.team_detail?.leader?.id !== user.id && (
                <button
                  type="button"
                  onClick={() => {
                    const reqObj = selectedVacancyDetails;
                    setSelectedVacancyDetails(null);
                    handleOpenApply(reqObj);
                  }}
                  disabled={mySubmittedApps.some(app => app.request_detail?.id === selectedVacancyDetails.id) || selectedVacancyDetails.status === 'CLOSED'}
                  className="py-2.5 px-6 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-xs font-bold text-white rounded-xl shadow-lg shadow-purple-600/25 cursor-pointer"
                >
                  Apply to Vacancy
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT VACANCY REQUIREMENT MODAL */}
      {editingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-card max-w-lg w-full rounded-3xl border border-white/10 p-6 space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-100 text-sm">Edit Vacancy Requirement</h3>
              <button onClick={() => setEditingReq(null)} className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleEditRequestSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-400 uppercase tracking-wider mb-1">Required Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl glass-input bg-slate-900"
                  required
                >
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="Backend Developer">Backend Developer</option>
                  <option value="AI/ML Developer">AI/ML Developer</option>
                  <option value="UI/UX Designer">UI/UX Designer</option>
                  <option value="Data Scientist">Data Scientist</option>
                  <option value="Full Stack Developer">Full Stack Developer</option>
                  <option value="Presentation/Documentation">Presentation/Documentation</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wider mb-1">Required Skills (Comma separated)</label>
                <input
                  type="text"
                  value={editSkills}
                  onChange={(e) => setEditSkills(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl glass-input"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 uppercase tracking-wider mb-1">Members Needed</label>
                  <input
                    type="number"
                    value={editMembersCount}
                    onChange={(e) => setEditMembersCount(e.target.value)}
                    min="1"
                    max="10"
                    className="w-full px-4 py-2 rounded-xl glass-input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 uppercase tracking-wider mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl glass-input bg-slate-900"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl glass-input h-20 resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 uppercase tracking-wider mb-1">Deadline</label>
                  <input
                    type="date"
                    value={editDeadline}
                    onChange={(e) => setEditDeadline(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl glass-input"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 uppercase tracking-wider mb-1">Contact Method</label>
                  <input
                    type="text"
                    value={editContact}
                    onChange={(e) => setEditContact(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl glass-input"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditingReq(null)} className="px-4 py-2 text-slate-400 cursor-pointer">Cancel</button>
                <button type="submit" disabled={editLoading} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl cursor-pointer font-bold">
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPLY MESSAGE MODAL */}
      {showApplyModal && selectedReqForApply && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 z-55">
          <div className="w-full max-w-md glass-card p-6 rounded-3xl border border-white/10 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-100 text-sm">Apply to {selectedReqForApply.team_detail?.name}</h3>
              <button onClick={() => setShowApplyModal(false)} className="p-1 rounded hover:bg-white/5 cursor-pointer"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            
            <form onSubmit={handleApplySubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-400 uppercase tracking-wider mb-2">Introduction Message</label>
                <textarea
                  value={applyMessage}
                  onChange={(e) => setApplyMessage(e.target.value)}
                  placeholder="Hi, I am interested in joining your team. I have Python and Machine Learning skills."
                  className="w-full px-4 py-3 rounded-xl glass-input h-28 resize-none text-xs"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={applyLoading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl cursor-pointer shadow-lg shadow-purple-600/25"
              >
                {applyLoading ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
