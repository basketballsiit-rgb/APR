import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Users, CalendarCheck, FileText,
  Settings, LogOut, Search, Plus, Upload, CheckCircle2,
  Clock, ChevronRight, Menu, X, FileSpreadsheet, Download,
  Printer, Filter, Check, Loader2, UploadCloud, FileUp, Save,
  Edit, Trash, Bell, UserCheck, AlertCircle, Lock, ShieldCheck, Paperclip,
  BookOpen
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import * as XLSX from 'xlsx';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // --- Global State ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  useEffect(() => {
    const userStr = localStorage.getItem('srs_user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
        setIsAuthenticated(true);
      } catch(e){}
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('srs_user');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveTab('dashboard');
  };
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const notifPollRef = useRef(null);
  const prevNotifIdsRef = useRef(''); // Track last known notification IDs to avoid unnecessary re-renders
  // Used to trigger re-fetch in ActivitiesView when an activity is locked from ReportsView
  const [activitiesRefreshKey, setActivitiesRefreshKey] = useState(0);

  // --- API CONFIG ---
  const API_URL = import.meta.env.DEV ? 'http://localhost/APR/api' : '/APR/api';

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Poll notifications every 30s
  const fetchNotifications = () => {
    const user = JSON.parse(localStorage.getItem('srs_user') || 'null');
    if (!user?.id) return;
    fetch(`${API_URL}/get_notifications.php?staff_id=${user.id}`)
      .then(res => res.json())
      .then(res => {
        if (res.status === 'success') {
          const incoming = res.data;
          const incomingKey = incoming.map(n => `${n.id}-${n.is_read}`).join(',');
          if (incomingKey === prevNotifIdsRef.current) return;
          prevNotifIdsRef.current = incomingKey;

          setNotifications(prev => {
            const newNotifs = incoming.filter(n => !prev.some(p => p.id === n.id) && n.is_read == 0);
            newNotifs.forEach(n => {
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(n.title, { body: n.message, icon: '/favicon.ico' });
              }
            });
            return incoming;
          });
        }
      })
      .catch(() => { });
  };

  useEffect(() => {
    fetchNotifications();
    notifPollRef.current = setInterval(fetchNotifications, 30000);
    return () => clearInterval(notifPollRef.current);
  }, []);

  const unreadCount = notifications.filter(n => n.is_read == 0).length;

  const markAllRead = () => {
    const user = JSON.parse(localStorage.getItem('srs_user') || 'null');
    if (!user?.id) return;
    fetch(`${API_URL}/mark_notification_read.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ staff_id: user.id }) })
      .then(() => {
        prevNotifIdsRef.current = '';
        setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      });
  };

  const deleteNotification = (notifId) => {
    const user = JSON.parse(localStorage.getItem('srs_user') || 'null');
    if (!user?.id) return;
    fetch(`${API_URL}/delete_notification.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notification_id: notifId, user_id: user.id })
    })
      .then(res => res.json())
      .then(res => {
        if (res.status === 'success') {
          prevNotifIdsRef.current = '';
          setNotifications(prev => prev.filter(n => n.id !== notifId));
        }
      });
  };

  useEffect(() => {
    // ปิด Sidebar ตอนเริ่มต้นถ้ารันบนมือถือ
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  // --- Views ---

  // 0. Login View
  const LoginView = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleLogin = (e) => {
      e.preventDefault();
      setIsLoggingIn(true);
      setErrorMsg('');

      fetch(`${API_URL}/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      .then(res => res.json())
      .then(res => {
        if (res.status === 'success') {
          localStorage.setItem('srs_user', JSON.stringify(res.user));
          setCurrentUser(res.user);
          setIsAuthenticated(true);
          setActiveTab('dashboard');
        } else {
          setErrorMsg(res.message);
        }
      })
      .catch(err => {
        setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
      })
      .finally(() => setIsLoggingIn(false));
    };

    return (
      <div className="flex items-center justify-center min-h-[80vh] py-8">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row w-full max-w-5xl md:min-h-[600px] border border-slate-200">
          
          {/* Left Side: Brand & Info (Gradient) */}
          <div className="bg-gradient-to-br from-indigo-900 via-blue-800 to-cyan-600 md:w-2/5 p-10 flex flex-col items-center justify-center text-center relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-blue-400/20 blur-3xl"></div>
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-4 shadow-xl border-2 border-white/30 overflow-hidden p-1">
                <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Logo" className="w-full h-full object-cover rounded-full bg-white/80" onError={(e) => e.target.style.display='none'} />
              </div>
              <h2 className="text-[22px] font-bold text-white mb-1">ระบบรายงานการเข้าร่วมกิจกรรม</h2>
              <p className="text-sm font-bold text-cyan-300 mb-2">(Activity Participation Report)</p>
              <p className="text-blue-200 mb-8 font-medium text-sm">วิทยาลัยสารพัดช่างน่าน</p>
              
              <div className="space-y-4 text-left w-full max-w-xs mx-auto">
                <div className="flex items-center text-white/90 text-sm">
                  <CheckCircle2 size={16} className="text-emerald-400 mr-3 shrink-0" />
                  <span>จัดการแฟ้มประวัติส่วนตัวออนไลน์</span>
                </div>
                <div className="flex items-center text-white/90 text-sm">
                  <CheckCircle2 size={16} className="text-emerald-400 mr-3 shrink-0" />
                  <span>ตรวจสอบสถิติการเข้าร่วมกิจกรรม</span>
                </div>
                <div className="flex items-center text-white/90 text-sm">
                  <CheckCircle2 size={16} className="text-emerald-400 mr-3 shrink-0" />
                  <span>รองรับระบบฐานข้อมูลกลาง (Keycloak)</span>
                </div>
              </div>
            </div>
            
            <p className="mt-8 md:mt-24 text-[10px] text-blue-300 opacity-70">© 2026 Nan Polytechnic College</p>
          </div>

          {/* Right Side: Login Form */}
          <div className="md:w-3/5 p-8 md:p-14 lg:p-20 bg-slate-50 flex flex-col justify-center">
            <h2 className="text-2xl font-black text-slate-800 mb-2">เข้าสู่ระบบบุคลากร</h2>
            <p className="text-slate-500 text-sm mb-10">กรุณากรอกข้อมูลส่วนตัวเพื่อเข้าสู่ระบบงานของวิทยาลัย</p>

            {errorMsg && (
              <div className="mb-6 bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-4 rounded text-sm flex items-start gap-3">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-6">
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => window.location.href = `${API_URL}/kc_login.php`}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-4 font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 text-lg"
                >
                  <UserCheck size={24} />
                  เข้าสู่ระบบด้วยบัญชีวิทยาลัย (SSO)
                </button>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    );
  };


  // 1. Dashboard View
  const DashboardView = () => {
    const [stats, setStats] = useState({ totalStaff: 0, totalActivities: 0, overallAttendance: 0 });
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [myData, setMyData] = useState(null);
    const [myLoading, setMyLoading] = useState(false);

    useEffect(() => {
      fetch(`${API_URL}/get_dashboard.php`)
        .then(res => res.json())
        .then(res => {
          if (res.status === 'success') {
            setStats({
              totalStaff: res.data.totalStaff,
              totalActivities: res.data.totalActivities,
              overallAttendance: res.data.overallAttendance
            });
            setChartData(res.data.chartData);
          }
          setLoading(false);
        })
        .catch(err => { console.error(err); setLoading(false); });

      // Fetch personal attendance if logged in
      if (currentUser?.id) {
        setMyLoading(true);
        fetch(`${API_URL}/get_my_attendance.php?staff_id=${currentUser.id}`)
          .then(res => res.json())
          .then(res => { if (res.status === 'success') setMyData(res); setMyLoading(false); })
          .catch(() => setMyLoading(false));
      }
    }, []);

    const statusConfig = {
      present: { label: 'เข้าร่วม',   bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300', dot: 'bg-emerald-500' },
      absent:  { label: 'ขาด',        bg: 'bg-rose-100',    text: 'text-rose-700',    border: 'border-rose-300',    dot: 'bg-rose-500'    },
      leave:   { label: 'สำรอง',      bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-300',   dot: 'bg-amber-500'   },
      proxy:   { label: 'แทน/แลก',   bg: 'bg-indigo-50',   text: 'text-indigo-700',  border: 'border-indigo-300',  dot: 'bg-indigo-400'  },
      pending: { label: 'รอบันทึก',   bg: 'bg-slate-100',   text: 'text-slate-500',   border: 'border-slate-200',   dot: 'bg-slate-400'   },
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>;

    return (
      <div className="space-y-8 animate-fade-in">

        {/* ===== PERSONAL CARD ===== */}
        {currentUser?.id && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-white font-bold text-lg shadow">
                  {currentUser.full_name?.charAt(0) || '?'}
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg leading-tight">{currentUser.full_name}</h2>
                  <p className="text-cyan-100 text-xs">{myData?.staff?.group_names ? `สังกัด: ${myData.staff.group_names}` : currentUser.staff_code}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/80 text-xs font-medium">อัตราเข้าร่วม</p>
                <p className="text-white font-black text-3xl">{myData?.summary?.rate ?? '-'}%</p>
              </div>
            </div>

            {/* Summary Bar */}
            {myData && (
              <div className="border-b border-slate-100">
                <div className="grid grid-cols-3 divide-x divide-slate-100">
                  <div className="p-4 text-center">
                    <p className="text-2xl font-black text-emerald-600">{myData.summary.present}</p>
                    <p className="text-xs text-slate-500 mt-0.5">เข้าร่วม</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-2xl font-black text-rose-600">{myData.summary.absent}</p>
                    <p className="text-xs text-slate-500 mt-0.5">ขาด</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-2xl font-black text-slate-500">{myData.summary.total}</p>
                    <p className="text-xs text-slate-500 mt-0.5">ทั้งหมด (กิจกรรมกลุ่ม)</p>
                  </div>
                </div>
                {/* แทน/แลก info badge */}
                {(myData.summary.proxyCount > 0) && (
                  <div className="px-5 py-2 bg-indigo-50 flex items-center gap-2 border-t border-indigo-100">
                    <span className="text-xs font-semibold text-indigo-700">🤝 ไปแทน/แลก:</span>
                    <span className="text-xs font-black text-indigo-800">{myData.summary.proxyCount} ครั้ง</span>
                    <span className="text-[10px] text-indigo-500">(ไม่นับรวมในจำนวนกิจกรรมกลุ่ม)</span>
                  </div>
                )}
              </div>
            )}

            {/* Own Group Activity List */}
            <div className="p-5">
              {myLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-blue-400 w-8 h-8" /></div>
              ) : !myData || myData.activities.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <CalendarCheck size={36} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">ยังไม่มีกิจกรรมในกลุ่มของคุณ</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-600 mb-3 flex items-center gap-2">
                    <CalendarCheck size={16} className="text-blue-500" />
                    ประวัติการเข้าร่วมกิจกรรมกลุ่ม ({myData.activities.length} รายการ)
                  </h3>
                  {myData.activities.map((act, i) => {
                    // effective_status from API: proxy_by → present
                    const effStatus = act.effective_status || 'pending';
                    const s = statusConfig[effStatus] || statusConfig.pending;
                    return (
                      <div key={i} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${s.border} ${s.bg} gap-3`}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`}></div>
                          <div className="min-w-0">
                            <p className={`font-semibold text-sm truncate ${s.text}`}>{act.activity_name}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] text-slate-500">📅 {act.activity_date}</span>
                              {act.group_name && <span className="text-[11px] text-slate-400">• {act.group_name}</span>}
                              {act.proxy_by && (
                                <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                                  👤 {act.proxy_by} มาแทน
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className={`shrink-0 text-[11px] font-bold px-3 py-1 rounded-full border ${s.border} ${s.text} bg-white/70`}>
                          {s.label}{act.proxy_by ? ' (มีผู้แทน)' : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Proxy History Section */}
              {myData?.proxyHistory?.length > 0 && (
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-indigo-700 mb-3 flex items-center gap-2">
                    🤝 ประวัติการไปแทน/แลก ({myData.proxyHistory.length} รายการ)
                    <span className="text-[10px] font-normal text-slate-400">(ไม่นับรวมในสถิติกิจกรรมกลุ่ม)</span>
                  </h3>
                  {myData.proxyHistory.map((act, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl border border-indigo-200 bg-indigo-50 gap-3 mb-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-2 h-2 rounded-full shrink-0 bg-indigo-400"></div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate text-indigo-700">{act.activity_name}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] text-slate-500">📅 {act.activity_date}</span>
                            {act.group_name && <span className="text-[11px] text-slate-400">• {act.group_name}</span>}
                            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                              🤝 แทน {act.proxied_for}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="shrink-0 text-[11px] font-bold px-3 py-1 rounded-full border border-indigo-300 text-indigo-700 bg-white/70">
                        แทน/แลก
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}



        {/* ===== OVERALL STATS ===== */}
        {!currentUser?.id && (
          <div className="space-y-8">
            <div>
          <h2 className="text-xl font-bold text-slate-700 mb-4 flex items-center gap-2">
            <LayoutDashboard size={20} className="text-blue-500" /> แดชบอร์ดภาพรวม
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="relative bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-6 shadow-lg shadow-blue-500/30 overflow-hidden group border border-white/10 hover:-translate-y-1 transition duration-300">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full transition-transform duration-500 group-hover:scale-125"></div>
              <div className="relative z-10 flex flex-col h-full min-h-[120px]">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm shadow-sm border border-white/20 flex items-center justify-center mb-4">
                  <Users size={24} className="text-white drop-shadow-md" />
                </div>
                <div className="mt-auto">
                  <h3 className="text-5xl font-black text-white drop-shadow-sm tracking-tight">{stats.totalStaff}</h3>
                  <p className="text-sm font-medium text-white/90 mt-2">บุคลากรทั้งหมด (คน)</p>
                </div>
              </div>
            </div>
            {/* Card 2 */}
            <div className="relative bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 shadow-lg shadow-indigo-500/30 overflow-hidden group border border-white/10 hover:-translate-y-1 transition duration-300">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full transition-transform duration-500 group-hover:scale-125"></div>
              <div className="relative z-10 flex flex-col h-full min-h-[120px]">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm shadow-sm border border-white/20 flex items-center justify-center mb-4">
                  <CalendarCheck size={24} className="text-white drop-shadow-md" />
                </div>
                <div className="mt-auto">
                  <h3 className="text-5xl font-black text-white drop-shadow-sm tracking-tight">{stats.totalActivities}</h3>
                  <p className="text-sm font-medium text-white/90 mt-2">กิจกรรมในภาคเรียนนี้ (ครั้ง)</p>
                </div>
              </div>
            </div>
            {/* Card 3 */}
            <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 shadow-lg shadow-teal-500/30 overflow-hidden group border border-white/10 hover:-translate-y-1 transition duration-300">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full transition-transform duration-500 group-hover:scale-125"></div>
              <div className="relative z-10 flex flex-col h-full min-h-[120px]">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm shadow-sm border border-white/20 flex items-center justify-center mb-4">
                  <CheckCircle2 size={24} className="text-white drop-shadow-md" />
                </div>
                <div className="mt-auto">
                  <h3 className="text-5xl font-black text-white drop-shadow-sm tracking-tight">{stats.overallAttendance}%</h3>
                  <p className="text-sm font-medium text-white/90 mt-2">สถิติเข้าร่วมเฉลี่ย</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detail Cards per Group */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <FileText className="text-blue-500" /> รายละเอียดสถิติการเข้าร่วมรายกลุ่ม
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chartData.map((data, idx) => {
              const colorThemes = [
                { border: 'border-t-blue-500',    bg: 'bg-blue-50/40',    text: 'text-blue-800',    badge: 'bg-blue-100 text-blue-700' },
                { border: 'border-t-purple-500',  bg: 'bg-purple-50/40',  text: 'text-purple-800',  badge: 'bg-purple-100 text-purple-700' },
                { border: 'border-t-emerald-500', bg: 'bg-emerald-50/40', text: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-700' },
                { border: 'border-t-orange-500',  bg: 'bg-orange-50/40',  text: 'text-orange-800',  badge: 'bg-orange-100 text-orange-700' },
                { border: 'border-t-pink-500',    bg: 'bg-pink-50/40',    text: 'text-pink-800',    badge: 'bg-pink-100 text-pink-700' },
                { border: 'border-t-indigo-500',  bg: 'bg-indigo-50/40',  text: 'text-indigo-800',  badge: 'bg-indigo-100 text-indigo-700' },
              ];
              const theme = colorThemes[idx % colorThemes.length];
              return (
                <div key={idx} className={`p-4 border border-slate-200 shadow-sm hover:shadow-md transition rounded-xl flex flex-col h-full relative overflow-hidden group border-t-4 ${theme.border} ${theme.bg}`}>
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-200/60">
                      <div>
                        <h4 className={`font-bold text-base ${theme.text}`}>{data.name}</h4>
                        <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${theme.badge}`}>
                          ทั้งหมด {data['จำนวนคนทั้งกลุ่ม']} คน • จัดแล้ว {data['จำนวนกิจกรรม']} ครั้ง
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="bg-[#f8fbff] rounded-lg p-3 border border-blue-50/80 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-blue-800">
                          <Users size={14} /> <span className="font-bold text-sm">ผู้เข้าร่วม</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-blue-600/70">จำนวนคนแยกตามครั้ง:</span>
                          <span className="px-2 py-1 bg-white border border-blue-100 rounded text-blue-700 font-mono font-bold text-sm tracking-widest shadow-sm">
                            {data['รายละเอียดเข้าร่วม']}
                          </span>
                        </div>
                      </div>
                      <div className="bg-[#fff9fa] rounded-lg p-3 border border-rose-50/80 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-rose-800">
                          <LogOut size={14} /> <span className="font-bold text-sm">ผู้ที่ขาด/ลา</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-rose-600/70">จำนวนคนแยกตามครั้ง:</span>
                          <span className="px-2 py-1 bg-white border border-rose-100 rounded text-rose-700 font-mono font-bold text-sm tracking-widest shadow-sm">
                            {data['รายละเอียดขาด']}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        </div>
        )}
      </div>
    );




  };

  // 2. Activities & Attendance View

  const ActivitiesView = ({ refreshKey }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [staffList, setStaffList] = useState([]);
    const [saving, setSaving] = useState(false);
    const [allStaffForProxy, setAllStaffForProxy] = useState([]);
    const [proxyModal, setProxyModal] = useState(null); // { absentId, absentName }
    const [proxyMap, setProxyMap] = useState({}); // { absentId: { proxy_id, proxy_name, proxy_code } }
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newActivity, setNewActivity] = useState({ id: null, name: '', date: '', group_id: 0, attachment: null, existing_attachment: null });
    const [groupsList, setGroupsList] = useState([]);

    useEffect(() => {
      fetchActivities();
      // Load all staff for proxy selection
      fetch(`${API_URL}/get_all_staff.php`)
        .then(res => res.json())
        .then(res => { if (res.status === 'success') setAllStaffForProxy(res.data); });
      // Load groups for creation
      fetch(`${API_URL}/get_filters.php`)
        .then(res => res.json())
        .then(res => { if (res.status === 'success') setGroupsList(res.data.groups); });
    }, [refreshKey]); // Re-fetch when refreshKey changes (e.g., after locking an activity)

    const fetchActivities = () => {
      setLoading(true);
      fetch(`${API_URL}/get_activities.php`)
        .then(res => res.json())
        .then(res => {
          if (res.status === 'success') {
            setActivities(res.data);
            // Sync selectedActivity if it's currently open and its status changed (e.g., locked)
            setSelectedActivity(prev => {
              if (!prev) return prev;
              const updated = res.data.find(a => a.id === prev.id);
              return updated ? { ...prev, status: updated.status } : prev;
            });
          } else {
              alert(res.message || 'ไม่สามารถโหลดข้อมูลกิจกรรมได้');
          }
          setLoading(false);
        })
        .catch(err => {
            console.error(err);
            alert('เกิดข้อผิดพลาดในการโหลดข้อมูล (DB Schema อาจไม่ตรงกัน)');
            setLoading(false);
        });
    };

    const handleSelectActivity = (activity) => {
      setSelectedActivity(activity);
      setIsLoading(true);
      setProxyMap({}); // Reset proxy map on new activity
      const groupId = activity.group_id || 0;
      fetch(`${API_URL}/get_staff.php?activity_id=${activity.id}&group_id=${groupId}`)
        .then(res => res.json())
        .then(res => {
          if (res.status === 'success') {
            setStaffList(res.data);
          }
          setIsLoading(false);
        });
      // Also load any existing proxy assignments
      fetch(`${API_URL}/get_proxies.php?activity_id=${activity.id}`)
        .then(res => res.json())
        .then(res => {
          if (res.status === 'success') {
            const map = {};
            res.data.forEach(px => {
              map[px.absent_id] = {
                proxy_id: parseInt(px.proxy_id),
                proxy_name: px.proxy_name,
                proxy_code: px.proxy_code
              };
            });
            setProxyMap(map);
          }
        });
    };

    const handleStatusChange = (staffId, status) => {
      setStaffList(staffList.map(s => s.id === staffId ? { ...s, status } : s));
    };

    const markAllPresent = () => {
      setStaffList(staffList.map(s => ({ ...s, status: 'present' })));
    };

    const handleSaveAttendance = () => {
      setSaving(true);
      const payload = {
        activity_id: selectedActivity.id,
        attendance: staffList.map(s => ({ staff_id: s.id, status: s.status === 'pending' ? 'absent' : s.status }))
      };

      fetch(`${API_URL}/save_attendance.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(res => res.json())
        .then(res => {
          setSaving(false);
          if (res.status === 'success') {
            alert('บันทึกข้อมูลเรียบร้อยแล้ว');
            setSelectedActivity(null); // กลับไปหน้าเลือกกิจกรรม
          } else {
            alert('เกิดข้อผิดพลาด: ' + res.message);
          }
        });
    };

    const handleSaveProxy = (absentId, proxyId) => {
      if (!proxyId) return;
      const proxyPerson = allStaffForProxy.find(s => s.id === parseInt(proxyId));
      if (!proxyPerson) return;
      fetch(`${API_URL}/save_proxy.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity_id: selectedActivity.id, proxy_id: parseInt(proxyId), absent_id: absentId })
      }).then(res => res.json()).then(res => {
        if (res.status === 'success') {
          setProxyMap(prev => ({ ...prev, [absentId]: { proxy_id: parseInt(proxyId), proxy_name: proxyPerson.name, proxy_code: proxyPerson.code } }));
          setProxyModal(null);
          // Auto check 'present' when a proxy is assigned
          handleStatusChange(absentId, 'present');
        } else alert('บันทึกตัวแทนไม่สำเร็จ: ' + res.message);
      });
    };

    const handleDeleteProxy = (absentId) => {
      fetch(`${API_URL}/delete_proxy.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity_id: selectedActivity.id, absent_id: absentId })
      }).then(res => res.json()).then(res => {
        if (res.status === 'success') {
          setProxyMap(prev => { const n = { ...prev }; delete n[absentId]; return n; });
          // Default back to 'absent' when proxy is removed
          handleStatusChange(absentId, 'absent');
        }
      });
    };

    const handleCreateActivity = async () => {
      if (!newActivity.name || !newActivity.date) return alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      setSaving(true);
      
      let attachment_path = newActivity.existing_attachment || null;
      
      if (newActivity.attachment) {
          const formData = new FormData();
          formData.append('file', newActivity.attachment);
          try {
              const uploadRes = await fetch(`${API_URL}/upload_attachment.php`, { method: 'POST', body: formData }).then(r => r.json());
              if (uploadRes.status === 'success') {
                  attachment_path = uploadRes.file_path;
              } else {
                  setSaving(false);
                  return alert('อัปโหลดไฟล์ล้มเหลว: ' + uploadRes.message);
              }
          } catch(e) {
              setSaving(false);
              return alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่ออัปโหลดไฟล์');
          }
      }

      const isEdit = !!newActivity.id;
      const apiUrl = isEdit ? `${API_URL}/update_activity.php` : `${API_URL}/create_activity.php`;
      const payload = {
        activity_name: newActivity.name,
        activity_date: newActivity.date,
        group_id: newActivity.isAllGroups ? 0 : newActivity.group_id
      };
      if (attachment_path !== null) {
          payload.attachment_path = attachment_path;
      }
      if (isEdit) payload.id = newActivity.id;

      fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(res => res.json()).then(res => {
        setSaving(false);
        if (res.status === 'success') {
          setShowCreateModal(false);
          setNewActivity({ id: null, name: '', date: '', group_id: 0, isAllGroups: true, attachment: null, existing_attachment: null });
          fetchActivities();
        } else {
          alert(res.message);
        }
      });
    };

    const handleDeleteActivity = (id) => {
      if (confirm('คุณต้องการลบกิจกรรมนี้ใช่หรือไม่? ข้อมูลการเช็คชื่อทั้งหมดจะถูกลบไปด้วยและไม่สามารถกู้คืนได้')) {
        fetch(`${API_URL}/delete_activity.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        }).then(res => res.json()).then(res => {
          if (res.status === 'success') {
            fetchActivities();
          } else {
            alert(res.message);
          }
        });
      }
    };

    const openEditModal = (activity) => {
      setNewActivity({
        id: activity.id,
        name: activity.name,
        date: activity.raw_date || '',
        group_id: parseInt(activity.group_id) || (groupsList.length > 0 ? groupsList[0].id : 0),
        isAllGroups: !parseInt(activity.group_id) || parseInt(activity.group_id) === 0,
        attachment: null,
        existing_attachment: activity.attachment_path || null
      });
      setShowCreateModal(true);
    };

    const openCreateModal = () => {
      let nextGroupId = 0;
      let isAllGroups = true;

      if (activities && activities.length > 0 && groupsList && groupsList.length > 0) {
          const lastGroupAct = activities.find(a => parseInt(a.group_id) > 0);
          if (lastGroupAct) {
              const lastId = parseInt(lastGroupAct.group_id);
              const lastIdx = groupsList.findIndex(g => g.id == lastId);
              if (lastIdx !== -1) {
                  const nextIdx = (lastIdx + 1) % groupsList.length;
                  nextGroupId = groupsList[nextIdx].id;
              } else {
                  nextGroupId = groupsList[0].id;
              }
          } else {
              nextGroupId = groupsList[0].id;
          }
          isAllGroups = false;
      } else if (groupsList && groupsList.length > 0) {
          nextGroupId = groupsList[0].id;
          isAllGroups = false;
      }

      setNewActivity({ 
        id: null, 
        name: '', 
        date: '', 
        group_id: nextGroupId, 
        isAllGroups,
        attachment: null, 
        existing_attachment: null 
      });
      setShowCreateModal(true);
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>;

    if (selectedActivity) {
      return (
        <div className="space-y-6 animate-fade-in relative relative-wrapper">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSelectedActivity(null)} className="text-slate-500 hover:text-slate-800 flex items-center gap-1">
              <span>กลับหน้ากิจกรรม</span>
            </button>
            <ChevronRight size={16} className="text-slate-400" />
            <h2 className="text-xl font-bold text-slate-800">ลงชื่อ: {selectedActivity.name}</h2>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            {selectedActivity.status === 'locked' && (
              <div className="p-3 bg-rose-50 border-b border-rose-200 flex items-center gap-2 text-rose-700 font-medium text-sm">
                <Lock size={16} />
                กิจกรรมนี้ถูกล็อคแล้ว — ไม่สามารถแก้ไขข้อมูลการเข้าร่วมได้
              </div>
            )}
            <div className="p-4 bg-blue-50 border-b border-blue-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-bold text-blue-900">กำลังเช็คชื่อ: {selectedActivity.group_name || 'ทั้งหมด'}</h3>
                <p className="text-sm text-blue-700">วันที่: {selectedActivity.date}</p>
              </div>
              <div className="flex space-x-2 w-full md:w-auto">
                <button onClick={markAllPresent} disabled={selectedActivity.status === 'locked'} className="flex-1 md:flex-none px-4 py-2 bg-white text-blue-600 text-sm font-medium rounded-lg border border-blue-200 hover:bg-blue-50 transition disabled:opacity-40 disabled:cursor-not-allowed">
                  เช็คมาทั้งหมด
                </button>
                <button onClick={handleSaveAttendance} disabled={saving || selectedActivity.status === 'locked'} className="flex-1 md:flex-none px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-blue-700 transition flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed">
                  {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                  บันทึกข้อมูล
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>
              ) : (
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 min-w-48">ชื่อ-สกุล</th>
                      <th className="px-6 py-4 text-center">สถานะการเข้าร่วม</th>
                      <th className="px-6 py-4 text-center">ตัวแทน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffList.map((staff) => {
                      const proxy = proxyMap[staff.id];
                      return (
                        <tr key={staff.id} className={`border-b border-slate-100 hover:bg-slate-50 transition ${staff.status === 'pending' ? 'bg-amber-50/50' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{staff.name}</td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center space-x-2 md:space-x-4">
                              <label className={`flex items-center space-x-1 md:space-x-2 cursor-pointer px-2 py-1 rounded transition ${staff.status === 'present' ? 'bg-emerald-100 text-emerald-700 font-bold' : 'text-emerald-600 hover:bg-emerald-50'}`}>
                                <input type="radio" name={`status-${staff.id}`} className="hidden" checked={staff.status === 'present'} onChange={() => handleStatusChange(staff.id, 'present')} />
                                <span>มา</span>
                              </label>
                              <label className={`flex items-center space-x-1 md:space-x-2 cursor-pointer px-2 py-1 rounded transition ${staff.status === 'absent' ? 'bg-rose-100 text-rose-700 font-bold' : 'text-rose-500 hover:bg-rose-50'}`}>
                                <input type="radio" name={`status-${staff.id}`} className="hidden" checked={staff.status === 'absent'} onChange={() => handleStatusChange(staff.id, 'absent')} />
                                <span>ขาด</span>
                              </label>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-center">
                            {proxy ? (
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-xs bg-indigo-100 text-indigo-800 font-semibold px-2 py-1 rounded-full border border-indigo-200">
                                  {proxy.proxy_name}
                                </span>
                                <button onClick={() => handleDeleteProxy(staff.id)} className="text-[10px] text-rose-500 hover:underline">ยกเลิก</button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setProxyModal({ absentId: staff.id, absentName: staff.name })}
                                className="text-xs text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded px-2 py-1 hover:bg-indigo-50 transition"
                              >
                                + ระบุตัวแทน
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Proxy Selection Modal */}
          {proxyModal ? (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
                <h3 className="text-lg font-bold text-slate-800 mb-1">ระบุตัวแทนการเข้าร่วม</h3>
                <p className="text-sm text-slate-500 mb-5">
                  เลือกบุคลากรที่จะเข้าร่วมแทน <span className="font-semibold text-indigo-700">{proxyModal.absentName}</span>
                </p>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">ค้นหาและเลือกตัวแทน:</label>
                  <input
                    list="proxy-staff-list"
                    id="proxy-input"
                    placeholder="พิมพ์ชื่อเพื่อค้นหา..."
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-100 focus:outline-none"
                    onChange={(e) => {
                      const matched = allStaffForProxy.find(s => `${s.name} (${s.code})` === e.target.value);
                      if (matched) handleSaveProxy(proxyModal.absentId, matched.id);
                    }}
                  />
                  <datalist id="proxy-staff-list">
                    {allStaffForProxy.filter(s => s.id !== proxyModal.absentId).map(s => (
                      <option key={s.id} value={`${s.name} (${s.code})`} />
                    ))}
                  </datalist>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setProxyModal(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition">
                    ยกเลิก
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-800">จัดการกิจกรรมและการลงชื่อ</h2>
          <button onClick={openCreateModal} className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 transition w-full md:w-auto">
            <Plus size={18} />
            <span>สร้างกิจกรรมใหม่</span>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="relative w-full md:w-64">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search size={16} className="text-slate-400" />
              </div>
              <input type="text" className="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 shadow-sm" placeholder="ค้นหากิจกรรม..." />
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {activities.length === 0 ? (
              <div className="p-8 text-center text-slate-500">ไม่พบข้อมูลกิจกรรม</div>
            ) : activities.map((activity) => (
              <div key={activity.id} className="p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between hover:bg-slate-50 transition gap-4">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-xl shrink-0 ${activity.status === 'active' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                    <CalendarCheck size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-800">{activity.name}</h4>
                    <div className="flex flex-wrap items-center gap-2 md:gap-4 text-sm text-slate-500 mt-1">
                      <span className="flex items-center"><Clock size={14} className="mr-1" /> {activity.date}</span>
                      <span className="hidden md:inline">•</span>
                      <span>ภาคเรียน: {activity.term}</span>
                      <span className="hidden md:inline">•</span>
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-medium">กลุ่ม: {activity.group_name || 'ทั้งหมด'}</span>
                      {activity.attachment_path && (
                        <>
                          <span className="hidden md:inline">•</span>
                          <a href={`${API_URL}/../${activity.attachment_path}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium px-2 py-0.5 bg-blue-50 hover:bg-blue-100 rounded transition" title="ดูเอกสารแนบ">
                            <Paperclip size={14} /> เอกสารกำหนดการ
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="w-full md:w-auto flex justify-end gap-2 items-center">
                  {activity.status !== 'locked' && (
                    <>
                      <button onClick={() => openEditModal(activity)} className="px-3 py-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent rounded-lg transition" title="แก้ไข">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDeleteActivity(activity.id)} className="px-3 py-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent rounded-lg transition" title="ลบ">
                        <Trash size={18} />
                      </button>
                    </>
                  )}

                  {activity.status === 'locked' ? (
                    <span className="px-3 py-1 bg-rose-50 text-rose-700 text-sm font-medium rounded-full border border-rose-200 flex items-center gap-1">
                      <Lock size={12} /> ล็อคแล้ว
                    </span>
                  ) : activity.status === 'active' ? (
                    <button
                      onClick={() => handleSelectActivity(activity)}
                      className="w-full md:w-auto px-4 py-2 bg-emerald-50 text-emerald-700 font-medium rounded-lg border border-emerald-200 hover:bg-emerald-100 transition"
                    >
                      ดำเนินการลงชื่อ
                    </button>
                  ) : activity.status === 'completed' ? (
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-sm font-medium rounded-full border border-slate-200">เสร็จสิ้นแล้ว</span>
                  ) : (
                    <span className="px-3 py-1 bg-amber-50 text-amber-600 text-sm font-medium rounded-full border border-amber-200">ยังไม่ถึงกำหนด</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Create Activity Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800">{newActivity.id ? 'แก้ไขกิจกรรม' : 'สร้างกิจกรรมใหม่'}</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">ชื่อกิจกรรม <span className="text-rose-500">*</span></label>
                  <input type="text" value={newActivity.name} onChange={e => setNewActivity({ ...newActivity, name: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="เช่น ประชุมประจำเดือน..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">วันที่จัดกิจกรรม <span className="text-rose-500">*</span></label>
                  <input type="date" value={newActivity.date} onChange={e => setNewActivity({ ...newActivity, date: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-semibold text-slate-700">กลุ่มบุคลากรเป้าหมาย</label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-sm font-medium text-slate-600">
                      <input 
                         type="checkbox" 
                         checked={newActivity.isAllGroups} 
                         onChange={e => setNewActivity({...newActivity, isAllGroups: e.target.checked})}
                         className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      เข้าร่วมทุกกลุ่ม (ทั้งหมด)
                    </label>
                  </div>
                  {!newActivity.isAllGroups && (
                    <select value={newActivity.group_id} onChange={e => setNewActivity({ ...newActivity, group_id: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none">
                      {groupsList.map(g => (
                        <option key={g.id} value={g.id}>{g.group_name}</option>
                      ))}
                    </select>
                  )}
                  {newActivity.isAllGroups && (
                    <div className="w-full border border-slate-200 bg-slate-50 text-slate-500 rounded-lg px-3 py-2 text-sm flex items-center justify-center">
                      บุคลากรทุกกลุ่มเข้าร่วมกิจกรรมนี้
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Paperclip size={14} className="text-slate-400" />
                    เอกสารอ้างอิง/กำหนดการ (ไฟล์แนบ)
                  </label>
                  <input type="file" onChange={e => {
                    const file = e.target.files[0];
                    if (file && file.size > 20 * 1024 * 1024) {
                        alert('ไฟล์มีขนาดใหญ่เกินไป (ระบบรองรับสูงสุดไม่เกิน 20MB)\nกรุณาบีบอัดไฟล์ PDF หรือรูปภาพให้มีขนาดเล็กลงก่อนอัปโหลดครับ');
                        e.target.value = null;
                        setNewActivity({ ...newActivity, attachment: null });
                        return;
                    }
                    setNewActivity({ ...newActivity, attachment: file });
                  }} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" />
                  {newActivity.existing_attachment && (
                    <div className="mt-2 text-xs text-emerald-600 flex items-center gap-1 bg-emerald-50 p-2 rounded border border-emerald-100">
                      <CheckCircle2 size={12} /> มีไฟล์แนบอยู่แล้ว: <a href={`${API_URL}/../${newActivity.existing_attachment}`} target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-emerald-800">เปิดดูเอกสารเดิม</a>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition" disabled={saving}>ยกเลิก</button>
                <button onClick={handleCreateActivity} disabled={saving} className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition flex items-center gap-2 ${newActivity.id ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {newActivity.id ? 'บันทึกการแก้ไข' : 'สร้างกิจกรรม'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  };



  // 4. Reports View (Combined Generator)
  const ReportsView = () => {
    const [filters, setFilters] = useState({ terms: [], activities: [], groups: [] });
    const [selectedTerm, setSelectedTerm] = useState('');
    const [selectedActivity, setSelectedActivity] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [reportData, setReportData] = useState(null);
    const [loadingFilters, setLoadingFilters] = useState(true);
    const [loadingData, setLoadingData] = useState(false);
    const [reportMode, setReportMode] = useState('single');
    const [summaryData, setSummaryData] = useState(null);
    const [attachedImages, setAttachedImages] = useState([]);
    const [signSettings, setSignSettings] = useState({ director: '', deputy: '', secretaries: {} });

    const handleImageUpload = (e) => {
      const files = Array.from(e.target.files);
      if (files.length + attachedImages.length > 4) {
        alert("แนบรูปภาพได้สูงสุด 4 ภาพครับ");
        return;
      }
      const newImages = files.map(file => URL.createObjectURL(file));
      setAttachedImages([...attachedImages, ...newImages]);
    };

    const removeImage = (index) => {
      const newImages = [...attachedImages];
      URL.revokeObjectURL(newImages[index]);
      newImages.splice(index, 1);
      setAttachedImages(newImages);
    };

    useEffect(() => {
      fetch(`${API_URL}/get_settings.php`)
        .then(res => res.json())
        .then(res => {
          if (res.status === 'success') {
            const secMap = {};
            (res.groups || []).forEach(g => {
              secMap[g.id] = res.settings[`secretary_group_${g.id}`] || '';
            });
            setSignSettings({
              director: res.settings.director_name || '',
              deputy: res.settings.deputy_director_name || '',
              secretaries: secMap
            });
          }
        })
        .catch(() => { });

      fetch(`${API_URL}/get_filters.php`)
        .then(res => res.json())
        .then(res => {
          if (res.status === 'success') {
            setFilters(res.data);
            const _term = res.data.terms.find(t => t.is_active == 1)?.id || res.data.terms[0]?.id;
            setSelectedTerm(_term);
            setSelectedActivity(res.data.activities[0]?.id || '');
            setSelectedGroup(res.data.groups[0]?.id || '');
          }
          setLoadingFilters(false);
        });
    }, []);

    const fetchReport = () => {
      if (!selectedActivity) return alert("กรุณาเลือกกิจกรรม");
      setLoadingData(true);
      fetch(`${API_URL}/get_reports.php?activity_id=${selectedActivity}&term_id=${selectedTerm}`)
        .then(res => res.json())
        .then(res => {
          if (res.status === 'success') {
            setReportData(res.data);
          }
          setLoadingData(false);
        });
    };

    const fetchSummaryReport = () => {
      if (!selectedTerm) return alert("กรุณาเลือกภาคเรียน");
      setLoadingData(true);
      fetch(`${API_URL}/get_summary_report.php?term_id=${selectedTerm}`)
        .then(res => res.json())
        .then(res => {
          if (res.status === 'success') {
            setSummaryData(res.data);
          } else {
            alert('เกิดข้อผิดพลาด: ' + res.message);
          }
          setLoadingData(false);
        }).catch(err => {
          console.error(err);
          setLoadingData(false);
          alert('ไม่สามารถดึงข้อมูลได้');
        });
    };

    const handleExportExcel = () => {
      if (!reportData) return;
      const ws_data = [
        ["ระบบรายงานผลการเข้าร่วมกิจกรรมกลุ่ม"],
        ["กิจกรรม:", reportData.activity.name, "วันที่:", reportData.activity.date],
        ["กลุ่ม:", reportData.group.name, "ภาคเรียน:", reportData.term.term],
        [],
        ["ลำดับ", "รหัส", "ชื่อ-สกุล", "ตำแหน่ง", "สถานะ", "หมายเหตุ"]
      ];

      reportData.staffList.forEach((row, index) => {
        const statusTxt = row.status === 'present' ? 'มา' : row.status === 'leave' ? 'ลา' : 'ขาด';
        ws_data.push([
          index + 1, row.code, row.name, row.position, statusTxt, row.remark
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(ws_data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Attendance Report");
      XLSX.writeFile(wb, `attendance_report_${reportData.activity.name}.xlsx`);
    };

    const handleExportSummaryExcel = () => {
      if (!summaryData) return;
      const ws_data = [
        ["รายงานสรุปภาพรวมรายบุคคล"],
        ["ภาคเรียน:", summaryData.term],
        [],
        ["ลำดับ", "รหัส", "ชื่อ-สกุล", "ตำแหน่ง", "กลุ่ม", "จำนวนกิจกรรม(ครั้ง)", "เข้าร่วม(ครั้ง)", "ไม่เข้าร่วม(ครั้ง)", "หมายเหตุ"]
      ];

      summaryData.report.forEach((row, index) => {
        ws_data.push([
          index + 1, row.code, row.name, row.position, row.group_name, 
          row.total_acts, row.attended, row.missed, row.remark_text
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(ws_data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Summary Report");
      XLSX.writeFile(wb, `summary_report_${summaryData.term.replace(/\//g, '-')}.xlsx`);
    };

    const handlePrint = () => {
      const originalTitle = document.title;
      if (reportData && reportData.activity && reportData.activity.name) {
        document.title = reportData.activity.name;
      }
      setTimeout(() => {
        window.print();
        document.title = originalTitle;
      }, 100);
    };

    const handleLockActivity = () => {
      if (!reportData || !reportData.activity || !reportData.activity.id) {
        return alert('กรุณาดึงข้อมูลรายงานก่อนทำการล็อค');
      }
      const activityId = parseInt(reportData.activity.id);
      if (!activityId) return alert('ไม่พบรหัสกิจกรรม กรุณาลองใหม่อีกครั้ง');
      if (!confirm('ยืนยันล็อคกิจกรรมนี้?\nหลังจากล็อคแล้วจะไม่สามารถแก้ไขข้อมูลการเข้าร่วมได้อีก')) return;
      fetch(`${API_URL}/lock_activity.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activityId })
      })
        .then(res => res.json())
        .then(res => {
          if (res.status === 'success') {
            // Increment global key so ActivitiesView re-fetches and shows locked status
            setActivitiesRefreshKey(k => k + 1);
            alert('✅ กิจกรรมถูกล็อคเรียบร้อยแล้ว ไม่สามารถแก้ไขข้อมูลได้อีก');
          } else {
            alert('เกิดข้อผิดพลาด: ' + res.message);
          }
        })
        .catch(() => alert('ไม่สามารถเชื่อมต่อ server ได้'));
    };

    if (loadingFilters) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>;

    return (
      <div className="space-y-6 animate-fade-in pb-12 print-container">
        {/* Header & Actions */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 no-print">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <FileText className="text-blue-600" />
              ออกรายงานผลการเข้าร่วมกิจกรรม
            </h2>
            <div className="flex items-center gap-2 mt-2 bg-slate-100 p-1 rounded-lg w-max">
              <button onClick={() => { setReportMode('single'); setReportData(null); setSummaryData(null); }} className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${reportMode === 'single' ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:bg-slate-200'}`}>รายงานรายกิจกรรม</button>
              <button onClick={() => { setReportMode('summary'); setReportData(null); setSummaryData(null); }} className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${reportMode === 'summary' ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:bg-slate-200'}`}>รายงานสรุปภาพรวมรายบุคคล</button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full xl:w-auto mt-4 xl:mt-0">
            <button onClick={reportMode === 'single' ? handleExportExcel : handleExportSummaryExcel} disabled={reportMode === 'single' ? !reportData : !summaryData} className="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition font-medium disabled:opacity-50">
              <FileSpreadsheet size={18} />
              <span className="whitespace-nowrap">Excel</span>
            </button>
            {reportMode === 'single' && reportData?.activity?.attachment_path && (
              <a href={`${API_URL}/../${reportData.activity.attachment_path}`} target="_blank" rel="noopener noreferrer" className="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg border border-blue-200 hover:bg-blue-100 transition font-medium">
                <Paperclip size={18} />
                <span className="whitespace-nowrap">ดูเอกสารแนบ</span>
              </a>
            )}
            <button onClick={handlePrint} disabled={reportMode === 'single' ? !reportData : !summaryData} className="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-slate-900 transition font-medium disabled:opacity-50">
              <Printer size={18} />
              <span className="whitespace-nowrap">พิมพ์ / PDF</span>
            </button>
            {reportMode === 'single' && (
              <button onClick={handleLockActivity} disabled={!reportData} className="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-rose-700 transition font-medium disabled:opacity-50">
                <Lock size={18} />
                <span className="whitespace-nowrap">ล็อคกิจกรรม</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters */}
          <div className="lg:col-span-1 space-y-6 no-print">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold border-b pb-2">
                <Filter size={18} />
                <h3>ตัวกรองข้อมูล</h3>
              </div>
              <div className="space-y-4 text-sm">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">ภาคเรียน</label>
                  <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 outline-none">
                    {filters.terms.map(t => <option key={t.id} value={t.id}>{t.term_name}</option>)}
                  </select>
                </div>
                {reportMode === 'single' && (
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">กิจกรรม</label>
                    <select value={selectedActivity} onChange={e => setSelectedActivity(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 outline-none">
                      {filters.activities.map(a => <option key={a.id} value={a.id}>{a.activity_name}</option>)}
                    </select>
                  </div>
                )}
                <button onClick={reportMode === 'single' ? fetchReport : fetchSummaryReport} className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition mt-2 shadow-sm flex justify-center">
                  {loadingData ? <Loader2 className="animate-spin" size={20} /> : "ดึงข้อมูลรายงาน"}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 no-print">
              <div className="flex items-center justify-between mb-4 text-slate-800 font-bold border-b pb-2">
                <div className="flex items-center gap-2">
                  <Upload size={18} />
                  <h3>ภาพประกอบรายงาน ({attachedImages.length}/4)</h3>
                </div>
              </div>
              <div className="space-y-4">
                <label className="flex items-center justify-center w-full h-24 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition">
                  <div className="flex flex-col items-center justify-center">
                    <Plus size={24} className="text-slate-400 mb-1" />
                    <p className="text-xs text-slate-500 font-medium">คลิกเลือกภาพ (สูงสุด 4 ภาพ)</p>
                  </div>
                  <input type="file" className="hidden" multiple accept="image/*" onChange={handleImageUpload} disabled={attachedImages.length >= 4} />
                </label>
                {attachedImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {attachedImages.map((src, idx) => (
                      <div key={idx} className="relative group">
                        <img src={src} className="w-full h-20 object-cover rounded-lg border border-slate-200" alt={`แนบ ${idx + 1}`} />
                        <button onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition shadow-sm">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {reportMode === 'single' && reportData && (
              <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
                <h3 className="text-sm font-bold text-blue-900 mb-3">สรุปข้อมูลเบื้องต้น</h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="flex justify-between"><span>ทั้งหมด:</span> <span className="font-bold">{reportData.staffList.length} คน</span></div>
                  <div className="flex justify-between"><span>มาเข้าร่วม:</span> <span className="font-bold text-emerald-600">{reportData.staffList.filter(s => s.status === 'present').length} คน</span></div>
                  <div className="flex justify-between"><span>ลา/ขาด:</span> <span className="font-bold text-rose-600">{reportData.staffList.filter(s => s.status !== 'present').length} คน</span></div>
                </div>
              </div>
            )}
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-3 overflow-x-auto bg-slate-200 p-4 md:p-8 rounded-xl border border-slate-300 flex flex-col items-center justify-start gap-8">
            {reportMode === 'single' ? (
              !reportData ? (
                <div className="text-slate-500 py-20 flex flex-col items-center">
                  <FileText size={48} className="mb-4 text-slate-400" />
                  <p>เลือกตัวกรองแล้วกด "ดึงข้อมูลรายงาน"</p>
                </div>
              ) : (
                <>
                <div className="bg-white shadow-lg min-w-[700px] max-w-[800px] text-slate-900 font-serif relative shrink-0 print-page w-full mx-auto">
                  <table className="w-full border-0">
                    <thead className="hidden print:table-header-group">
                      <tr><td className="border-0 p-0"><div className="h-[1.5cm] bg-transparent"></div></td></tr>
                    </thead>
                    <tfoot className="hidden print:table-footer-group">
                      <tr><td className="border-0 p-0"><div className="h-[1.5cm] bg-transparent"></div></td></tr>
                    </tfoot>
                    <tbody className="border-0">
                      <tr>
                        <td className="border-0 p-10 md:p-14 print:p-0 align-top">
                          {/* Header */}
                          <div className="text-center mb-8 print:mb-4">
                            <div className="flex justify-center mb-4 print:mb-2">
                              <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Logo" className="w-20 h-20 md:w-24 md:h-24 object-contain print:w-20 print:h-20" />
                            </div>
                            <h2 className="text-xl font-bold mb-1">แบบรายงานผลการเข้าร่วมกิจกรรมกลุ่ม</h2>
                            <h3 className="text-lg font-bold mb-4 print:mb-2">วิทยาลัยสารพัดช่างน่าน</h3>
                            <div className="text-sm space-y-2 print:space-y-1">
                              <p>กิจกรรม: <span className="border-b border-dotted border-slate-500 inline-block min-w-[250px] text-center font-medium">{reportData.activity.name}</span></p>
                              <p className="flex justify-center gap-4">
                                <span>วันที่: <span className="border-b border-dotted border-slate-500 inline-block w-32 text-center font-medium">{reportData.activity.date}</span></span>
                                <span>ภาคเรียนที่: <span className="border-b border-dotted border-slate-500 inline-block w-24 text-center font-medium">{reportData.term.term}</span></span>
                              </p>
                              <p>กลุ่มที่รับผิดชอบ: <span className="border-b border-dotted border-slate-500 inline-block w-40 text-center font-medium">{reportData.group.name}</span></p>
                            </div>
                          </div>

                          {/* Table */}
                          <table className="w-full border-collapse border border-slate-800 mb-8 print:mb-4 text-sm print:text-xs text-black">
                            <thead className="table-header-group">
                              <tr className="bg-slate-50 print:break-inside-avoid">
                                <th className="border border-slate-800 p-2 print:p-1 print:py-0.5 w-12 text-center">ลำดับ</th>
                                <th className="border border-slate-800 p-2 print:p-1 print:py-0.5 text-center">ชื่อ - นามสกุล</th>
                                <th className="border border-slate-800 p-2 print:p-1 print:py-0.5 w-28 text-center">สถานะ</th>
                                <th className="border border-slate-800 p-2 print:p-1 print:py-0.5 text-center">ผู้มาแทน</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reportData.staffList.map((row, index) => (
                                <tr key={row.id} className="print:break-inside-avoid">
                                  <td className="border border-slate-800 p-2 print:p-1 print:py-0.5 text-center">{index + 1}</td>
                                  <td className="border border-slate-800 p-2 print:p-1 print:py-0.5 whitespace-nowrap">{row.name}</td>
                                  <td className="border border-slate-800 p-2 print:p-1 print:py-0.5 text-center font-medium">
                                    {row.status === 'present'
                                      ? <span className="text-emerald-700">เข้าร่วม</span>
                                      : <span className="text-rose-700">ขาด</span>
                                    }
                                  </td>
                                  <td className="border border-slate-800 p-2 print:p-1 print:py-0.5 text-sm">
                                    {row.proxy_name ? (
                                      <span className="text-indigo-700 font-medium">{row.proxy_name}</span>
                                    ) : ''}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {/* Summary */}
                          <div className="mb-16 print:mb-6 text-sm print:text-xs border border-slate-800 p-4 print:p-2 w-64">
                            <p className="font-bold underline mb-2 print:mb-1">สรุปผลการเข้าร่วมกิจกรรม</p>
                            <div className="grid grid-cols-2 gap-1 print:gap-0">
                              <p>ผู้มีรายชื่อทั้งหมด:</p><p className="text-right">{reportData.staffList.length} คน</p>
                              <p>มาเข้าร่วม:</p><p className="text-right">{reportData.staffList.filter(s => s.status === 'present').length} คน</p>
                              <p>ขาด:</p><p className="text-right">{reportData.staffList.filter(s => s.status !== 'present').length} คน</p>
                            </div>
                          </div>

                          {/* Signatures */}
                          <div className="grid grid-cols-3 gap-6 text-center text-sm print:text-xs pt-14 print:pt-10 break-inside-avoid items-start">
                            <div className="flex flex-col items-center">
                              <p className="mb-8 print:mb-6">..........................................</p>
                              <p>({signSettings.secretaries[reportData.activity?.group_id || ''] || ".........................................."})</p>
                              <p className="mt-2">ผู้รายงาน</p>
                            </div>
                            <div className="flex flex-col items-center">
                              <p className="mb-8 print:mb-6">..........................................</p>
                              <p className="whitespace-nowrap">({signSettings.deputy || ".........................................."})</p>
                              <p className="mt-2 whitespace-nowrap text-[13px] print:text-[11px] tracking-tight">รองผู้อำนวยการฝ่ายบริหารทรัพยากร</p>
                            </div>
                            <div className="flex flex-col items-center">
                              <p className="mb-8 print:mb-6">..........................................</p>
                              <p className="whitespace-nowrap">({signSettings.director || ".........................................."})</p>
                              <p className="mt-2 whitespace-nowrap text-[13px] print:text-[11px] tracking-tight">ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

              {/* Image Attachment Print Pages */}
              {reportData && attachedImages.length > 0 && (
                <>
                  {Array.from({ length: Math.ceil(attachedImages.length / 2) }).map((_, pageIdx) => {
                    const pageImages = attachedImages.slice(pageIdx * 2, pageIdx * 2 + 2);
                    return (
                      <div key={`img-page-${pageIdx}`} className="bg-white shadow-lg min-w-[700px] max-w-[800px] p-10 md:p-14 text-slate-900 font-serif relative shrink-0 print-page" style={{ pageBreakBefore: 'always' }}>
                        <h3 className="text-xl font-bold mb-6 text-center">ภาพบรรยากาศ {reportData.activity.name}</h3>
                        <div className="flex flex-col gap-6 items-center w-full">
                          {pageImages.map((src, imgIdx) => (
                            <img key={imgIdx} src={src} className="w-full object-contain border-2 border-slate-200 rounded max-h-[450px]" alt={`ภาพบรรยากาศ ${pageIdx * 2 + imgIdx + 1}`} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
                </>
              )
            ) : (
              !summaryData ? (
                <div className="text-slate-500 py-20 flex flex-col items-center">
                  <FileText size={48} className="mb-4 text-slate-400" />
                  <p>เลือกตัวกรองแล้วกด "ดึงข้อมูลรายงาน"</p>
                </div>
              ) : (
                <div className="bg-white shadow-lg min-w-[700px] w-full max-w-5xl text-slate-900 font-sans relative shrink-0 print-page mx-auto">
                  <table className="w-full border-0">
                    <thead className="hidden print:table-header-group">
                      <tr><td className="border-0 p-0"><div className="h-[1.5cm] bg-transparent"></div></td></tr>
                    </thead>
                    <tfoot className="hidden print:table-footer-group">
                      <tr><td className="border-0 p-0"><div className="h-[1.5cm] bg-transparent"></div></td></tr>
                    </tfoot>
                    <tbody className="border-0">
                      <tr>
                        <td className="border-0 p-6 md:p-14 print:p-0 align-top">
                          {/* Header */}
                          <div className="text-center mb-8 print:mb-4">
                            <h2 className="text-xl font-bold mb-2">รายงานสรุปภาพรวมการเข้าร่วมกิจกรรมรายบุคคล</h2>
                            <h3 className="text-lg font-bold mb-4 print:mb-2">วิทยาลัยสารพัดช่างน่าน</h3>
                            <div className="text-sm space-y-2 print:space-y-1 mt-4">
                              <p>ประจำภาคเรียนที่: <span className="border-b border-dotted border-slate-500 inline-block px-10 text-center font-medium">{summaryData.term}</span></p>
                            </div>
                          </div>

                          {/* Table */}
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-slate-800 mb-8 text-sm print:text-xs">
                              <thead className="table-header-group">
                                <tr className="bg-slate-100 text-slate-800 print:break-inside-avoid">
                                  <th className="border border-slate-800 p-2 print:p-1 text-center w-12">ลำดับ</th>
                                  <th className="border border-slate-800 p-2 print:p-1 min-w-[150px]">ชื่อ - สกุล</th>
                                  <th className="border border-slate-800 p-2 print:p-1 text-center w-14">กลุ่ม</th>
                                  <th className="border border-slate-800 p-2 print:p-1 text-center w-24">กิจกรรมรวม<br/>(ครั้ง)</th>
                                  <th className="border border-slate-800 p-2 print:p-1 text-center w-24 text-emerald-700">เข้าร่วม<br/>(ครั้ง)</th>
                                  <th className="border border-slate-800 p-2 print:p-1 text-center w-24 text-rose-700">ไม่เข้าร่วม<br/>(ครั้ง)</th>
                                  <th className="border border-slate-800 p-2 print:p-1 min-w-[150px]">หมายเหตุ</th>
                                </tr>
                              </thead>
                              <tbody>
                                {summaryData.report.map((row, index) => (
                                  <tr key={index} className="hover:bg-slate-50 align-top print:break-inside-avoid">
                                    <td className="border border-slate-800 p-2 print:p-1 text-center">{index + 1}</td>
                                    <td className="border border-slate-800 p-2 print:p-1 whitespace-nowrap overflow-hidden text-ellipsis">
                                      <span className="font-bold print:font-medium">{row.name}</span>
                                    </td>
                                    <td className="border border-slate-800 p-2 text-center font-medium text-slate-700">{row.group_name ? row.group_name.replace(/กลุ่ม\s*/g, '') || 'ไม่มี' : 'ไม่มี'}</td>
                                    <td className="border border-slate-800 p-2 text-center font-bold text-blue-800 bg-blue-50/30">{row.total_acts}</td>
                                    <td className="border border-slate-800 p-2 text-center font-bold text-emerald-600 bg-emerald-50/30">{row.attended}</td>
                                    <td className="border border-slate-800 p-2 text-center font-bold text-rose-600 bg-rose-50/30">{row.missed}</td>
                                    <td className="border border-slate-800 p-2 text-[11px] text-indigo-700 leading-normal">
                                      {row.remark_text}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Activity Summary per Group */}
                          {summaryData.activity_summary && Object.keys(summaryData.activity_summary).length > 0 && (
                            <div className="mt-8 print:mt-6 border border-slate-300 print:border-slate-800 p-4 rounded-lg print:rounded-none bg-slate-50 print:bg-transparent text-sm print:text-xs page-break-inside-avoid">
                              <p className="font-bold mb-3 underline">สรุปรายละเอียดกิจกรรมที่นำมาคำนวณแยกตามกลุ่มสังกัด</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                                {Object.entries(summaryData.activity_summary).map(([groupName, acts], idx) => (
                                  <div key={idx} className="break-inside-avoid">
                                    <p className="font-medium text-indigo-800 print:text-black border-b border-slate-200 print:border-slate-400 pb-1 mb-2">{groupName} <span className="text-[11px] text-slate-500 print:text-slate-700 font-normal">({acts.length} กิจกรรม)</span></p>
                                    <ul className="list-disc pl-5 text-[13px] print:text-[11px] text-slate-700 print:text-black space-y-0.5">
                                      {acts.map((actName, i) => (
                                        <li key={i}>{actName}</li>
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  // 4. Group Management View
  const GroupManagementView = () => {
    const [allStaff, setAllStaff] = useState([]);
    const [allGroups, setAllGroups] = useState([]);
    const [newGroupName, setNewGroupName] = useState('');
    const [editingGroupId, setEditingGroupId] = useState(null);
    const [editGroupForm, setEditGroupForm] = useState('');

    const fetchAllGroups = () => {
      fetch(`${API_URL}/get_all_groups.php`).then(res => res.json()).then(res => {
        if (res.status === 'success') setAllGroups(res.data);
      }).catch(console.error);
    };

    const fetchAllStaff = () => {
      fetch(`${API_URL}/get_all_staff.php`).then(res => res.json()).then(res => {
        if (res.status === 'success') setAllStaff(res.data);
      }).catch(console.error);
    };

    useEffect(() => {
      fetchAllStaff();
      fetchAllGroups();
    }, []);

    const handleSaveGroup = (id, saveName) => {
      if (!saveName || saveName.trim() === '') return alert('กรุณากรอกชื่อกลุ่ม');
      fetch(`${API_URL}/save_group.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: saveName.trim() })
      }).then(res => res.json()).then(res => {
        if (res.status === 'success') {
          setEditingGroupId(null);
          setNewGroupName('');
          fetchAllGroups();
        } else alert('ข้อผิดพลาด: ' + res.message);
      }).catch(console.error);
    };

    const handleDeleteGroup = (id) => {
      if (!confirm('ยืนยันลบกลุ่มสังกัดนี้? (ลบได้เฉพาะกลุ่มที่ไม่มีบุคลากรอยู่)')) return;
      fetch(`${API_URL}/delete_single_group.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      }).then(res => res.json()).then(res => {
        if (res.status === 'success') fetchAllGroups();
        else alert('ลบไม่สำเร็จ: ' + res.message);
      }).catch(console.error);
    };

    const handleAssignStaff = (staffId, groupId) => {
      fetch(`${API_URL}/assign_staff_group.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_id: staffId, group_id: groupId })
      }).then(res => res.json()).then(res => {
        if (res.status === 'success') fetchAllStaff();
        else alert('ข้อผิดพลาด: ' + res.message);
      }).catch(console.error);
    };

    const handleRemoveStaff = (staffId, groupId) => {
      fetch(`${API_URL}/remove_staff_from_group.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_id: staffId, group_id: groupId })
      }).then(res => res.json()).then(res => {
        if (res.status === 'success') fetchAllStaff();
        else alert('ข้อผิดพลาด: ' + res.message);
      }).catch(console.error);
    };

    // Prepare data
    const groupedStaff = { null: [] };
    allGroups.forEach(g => { groupedStaff[g.id] = []; });
    allStaff.forEach(s => {
      const groupIds = s.group_ids ? s.group_ids.split(',').map(Number) : [];
      if (groupIds.length > 0) {
        groupIds.forEach(gid => {
          if (groupedStaff[gid]) groupedStaff[gid].push(s);
        });
      } else {
        groupedStaff.null.push(s);
      }
    });

    return (
      <div className="space-y-6 animate-fade-in pb-12">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Users className="text-blue-500" /> จัดการกลุ่มและสมาชิก</h2>
              <p className="text-sm text-slate-500 mt-1">บริหารจัดการกลุ่ม สร้าง, แก้ไข หรือโยกย้ายบุคลากรเข้าในกลุ่มต่างๆ</p>
            </div>
            <div className="flex gap-2">
              <input type="text" className="border border-slate-300 rounded px-3 py-2 text-sm max-w-xs" placeholder="ชื่อกลุ่มใหม่..." value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
              <button onClick={() => handleSaveGroup(null, newGroupName)} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded font-bold transition flex items-center gap-1 shadow-sm"><Plus size={16} /> สร้างกลุ่ม</button>
            </div>
          </div>

          <div className="p-6 bg-slate-50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              {/* Unassigned Card */}
              <div className="bg-white rounded-xl border-t-4 border-t-amber-400 border-x border-b border-slate-200 shadow-sm flex flex-col h-[500px]">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-700 flex items-center gap-2">ไม่ได้สังกัดกลุ่ม</h3>
                  <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">{groupedStaff.null.length} คน</span>
                </div>
                <div className="p-4 flex-1 overflow-y-auto bg-slate-50/30">
                  {groupedStaff.null.map(s => (
                    <div key={s.id} className="flex justify-between items-center p-2 mb-2 bg-white border border-slate-100 rounded shadow-sm group">
                      <div className="truncate pr-2">
                        <p className="text-sm font-semibold text-slate-700 truncate">{s.name}</p>
                        <p className="text-xs text-slate-400">{s.position || '-'}</p>
                      </div>
                    </div>
                  ))}
                  {groupedStaff.null.length === 0 && <p className="text-xs text-slate-400 text-center mt-4">ไม่มีผู้ที่ไม่ได้สังกัดกลุ่ม</p>}
                </div>
              </div>

              {/* Group Cards */}
              {allGroups.map(g => (
                <div key={g.id} className="bg-white rounded-xl border-t-4 border-t-blue-500 border-x border-b border-slate-200 shadow-sm flex flex-col h-[500px]">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-2 relative group-header">
                    {editingGroupId === g.id ? (
                      <div className="flex gap-1">
                        <input autoFocus className="flex-1 border rounded px-2 py-1 text-sm bg-blue-50" value={editGroupForm} onChange={e => setEditGroupForm(e.target.value)} />
                        <button onClick={() => handleSaveGroup(g.id, editGroupForm)} className="p-1 px-2 text-emerald-600 hover:bg-emerald-100 rounded text-xs font-bold">บันทึก</button>
                        <button onClick={() => setEditingGroupId(null)} className="p-1 px-2 text-slate-500 hover:bg-slate-200 rounded text-xs">ยกเลิก</button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-slate-700 truncate">{g.group_name}</h3>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">{groupedStaff[g.id].length} คน</span>
                          <button onClick={() => { setEditingGroupId(g.id); setEditGroupForm(g.group_name); }} className="p-1 text-blue-400 hover:text-blue-600"><Edit size={14} /></button>
                          <button onClick={() => handleDeleteGroup(g.id)} className="p-1 text-red-400 hover:text-red-600"><Trash size={14} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1 overflow-y-auto">
                    {groupedStaff[g.id].map(s => (
                      <div key={s.id} className="flex justify-between items-center p-2 mb-2 bg-slate-50 border border-slate-100 rounded group">
                        <div className="truncate pr-2">
                          <p className="text-sm font-semibold text-slate-700 truncate">
                            {s.name}
                            {s.group_ids && s.group_ids.split(',').length > 1 && <span className="ml-1 text-[10px] bg-slate-200 text-slate-500 px-1.5 rounded-full" title="อยู่หลายกลุ่ม">หลายกลุ่ม</span>}
                          </p>
                          <p className="text-xs text-slate-400">{s.position || '-'}</p>
                        </div>
                        <button onClick={() => handleRemoveStaff(s.id, g.id)} className="p-1.5 text-red-400 hover:bg-red-100 hover:text-red-600 rounded opacity-0 group-hover:opacity-100 transition" title="นำออกจากกลุ่ม"><LogOut size={14} /></button>
                      </div>
                    ))}
                    {groupedStaff[g.id].length === 0 && <p className="text-xs text-slate-400 text-center mt-4">ยังไม่มีบุคลากรในกลุ่มนี้</p>}
                  </div>
                  <div className="p-3 border-t border-slate-100 bg-slate-50 relative">
                    <input
                      list={`staff-list-${g.id}`}
                      placeholder="+ ค้นหา และ ดึงรายชื่อเข้ากลุ่ม..."
                      className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm text-slate-600 bg-white shadow-inner focus:ring-2 focus:ring-blue-100 focus:outline-none"
                      onChange={(e) => {
                        const matched = allStaff.find(s => `${s.code || ''} ${s.name} ${s.group_name ? `(${s.group_name})` : ''}`.trim() === e.target.value);
                        if (matched) {
                          handleAssignStaff(matched.id, g.id);
                          e.target.value = "";
                        }
                      }}
                    />
                    <datalist id={`staff-list-${g.id}`}>
                      {allStaff.filter(s => !(s.group_ids && s.group_ids.split(',').map(Number).includes(g.id))).map(s => (
                        <option key={s.id} value={`${s.code || ''} ${s.name} ${s.group_name ? `(${s.group_name})` : ''}`.trim()} />
                      ))}
                    </datalist>
                  </div>
                </div>
              ))}

            </div>
          </div>
        </div>
      </div>
    );
  };

  // 5. Admin Management View
  const AdminView = () => {
    const [importData, setImportData] = useState([]);
    const [isImporting, setIsImporting] = useState(false);
    const [importSuccess, setImportSuccess] = useState(null);
    const [isClearing, setIsClearing] = useState(false);

    // --- Signature & LINE Settings State ---
    const [signSettings, setSignSettings] = useState({
      director_name: '',
      deputy_director_name: ''
    });
    const [lineSettings, setLineSettings] = useState({
      line_api_enabled: false,
      line_channel_token: '',
      line_target_id: '',
      line_message_template: ''
    });
    const [reminderSettings, setReminderSettings] = useState({
      reminder_enabled: false,
      reminder_intervals: '1,3',
      reminder_time: '09:30',
      reminder_template: ''
    });
    const [signGroups, setSignGroups] = useState([]);
    const [signGroupSecretaries, setSignGroupSecretaries] = useState({}); // { "group_1": "ชื่อ..." }
    const [savingSettings, setSavingSettings] = useState(false);
    const [testingLine, setTestingLine] = useState(false);
    const [uploadingManual, setUploadingManual] = useState(false);

    const handleUploadManual = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.type !== 'application/pdf') {
        alert('กรุณาอัปโหลดเฉพาะไฟล์ PDF เท่านั้น');
        e.target.value = '';
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        alert('ไฟล์มีขนาดใหญ่เกินกว่า 20 MB');
        e.target.value = '';
        return;
      }

      setUploadingManual(true);
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch(`${API_URL}/upload_manual.php`, {
          method: 'POST',
          body: formData
        }).then(r => r.json());

        if (res.status === 'success') {
          alert('อัปโหลดคู่มือการใช้งานสำเร็จ ผู้ใช้สามารถคลิกอ่านจากเมนูด้านซ้ายได้ทันที');
        } else {
          alert('อัปโหลดล้มเหลว: ' + res.message);
        }
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
      } finally {
        setUploadingManual(false);
        e.target.value = ''; // Reset file input
      }
    };

    const fetchSettings = () => {
      fetch(`${API_URL}/get_settings.php`)
        .then(res => res.json())
        .then(res => {
          if (res.status === 'success') {
            const { 
              director_name = '', 
              deputy_director_name = '',
              line_api_enabled = 'false',
              line_channel_token = '',
              line_target_id = '',
              line_message_template = '',
              reminder_enabled = 'false',
              reminder_intervals = '1,3',
              reminder_time = '09:30',
              reminder_template = ''
            } = res.settings || {};
            setSignSettings({ director_name, deputy_director_name });
            setLineSettings({ 
              line_api_enabled: line_api_enabled === 'true', 
              line_channel_token, 
              line_target_id,
              line_message_template 
            });
            setReminderSettings({
              reminder_enabled: reminder_enabled === 'true',
              reminder_intervals,
              reminder_time,
              reminder_template
            });
            // load secretary keys for each group
            const secMap = {};
            (res.groups || []).forEach(g => {
              secMap[g.id] = res.settings[`secretary_group_${g.id}`] || '';
            });
            setSignGroupSecretaries(secMap);
            setSignGroups(res.groups || []);
          }
        });
    };

    const handleSaveSettings = () => {
      setSavingSettings(true);
      const payload = {
        director_name: signSettings.director_name,
        deputy_director_name: signSettings.deputy_director_name,
        line_api_enabled: lineSettings.line_api_enabled ? 'true' : 'false',
        line_channel_token: lineSettings.line_channel_token,
        line_target_id: lineSettings.line_target_id,
        line_message_template: lineSettings.line_message_template,
        reminder_enabled: reminderSettings.reminder_enabled ? 'true' : 'false',
        reminder_intervals: reminderSettings.reminder_intervals,
        reminder_time: reminderSettings.reminder_time,
        reminder_template: reminderSettings.reminder_template
      };
      Object.entries(signGroupSecretaries).forEach(([gid, name]) => {
        payload[`secretary_group_${gid}`] = name;
      });
      fetch(`${API_URL}/save_settings.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: payload })
      })
        .then(res => res.json())
        .then(res => {
          setSavingSettings(false);
          if (res.status === 'success') alert('✅ บันทึกการตั้งค่าเรียบร้อยแล้ว');
          else alert('เกิดข้อผิดพลาด: ' + res.message);
        });
    };

    const handleTestLineAPI = () => {
      if (!lineSettings.line_channel_token) {
        alert("กรุณากรอก Channel Access Token ก่อนทดสอบ");
        return;
      }
      setTestingLine(true);
      fetch(`${API_URL}/test_line_api.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: lineSettings.line_channel_token,
          target_id: lineSettings.line_target_id
        })
      })
      .then(res => res.json())
      .then(res => {
        setTestingLine(false);
        if (res.status === 'success') alert(res.message);
        else alert('เกิดข้อผิดพลาด: ' + res.message);
      })
      .catch(() => {
        setTestingLine(false);
        alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
      });
    };

    // --- Staff Management State ---
    const [allStaff, setAllStaff] = useState([]);
    const [editingStaffId, setEditingStaffId] = useState(null);
    const [editForm, setEditForm] = useState({ code: '', name: '', position: '', group_id: '' });
    const [newStaffForm, setNewStaffForm] = useState({ code: '', name: '', position: '' });
    const [isAddingStaff, setIsAddingStaff] = useState(false);

    // --- Term Management State ---
    const [adminTerms, setAdminTerms] = useState([]);
    const [newTermName, setNewTermName] = useState('');
    const [editingTermId, setEditingTermId] = useState(null);
    const [editTermForm, setEditTermForm] = useState('');

    const fetchAdminTerms = () => {
      fetch(`${API_URL}/get_all_terms.php`)
        .then(res => res.json())
        .then(res => {
          if (res.status === 'success') {
            setAdminTerms(res.data);
          }
        }).catch(console.error);
    };

    // --- Group Management State ---
    const [allGroups, setAllGroups] = useState([]);
    const [editingGroupId, setEditingGroupId] = useState(null);
    const [newGroupName, setNewGroupName] = useState('');
    const [editGroupForm, setEditGroupForm] = useState('');

    const fetchAllGroups = () => {
      fetch(`${API_URL}/get_all_groups.php`)
        .then(res => res.json())
        .then(res => {
          if (res.status === 'success') {
            setAllGroups(res.data);
          }
        }).catch(console.error);
    };

    const fetchAllStaff = () => {
      fetch(`${API_URL}/get_all_staff.php`)
        .then(res => res.json())
        .then(res => {
          if (res.status === 'success') {
            setAllStaff(res.data);
          }
        }).catch(console.error);
    };

    useEffect(() => {
      fetchAllStaff();
      fetchAllGroups();
      fetchSettings();
      fetchAdminTerms();
    }, []);

    const handleDeleteStaff = (id) => {
      if (!confirm('ยุติบยืนยันลบข้อมูลพนักงานรายนี้ และลบประวัติกิจกรรมทั้งหมดของพนักงานนี้ด้วย?')) return;
      fetch(`${API_URL}/delete_single_staff.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      }).then(res => res.json()).then(res => {
        if (res.status === 'success') fetchAllStaff();
        else alert('ลบไม่สำเร็จ: ' + res.message);
      }).catch(console.error);
    };

    const handleSaveEdit = () => {
      fetch(`${API_URL}/update_staff.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingStaffId, ...editForm })
      }).then(res => res.json()).then(res => {
        if (res.status === 'success') {
          setEditingStaffId(null);
          fetchAllStaff();
        } else {
          alert('แก้ไขไม่สำเร็จ: ' + res.message);
        }
      }).catch(console.error);
    };

    const handleAddStaff = () => {
      if (!newStaffForm.code.trim() || !newStaffForm.name.trim()) return alert("กรุณากรอกรหัสและชื่อบุคลากรให้ครบถ้วน");
      setIsAddingStaff(true);
      fetch(`${API_URL}/add_staff.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStaffForm)
      }).then(res => res.json()).then(res => {
        setIsAddingStaff(false);
        if (res.status === 'success') {
          setNewStaffForm({ code: '', name: '', position: '' });
          fetchAllStaff();
        } else alert('ข้อผิดพลาด: ' + res.message);
      }).catch(err => {
        setIsAddingStaff(false);
        console.error(err);
      });
    };

    const handleSaveGroup = (id, saveName) => {
      if (!saveName || saveName.trim() === '') return alert('กรุณากรอกชื่อกลุ่ม');
      fetch(`${API_URL}/save_group.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: saveName.trim() })
      }).then(res => res.json()).then(res => {
        if (res.status === 'success') {
          setEditingGroupId(null);
          setNewGroupName('');
          fetchAllGroups();
        } else alert('ข้อผิดพลาด: ' + res.message);
      }).catch(console.error);
    };

    const handleDeleteGroup = (id) => {
      if (!confirm('ยืนยันลบกลุ่มสังกัดนี้? (ลบได้เฉพาะกลุ่มที่ไม่มีบุคลากรอยู่)')) return;
      fetch(`${API_URL}/delete_single_group.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      }).then(res => res.json()).then(res => {
        if (res.status === 'success') fetchAllGroups();
        else alert('ลบไม่สำเร็จ: ' + res.message);
      }).catch(console.error);
    };

    const handleClearData = () => {
      if (!confirm("⚠️ คำเตือน! การกระทำนี้จะลบ 'รายชื่อพนักงานและกลุ่ม' ตลอดจน 'การเช็คชื่อทั้งหมด' ออกจากระบบ (กู้คืนไม่ได้)\nคุณแน่ใจหรือไม่?")) return;

      setIsClearing(true);
      fetch(`${API_URL}/clear_staff.php`)
        .then(res => res.json())
        .then(res => {
          setIsClearing(false);
          if (res.status === 'success') {
            alert('✔️ ' + res.message);
            setImportData([]);
            setImportSuccess(null);
            setSyncError(null);
            fetchAllStaff();
          } else {
            alert("ข้อผิดพลาด: " + res.message);
          }
        })
        .catch(err => {
          setIsClearing(false);
          alert("เชื่อมต่อเซิร์ฟเวอร์ล้มเหลว: " + err.message);
        });
    };

    const handleSaveTerm = (id, saveName) => {
      if (!saveName || saveName.trim() === '') return alert('กรุณากรอกชื่อภาคเรียน');
      fetch(`${API_URL}/save_term.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, term_name: saveName.trim() })
      }).then(res => res.json()).then(res => {
        if (res.status === 'success') {
          setEditingTermId(null);
          setNewTermName('');
          fetchAdminTerms();
        } else alert('ข้อผิดพลาด: ' + res.message);
      }).catch(console.error);
    };

    const handleDeleteTerm = (id) => {
      if (!confirm('ยืนยันประสงค์จะลบภาคเรียนนี้ออกหรือไม่? ระบบจะไม่อนุญาตถ้าภาคเรียนนี้ถูกใช้งานอยู่หรือเป็นภาคเรียนปัจจุบัน')) return;
      fetch(`${API_URL}/delete_term.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      }).then(res => res.json()).then(res => {
        if (res.status === 'success') fetchAdminTerms();
        else alert('ลบไม่สำเร็จ: ' + res.message);
      }).catch(console.error);
    };

    const handleSetActiveTerm = (id) => {
      if (!confirm('ต้องการเปลี่ยนภาคเรียนนี้เป็นภาคเรียนปัจจุบันหรือไม่? ระบบจะใช้อ้างอิงการแสดงผลหน้าแดชบอร์ดและการเช็คชื่อใหม่')) return;
      fetch(`${API_URL}/set_active_term.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      }).then(res => res.json()).then(res => {
        if (res.status === 'success') fetchAdminTerms();
        else alert('ตั้งค่าไม่สำเร็จ: ' + res.message);
      }).catch(console.error);
    };

    const handleFileUpload = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        // Convert array of arrays to json
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

        // Assume first row is header. Columns: รหัสประจำตัว, ชื่อ-นามสกุล, ตำแหน่ง, ชื่อกลุ่ม
        const rows = data.slice(1);

        const parsed = rows.map(r => ({
          code: r[0] ? String(r[0]).trim() : '',
          name: r[1] ? String(r[1]).trim() : '',
          position: r[2] ? String(r[2]).trim() : '',
          group_name: r[3] ? String(r[3]).trim() : ''
        })).filter(r => r.code && r.name); // Ignore empty rows

        setImportData(parsed);
        setImportSuccess(null);
      };
      reader.readAsBinaryString(file);
    };

    const confirmImport = () => {
      if (importData.length === 0) return;
      setIsImporting(true);

      fetch(`${API_URL}/import_staff.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(importData)
      })
        .then(res => res.json())
        .then(res => {
          setIsImporting(false);
          if (res.status === 'success') {
            setImportSuccess(res.message);
            setImportData([]); // Clear preview
            fetchAllStaff();
          } else {
            alert('เกิดข้อผิดพลาด: ' + (res.message || 'ในการนำเข้าข้อมูล'));
          }
        })
        .catch(err => {
          setIsImporting(false);
          alert('เชื่อมต่อเซิร์ฟเวอร์นำเข้าล้มเหลว');
        });
    };

    const [kcConfig, setKcConfig] = useState({
      url: 'http://service.npc.ac.th',
      realm: 'NPC-SSO',
      client_id: 'apr-app',
      client_secret: 'foJMT0AEt1yNlFAtaqouuYQbhp4iCcVc'
    });
    const [isSyncingKc, setIsSyncingKc] = useState(false);
    const [syncError, setSyncError] = useState(null);

    const handleSyncKeycloak = () => {
      setIsSyncingKc(true);
      setImportSuccess(null);
      setSyncError(null);
      fetch(`${API_URL}/sync_keycloak.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kcConfig)
      })
        .then(res => res.text()) // Get raw text first to debug
        .then(text => {
          console.log("Raw Keycloak Sync Response:", text);
          try {
            return JSON.parse(text);
          } catch (e) {
            throw new Error("Invalid JSON: " + text);
          }
        })
        .then(res => {
          setIsSyncingKc(false);
          if (res.status === 'success') {
            if (res.data && res.data.length > 0) {
              setImportData(res.data);
              setImportSuccess(res.message + ' กรุณาตรวจสอบข้อมูลในตารางพรีวิวก่อนกดยืนยันการนำเข้า');
            } else {
              setSyncError('ดึงข้อมูลสำเร็จแต่ไม่พบผู้ใช้งาน (Users = 0) ใน Keycloak Realm นี้');
            }
          } else {
            setSyncError('เกิดข้อผิดพลาดจาก Keycloak: ' + res.message);
          }
        })
        .catch(err => {
          setIsSyncingKc(false);
          console.error(err);
          setSyncError('เชื่อมต่อเซิร์ฟเวอร์ซิงค์ Keycloak ล้มเหลว: ' + err.message);
        });
    };

    return (
      <div className="space-y-6 animate-fade-in pb-12">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-800">ระบบตั้งค่าผู้ดูแลระบบ (Admin)</h2>
              <p className="text-sm text-slate-500 mt-1">จัดการเครื่องมือ ระบบนำเข้าข้อมูลบุคลากร และอนาคต</p>
            </div>
            <Settings className="text-slate-400" size={32} />
          </div>

          <div className="p-6 md:p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <UploadCloud className="text-blue-500" />
              นำเข้าข้อมูลบุคลากร (ทางเลือกที่ 1: ใช้ Excel)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-700 mb-2">โครงสร้างไฟล์ที่รองรับ (.xlsx, .xls)</h4>
                <p className="text-sm text-slate-600 mb-4">
                  ไฟล์ Excel แผ่นแรก (Sheet 1) จะต้องมีการจัดเรียงคอลัมน์จากซ้ายไปขวาดังนี้:
                </p>
                <ul className="text-sm space-y-2 text-slate-600 list-disc ml-5 mb-4 font-medium">
                  <li>คอลัมน์ A: รหัสประจำตัว <span className="font-normal text-slate-400">(101)</span></li>
                  <li>คอลัมน์ B: ชื่อ-นามสกุล <span className="font-normal text-slate-400">(นายสมชาย ใจดี)</span></li>
                  <li>คอลัมน์ C: ตำแหน่ง <span className="font-normal text-slate-400">(ครูผู้สอน)</span></li>
                  <li>คอลัมน์ D: ชื่อกลุ่มที่สังกัด <span className="font-normal text-slate-400">(กลุ่ม 1)</span></li>
                </ul>
              </div>

              <div className="flex flex-col justify-center">
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-blue-300 border-dashed rounded-xl cursor-pointer bg-blue-50 hover:bg-blue-100 transition">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FileUp size={36} className="text-blue-500 mb-3" />
                    <p className="mb-2 text-sm text-blue-700"><span className="font-bold">คลิกอัปโหลดไฟล์</span> หรือลากไฟล์มาวางที่นี่</p>
                  </div>
                  <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
                </label>
                {importSuccess && (
                  <div className="mt-4 p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm flex items-center justify-center gap-2 font-medium">
                    <CheckCircle2 size={18} /> {importSuccess}
                  </div>
                )}
              </div>
            </div>



            {/* Preview Table */}
            {importData.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden animate-fade-in">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center flex-wrap gap-4">
                  <p className="font-bold text-slate-700">พรีวิวข้อมูลที่จะนำเข้า: <span className="text-blue-600">{importData.length} รายการ</span></p>
                  <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={() => setImportData([])} className="flex-1 md:flex-none px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition">
                      ยกเลิก
                    </button>
                    <button onClick={confirmImport} disabled={isImporting} className="flex-1 md:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2">
                      {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      ยืนยันการนำเข้า
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 border-b">รหัส</th>
                        <th className="px-6 py-3 border-b">ชื่อ-สกุล</th>
                        <th className="px-6 py-3 border-b">ตำแหน่ง</th>
                        <th className="px-6 py-3 border-b">ชื่อกลุ่ม</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importData.map((row, idx) => (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-6 py-3">{row.code}</td>
                          <td className="px-6 py-3">{row.name}</td>
                          <td className="px-6 py-3">{row.position}</td>
                          <td className="px-6 py-3">{row.group_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <hr className="border-slate-200 my-10" />

            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Users className="text-blue-500" />
              จัดการแฟ้มประวัติบุคลากรในระบบ ({allStaff.length} คน)
            </h3>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-10 shadow-sm animate-fade-in">
              {/* Form Add Staff Manual - Removed as handled by Keycloak */}
              <div className="p-4 bg-blue-50/50 border-b border-slate-200 flex items-center gap-2">
                <ShieldCheck className="text-blue-500" size={18} />
                <span className="text-sm font-medium text-blue-800">
                  รายชื่อบุคลากรถูกจัดการผ่านระบบ Keycloak ศูนย์กลางของวิทยาลัยฯ หากไม่มีชื่อกรุณาติดต่อผู้ดูแลระบบ (IT)
                </span>
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0 border-b border-slate-200 shadow-sm z-10">
                    <tr>
                      <th className="px-6 py-4 w-16 text-center">No.</th>
                      <th className="px-6 py-4 min-w-32">รหัส</th>
                      <th className="px-6 py-4 min-w-48">ชื่อ-สกุล</th>
                      <th className="px-6 py-4 min-w-40">ตำแหน่ง</th>
                      <th className="px-6 py-4 min-w-40">ชื่อกลุ่ม (สังกัด)</th>
                      <th className="px-6 py-4 min-w-36">สิทธิ์การใช้งาน</th>
                      <th className="px-6 py-4 w-32 text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allStaff.length === 0 ? (
                      <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-400">ยังไม่มีรายชื่อบุคลากรในระบบ</td></tr>
                    ) : allStaff.map((row, idx) => (
                      <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3 text-center text-slate-500">{idx + 1}</td>

                        {editingStaffId === row.id ? (
                          <>
                            <td className="px-6 py-2">
                              <input className="w-full border rounded px-2 py-1 text-sm bg-blue-50" value={editForm.code} onChange={(e) => setEditForm({ ...editForm, code: e.target.value })} />
                            </td>
                            <td className="px-6 py-2">
                              <input className="w-full border rounded px-2 py-1 text-sm bg-blue-50" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                            </td>
                            <td className="px-6 py-2">
                              <input className="w-full border rounded px-2 py-1 text-sm bg-blue-50" value={editForm.position} onChange={(e) => setEditForm({ ...editForm, position: e.target.value })} />
                            </td>
                            <td className="px-6 py-2">
                              <select className="w-full border rounded px-2 py-1 text-sm bg-blue-50"
                                value={editForm.group_id || ''}
                                onChange={(e) => setEditForm({ ...editForm, group_id: e.target.value })}>
                                <option value="">-- ไม่ระบุกลุ่ม --</option>
                                {allGroups.map(g => (
                                  <option key={g.id} value={g.id}>{g.group_name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-6 py-2 flex justify-center gap-1">
                              <button onClick={handleSaveEdit} className="p-1 px-2 text-emerald-600 hover:bg-emerald-100 rounded text-xs font-bold transition">บันทึก</button>
                              <button onClick={() => setEditingStaffId(null)} className="p-1 px-2 text-slate-500 hover:bg-slate-200 rounded text-xs font-bold transition">ยกเลิก</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-3 font-medium text-slate-700">{row.code || '-'}</td>
                            <td className="px-6 py-3">{row.name || '-'}</td>
                            <td className="px-6 py-3">{row.position || '-'}</td>
                            <td className="px-6 py-3 text-blue-600 bg-blue-50/30">{row.group_name || '-'}</td>
                            <td className="px-6 py-3">
                              <select
                                value={row.role || 'user'}
                                onChange={(e) => {
                                  const newRole = e.target.value;
                                  fetch(`${API_URL}/update_staff_role.php`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ staff_id: row.id, role: newRole })
                                  }).then(r => r.json()).then(r => {
                                    if (r.status === 'success') {
                                      setAllStaff(prev => prev.map(s => s.id === row.id ? { ...s, role: newRole } : s));
                                    } else alert('เปลี่ยนสิทธิ์ไม่สำเร็จ: ' + r.message);
                                  });
                                }}
                                className={`text-xs font-semibold rounded-full px-2 py-1 border cursor-pointer outline-none focus:ring-2 focus:ring-blue-300 ${
                                  row.role === 'admin' ? 'bg-amber-50 text-amber-700 border-amber-300' :
                                  row.role === 'reporter' ? 'bg-cyan-50 text-cyan-700 border-cyan-300' :
                                  'bg-slate-50 text-slate-600 border-slate-200'
                                }`}
                              >
                                <option value="user">👤 ผู้ใช้งาน</option>
                                <option value="reporter">📋 ผู้รายงาน</option>
                                <option value="admin">👑 ผู้ดูแลระบบ</option>
                              </select>
                            </td>
                            <td className="px-6 py-3 flex justify-center gap-2">
                              <button onClick={() => { setEditingStaffId(row.id); setEditForm({ code: row.code, name: row.name, position: row.position, group_id: row.group_id }); }} className="p-1 text-blue-500 hover:text-blue-700 transition" title="แก้ไข"><Edit size={16} /></button>
                              <button onClick={() => handleDeleteStaff(row.id)} className="p-1 text-red-400 hover:text-red-600 transition" title="ลบ"><Trash size={16} /></button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <hr className="border-slate-200 my-10" />

            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <CalendarCheck className="text-blue-500" />
              ตั้งค่าภาคเรียนและปีการศึกษา
            </h3>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-10 shadow-sm animate-fade-in">
              <div className="p-4 bg-amber-50 border-b border-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-amber-900 text-sm">การตั้งค่าภาคเรียนปัจจุบัน</h4>
                  <p className="text-xs text-amber-700">เลือกภาคเรียนที่จะให้ระบบใช้งานเป็นค่าเริ่มต้นในการเช็คชื่อและออกรายงาน</p>
                </div>
                <div className="w-full sm:w-auto">
                  <select 
                    value={adminTerms.find(t => t.is_active == 1)?.id || ''} 
                    onChange={(e) => {
                      if (e.target.value) handleSetActiveTerm(e.target.value);
                    }}
                    className="w-full sm:w-64 border border-amber-300 bg-white rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-amber-400 outline-none shadow-sm cursor-pointer"
                  >
                    <option value="" disabled>-- เลือกภาคเรียน --</option>
                    {adminTerms.map(t => (
                      <option key={t.id} value={t.id}>{t.term_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <div className="flex gap-3 items-end w-full md:w-auto">
                  <div className="flex-1 max-w-sm">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">เพิ่มภาคเรียนใหม่ระบบ <span className="text-red-500">*</span></label>
                    <input type="text" className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100" placeholder="เช่น 1/2569" value={newTermName} onChange={e => setNewTermName(e.target.value)} />
                  </div>
                  <button onClick={() => handleSaveTerm(null, newTermName)} className="px-4 py-2 bg-blue-600 text-white font-medium rounded shadow-sm hover:bg-blue-700 transition flex items-center gap-2">
                    <Plus size={16} /> <span className="hidden sm:inline">บันทึก</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="text-xs text-slate-700 uppercase bg-slate-100 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3">ชื่อภาคเรียน</th>
                      <th className="px-6 py-3 w-40 text-center">จัดการข้อมูล</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {adminTerms.length === 0 ? (
                      <tr><td colSpan="2" className="px-6 py-8 text-center text-slate-400">ยังไม่มีข้อมูลภาคเรียน</td></tr>
                    ) : adminTerms.map((t) => (
                      <tr key={t.id} className={`hover:bg-slate-50 transition ${t.is_active == 1 ? 'bg-amber-50/20' : ''}`}>
                        {editingTermId === t.id ? (
                          <>
                            <td className="px-6 py-3">
                              <input type="text" className="w-full border border-blue-300 rounded px-2 py-1 text-sm bg-blue-50 focus:ring-2 focus:ring-blue-200 outline-none" value={editTermForm} onChange={e => setEditTermForm(e.target.value)} />
                            </td>
                            <td className="px-6 py-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => handleSaveTerm(t.id, editTermForm)} className="p-1 px-2 text-emerald-600 hover:bg-emerald-100 rounded text-xs font-bold transition">บันทึก</button>
                                <button onClick={() => setEditingTermId(null)} className="p-1 px-2 text-slate-500 hover:bg-slate-200 rounded text-xs font-bold transition">ยกเลิก</button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-3 font-medium text-slate-700">
                              {t.term_name}
                              {t.is_active == 1 && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-200">ค่าเริ่มต้นปัจจุบัน</span>}
                            </td>
                            <td className="px-6 py-3 flex justify-center gap-2">
                              <button onClick={() => { setEditingTermId(t.id); setEditTermForm(t.term_name); }} className="p-2 text-blue-500 hover:bg-blue-50 hover:text-blue-700 rounded transition" title="แก้ไข"><Edit size={16} /></button>
                              <button onClick={() => handleDeleteTerm(t.id)} className="p-2 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded transition" title="ลบ"><Trash size={16} /></button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signature Settings */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b pb-3">
                <Edit size={18} className="text-blue-500" /> ตั้งค่าลายมือชื่อในรายงาน
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อผู้อำนวยการ</label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="ชื่อ-นามสกุล ผู้อำนวยการ"
                    value={signSettings.director_name}
                    onChange={e => setSignSettings(p => ({ ...p, director_name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อรองผู้อำนวยการฝ่ายบริหารทรัพยากร</label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="ชื่อ-นามสกุล รองผู้อำนวยการฯ"
                    value={signSettings.deputy_director_name}
                    onChange={e => setSignSettings(p => ({ ...p, deputy_director_name: e.target.value }))}
                  />
                </div>
              </div>

              {signGroups.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">ผู้รายงาน (แยกตามกลุ่มเป้าหมาย)</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {signGroups.map(g => (
                      <div key={g.id} className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 bg-slate-100 rounded px-2 py-1 whitespace-nowrap">{g.group_name}</span>
                        <input
                          type="text"
                          className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                          placeholder="ชื่อ-นามสกุล ผู้รายงาน"
                          value={signGroupSecretaries[g.id] || ''}
                          onChange={e => setSignGroupSecretaries(p => ({ ...p, [g.id]: e.target.value }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium text-sm transition disabled:opacity-50"
                >
                  {savingSettings ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  บันทึกการตั้งค่า
                </button>
              </div>
            </div>

            {/* LINE Messaging API Settings */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Bell size={18} className="text-green-500" /> ตั้งค่าแจ้งเตือน LINE Messaging API
                </h3>
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={lineSettings.line_api_enabled}
                      onChange={e => setLineSettings(p => ({ ...p, line_api_enabled: e.target.checked }))}
                    />
                    <div className={`block w-10 h-6 rounded-full transition ${lineSettings.line_api_enabled ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${lineSettings.line_api_enabled ? 'translate-x-4' : ''}`}></div>
                  </div>
                  <div className="ml-3 text-sm font-medium text-slate-700">เปิดใช้งานแจ้งเตือน LINE</div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Channel Access Token <span className="text-rose-500">*</span></label>
                  <input
                    type="password"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
                    placeholder="กรอก Channel Access Token (รับจาก LINE Developers)"
                    value={lineSettings.line_channel_token}
                    onChange={e => setLineSettings(p => ({ ...p, line_channel_token: e.target.value }))}
                    disabled={!lineSettings.line_api_enabled}
                  />
                  <p className="text-xs text-slate-500 mt-1">ต้องใช้ Long-lived Channel Access Token จาก LINE Official Account ของสถานศึกษา</p>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Target ID (User ID / Group ID / Room ID)</label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
                    placeholder="ปล่อยว่างไว้ หากต้องการส่งข้อความแบบ Broadcast ไปยังทุกคน"
                    value={lineSettings.line_target_id}
                    onChange={e => setLineSettings(p => ({ ...p, line_target_id: e.target.value }))}
                    disabled={!lineSettings.line_api_enabled}
                  />
                  <p className="text-xs text-slate-500 mt-1">หากต้องการส่งเจาะจงกลุ่ม/บุคคล ให้ใส่ ID ที่นี่ (เช่น C123456... หรือ U123456...) หากปล่อยว่าง ระบบจะส่งหาทุกคน (เสียโควต้า Broadcast)</p>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">รูปแบบข้อความแจ้งเตือน <span className="text-green-600 font-semibold">(เมื่อมีการสร้างกิจกรรมใหม่)</span></label>
                  <textarea
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 min-h-[100px]"
                    placeholder="ใส่รูปแบบข้อความแจ้งเตือน เช่น 🔔 กิจกรรมใหม่: [activity_name]"
                    value={lineSettings.line_message_template}
                    onChange={e => setLineSettings(p => ({ ...p, line_message_template: e.target.value }))}
                    disabled={!lineSettings.line_api_enabled}
                  />
                  <p className="text-xs text-slate-500 mt-1">ตัวแปรที่ใช้ได้: <code className="bg-slate-100 px-1 rounded">[activity_name]</code> ชื่อกิจกรรม, <code className="bg-slate-100 px-1 rounded">[activity_date]</code> วันที่จัด, <code className="bg-slate-100 px-1 rounded">[group_name]</code> กลุ่มที่เข้าร่วม, <code className="bg-slate-100 px-1 rounded">[link]</code> ลิงก์ระบบ, <code className="bg-slate-100 px-1 rounded">[attachment]</code> ลิงก์เอกสารอ้างอิง</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                 <button
                  onClick={handleTestLineAPI}
                  disabled={testingLine || !lineSettings.line_api_enabled}
                  className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium text-sm transition disabled:opacity-50"
                  title="ทดสอบส่งข้อความยืนยันระบบ"
                >
                  {testingLine ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} className="text-green-600" />}
                  ทดสอบระบบ
                </button>
                <button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium text-sm transition disabled:opacity-50"
                >
                  {savingSettings ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  บันทึกการตั้งค่า
                </button>
              </div>
            </div>

            {/* Reminder Settings */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Bell size={18} className="text-amber-500" /> ตั้งค่าแจ้งเตือนล่วงหน้าอัตโนมัติ (Auto Reminder)
                </h3>
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" className="sr-only"
                      checked={reminderSettings.reminder_enabled}
                      onChange={e => setReminderSettings(p => ({ ...p, reminder_enabled: e.target.checked }))}
                    />
                    <div className={`block w-10 h-6 rounded-full transition ${reminderSettings.reminder_enabled ? 'bg-amber-500' : 'bg-slate-300'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${reminderSettings.reminder_enabled ? 'translate-x-4' : ''}`}></div>
                  </div>
                  <div className="ml-3 text-sm font-medium text-slate-700">เปิดใช้งานแจ้งเตือนล่วงหน้า</div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">แจ้งเตือนล่วงหน้า (จำนวนวัน คั่นด้วย ,)</label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    placeholder="เช่น 1,3,7"
                    value={reminderSettings.reminder_intervals}
                    onChange={e => setReminderSettings(p => ({ ...p, reminder_intervals: e.target.value }))}
                    disabled={!reminderSettings.reminder_enabled}
                  />
                  <p className="text-xs text-slate-500 mt-1">ใส่จำนวนวันคั่นด้วยเครื่องหมาย , เช่น <code className="bg-slate-100 px-1 rounded">1,3</code> = แจ้งเตือนล่วงหน้า 1 วัน และ 3 วัน</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">เวลาที่ต้องการส่งแจ้งเตือน</label>
                  <input
                    type="time"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    value={reminderSettings.reminder_time}
                    onChange={e => setReminderSettings(p => ({ ...p, reminder_time: e.target.value }))}
                    disabled={!reminderSettings.reminder_enabled}
                  />
                  <p className="text-xs text-slate-500 mt-1">ระบบจะส่งแจ้งเตือนหลังจากเวลานี้เมื่อมีผู้ใช้งานเข้าระบบ</p>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">รูปแบบข้อความแจ้งเตือนล่วงหน้า <span className="text-amber-600 font-semibold">(Auto Reminder)</span></label>
                  <textarea
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 min-h-[90px]"
                    placeholder="⏰ แจ้งเตือนล่วงหน้า [days_left] วัน..."
                    value={reminderSettings.reminder_template}
                    onChange={e => setReminderSettings(p => ({ ...p, reminder_template: e.target.value }))}
                    disabled={!reminderSettings.reminder_enabled}
                  />
                  <p className="text-xs text-slate-500 mt-1">ตัวแปรที่ใช้ได้: <code className="bg-slate-100 px-1 rounded">[days_left]</code> จำนวนวันที่เหลือ, <code className="bg-slate-100 px-1 rounded">[activity_name]</code> ชื่อกิจกรรม, <code className="bg-slate-100 px-1 rounded">[activity_date]</code> วันที่จัด, <code className="bg-slate-100 px-1 rounded">[link]</code> ลิงก์ระบบ</p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button onClick={handleSaveSettings} disabled={savingSettings}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium text-sm transition disabled:opacity-50">
                  {savingSettings ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  บันทึกการตั้งค่า
                </button>
              </div>
            </div>

            </div>

            {/* Upload Manual Settings */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <BookOpen size={18} className="text-indigo-500" /> อัปโหลดคู่มือการใช้งาน (PDF)
                </h3>
              </div>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-slate-600 mb-2">อัปโหลดไฟล์คู่มือการใช้งานระบบ (รองรับเฉพาะไฟล์ PDF ขนาดไม่เกิน 20MB)</p>
                  <p className="text-xs text-slate-500">ไฟล์จะถูกนำไปแสดงในเมนู "คู่มือการใช้งาน" ด้านซ้ายมือเพื่อให้ผู้ใช้ทุกคนสามารถเปิดอ่านได้</p>
                </div>
                <div className="w-full md:w-auto">
                  <input
                    type="file"
                    accept=".pdf"
                    id="manual-upload"
                    className="hidden"
                    onChange={handleUploadManual}
                  />
                  <label htmlFor="manual-upload" className="cursor-pointer flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-5 py-2.5 rounded-lg font-medium text-sm transition w-full md:w-auto">
                    {uploadingManual ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                    {uploadingManual ? 'กำลังอัปโหลด...' : 'เลือกไฟล์คู่มือ (PDF)'}
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-rose-50/50 p-6 flex flex-col md:flex-row items-start md:items-center justify-between rounded-xl border border-rose-200">
              <div className="mb-4 md:mb-0">
                <h3 className="font-bold text-rose-800 mb-1 flex items-center gap-2">
                  <LogOut size={18} /> ล้างข้อมูลระบบ (Danger Zone)
                </h3>
                <p className="text-sm text-rose-600">ลบรายชื่อบุคลากรและประวัติการลงชื่อกิจกรรมทั้งหมดออกจากระบบ</p>
              </div>
              <button onClick={handleClearData} disabled={isClearing} className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-bold shadow-sm shadow-rose-200 flex items-center justify-center gap-2 transition w-full md:w-auto">
                {isClearing ? <Loader2 size={16} className="animate-spin" /> : <Settings size={16} />}
                ล้างข้อมูลบุคลากรทั้งหมด
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  };

  // --- Main Layout ---
  return (
    <div className="h-screen bg-slate-50 flex font-sans overflow-hidden">

      {/* Global Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />

      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && isAuthenticated && activeTab !== 'login' && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      {isAuthenticated && activeTab !== 'login' && (
        <aside className={`
        fixed md:static inset-y-0 left-0 z-30
        w-72 bg-gradient-to-b from-blue-900 via-blue-800 to-cyan-900 text-blue-50 flex flex-col
        transition-transform duration-300 ease-in-out shadow-xl
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${!isSidebarOpen && 'md:w-0 md:overflow-hidden'}
      `}>
        <div className="p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg border-2 border-white/30 overflow-hidden bg-white/80 p-0.5">
              <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Logo" className="w-full h-full object-cover rounded-full" onError={(e) => e.target.style.display='none'} />
            </div>
            <div className="flex flex-col">
              <h1 className="text-white font-bold text-[14px] leading-tight whitespace-nowrap">ระบบรายงาน<span className="text-cyan-300">การเข้าร่วมกิจกรรม</span></h1>
              <p className="text-[9px] font-medium text-blue-200 mt-0.5 whitespace-nowrap">(Activity Participation Report)</p>
            </div>
          </div>
          <button className="md:hidden text-blue-300 hover:text-white ml-2" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-2 py-4">
          <button
            onClick={() => { setActiveTab('dashboard'); window.innerWidth < 768 && setIsSidebarOpen(false); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'dashboard' ? 'bg-white/20 text-white shadow-md font-bold border-l-4 border-cyan-300' : 'hover:bg-white/10 hover:text-white'}`}
          >
            <LayoutDashboard size={20} />
            <span>แดชบอร์ด</span>
          </button>

          {/* User Manual Link */}
          <a
            href={`${import.meta.env.BASE_URL}uploads/manual.pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors hover:bg-white/10 hover:text-white text-blue-100"
          >
            <BookOpen size={20} />
            <span>คู่มือการใช้งาน</span>
          </a>
          
          {isAuthenticated ? (
            <>
              <div className="pt-4 mt-2 border-t border-white/10">
                <p className="px-4 text-xs font-semibold text-blue-300 uppercase tracking-wider mb-2">การจัดการ (Admin)</p>
                {(currentUser?.role === 'admin' || currentUser?.role === 'reporter') && (
                  <button
                    onClick={() => { setActiveTab('activities'); window.innerWidth < 768 && setIsSidebarOpen(false); }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'activities' ? 'bg-white/20 text-white shadow-md font-bold border-l-4 border-cyan-300' : 'hover:bg-white/10 hover:text-white'}`}
                  >
                    <CalendarCheck size={20} />
                    <span>ลงชื่อกิจกรรม</span>
                  </button>
                )}
                {(currentUser?.role === 'admin' || currentUser?.role === 'reporter') && (
                  <button
                    onClick={() => { setActiveTab('reports'); window.innerWidth < 768 && setIsSidebarOpen(false); }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'reports' ? 'bg-white/20 text-white shadow-md font-bold border-l-4 border-cyan-300' : 'hover:bg-white/10 hover:text-white'}`}
                  >
                    <FileText size={20} />
                    <span>รายงานผล (Export)</span>
                  </button>
                )}
                {currentUser?.role === 'admin' && (
                  <>
                    <button
                      onClick={() => { setActiveTab('groups'); window.innerWidth < 768 && setIsSidebarOpen(false); }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'groups' ? 'bg-white/20 text-white shadow-md font-bold border-l-4 border-cyan-300' : 'hover:bg-white/10 hover:text-white'}`}
                    >
                      <Users size={20} />
                      <span>จัดการกลุ่มบุคลากร</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('admin'); window.innerWidth < 768 && setIsSidebarOpen(false); }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'admin' ? 'bg-white/20 text-white shadow-md font-bold border-l-4 border-cyan-300' : 'hover:bg-white/10 hover:text-white'}`}
                    >
                      <Settings size={20} />
                      <span>ตั้งค่าระบบ</span>
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={() => { setActiveTab('login'); window.innerWidth < 768 && setIsSidebarOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'login' ? 'bg-white/20 text-white shadow-md font-bold border-l-4 border-cyan-300' : 'hover:bg-white/10 hover:text-white'}`}
            >
              <Lock size={20} />
              <span>เข้าสู่ระบบ</span>
            </button>
          )}
        </nav>

        {isAuthenticated && (
          <div className="p-4 border-t border-white/10 shrink-0">
            <div className="flex items-center space-x-3 px-4 py-2 mb-2">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold shadow-sm border border-white/30">
                {currentUser?.full_name?.charAt(0) || <UserCheck size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{currentUser?.full_name}</p>
                <p className="text-[10px] text-blue-200 truncate">{currentUser?.staff_code}</p>
                <span className={`inline-block mt-1 text-[9px] px-2 py-0.5 rounded-full font-bold ${
                  currentUser?.role === 'admin' ? 'bg-amber-400/30 text-amber-300 border border-amber-400/40' :
                  currentUser?.role === 'reporter' ? 'bg-cyan-400/30 text-cyan-200 border border-cyan-400/40' :
                  'bg-white/10 text-blue-200 border border-white/20'
                }`}>
                  {currentUser?.role === 'admin' ? '👑 ผู้ดูแลระบบ' : currentUser?.role === 'reporter' ? '📋 ผู้รายงาน' : '👤 ผู้ใช้งาน'}
                </span>
              </div>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-rose-500/90 text-blue-100 hover:text-white rounded-lg transition-colors text-sm font-bold border border-white/10">
              <LogOut size={16} /> ออกจากระบบ
            </button>
          </div>
        )}

        <div className="p-4 border-t border-white/10 shrink-0 space-y-3">
          <div className="flex items-center space-x-3 px-2">
            <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold shrink-0">
              <CheckCircle2 size={12} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-white truncate">เชื่อมต่อ API สมบูรณ์</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 px-2">
            <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold shrink-0">
              <CheckCircle2 size={12} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-white truncate">OIDC Auto-Provision Active</p>
            </div>
          </div>
        </div>
      </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

        {/* Top Desktop Notification Bar */}
        {activeTab !== 'login' && (
          <div className="hidden md:flex items-center justify-between px-8 py-3 shrink-0 no-print bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 shadow-md">
            <div className="flex items-center">
              {!isAuthenticated && (
                <div className="flex items-center">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center mr-4 shadow-lg border-2 border-white/40 overflow-hidden bg-white/80 p-0.5">
                    <img src="logo.png" alt="Logo" className="w-full h-full object-cover rounded-full" onError={(e) => e.target.style.display='none'} />
                  </div>
                  <div className="flex flex-col justify-center">
                    <h1 className="font-bold text-white text-[17px] drop-shadow-sm leading-tight">
                      ระบบรายงานการเข้าร่วมกิจกรรม
                    </h1>
                    <span className="font-medium text-cyan-100 text-[12px] mt-0.5 drop-shadow-sm">(Activity Participation Report)</span>
                  </div>
                </div>
              )}
              {isAuthenticated && (
                <div className="flex items-center py-1">
                  <h1 className="font-bold text-white text-xl border-l-4 border-cyan-400 pl-4 py-1 drop-shadow-sm">
                    {activeTab === 'dashboard' && 'แดชบอร์ดภาพรวม'}
                    {activeTab === 'activities' && 'ลงชื่อกิจกรรม'}
                    {activeTab === 'reports' && 'ออกรายงานผล'}
                    {activeTab === 'groups' && 'จัดการกลุ่มบุคลากร'}
                    {activeTab === 'admin' && 'ตั้งค่าระบบ'}
                  </h1>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              {!isAuthenticated && (
                <button
                  onClick={() => setActiveTab('login')}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-bold transition shadow-md flex items-center gap-2 border border-amber-400"
                >
                  <Lock size={16} /> เข้าสู่ระบบ
                </button>
              )}
              {isAuthenticated && (
                <div className="relative">
                  <button
                    onClick={() => setShowNotifPanel(!showNotifPanel)}
                    className="relative flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 transition text-white"
                  >
                    <Bell size={20} />
                    <span className="text-sm font-medium">การแจ้งเตือน</span>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center font-bold animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile Header */}
        {activeTab !== 'login' && (
          <header className="md:hidden shadow-sm p-4 flex items-center justify-between shrink-0 z-10 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400">
            <div className="flex items-center space-x-4 min-w-0">
              {isAuthenticated ? (
                <>
                  <button onClick={() => setIsSidebarOpen(true)} className="text-white hover:bg-white/10 rounded focus:outline-none p-1 -ml-1">
                    <Menu size={24} />
                  </button>
                  <h1 className="font-bold text-white truncate drop-shadow-sm">
                    {activeTab === 'dashboard' && 'แดชบอร์ดภาพรวม'}
                    {activeTab === 'activities' && 'ลงชื่อกิจกรรม'}
                    {activeTab === 'reports' && 'ออกรายงานผล'}
                    {activeTab === 'groups' && 'จัดการกลุ่มบุคลากร'}
                    {activeTab === 'admin' && 'ตั้งค่าระบบ'}
                  </h1>
                </>
              ) : (
                <div className="flex items-center min-w-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mr-2 shrink-0 shadow-md border-[1.5px] border-white/40 overflow-hidden bg-white/80 p-0.5">
                    <img src="logo.png" alt="Logo" className="w-full h-full object-cover rounded-full" onError={(e) => e.target.style.display='none'} />
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <h1 className="font-bold text-white text-sm truncate drop-shadow-sm leading-tight">ระบบรายงานการเข้าร่วมกิจกรรม</h1>
                    <span className="text-[10px] text-cyan-200 font-medium truncate">(Activity Participation Report)</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center shrink-0 ml-2">
              {!isAuthenticated ? (
                <button onClick={() => setActiveTab('login')} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-bold shadow-sm border border-amber-400">
                  เข้าสู่ระบบ
                </button>
              ) : (
                <button onClick={() => setShowNotifPanel(!showNotifPanel)} className="relative text-white hover:bg-white/10 p-1 rounded transition">
                  <Bell size={22} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">{unreadCount}</span>
                  )}
                </button>
              )}
            </div>
          </header>
        )}

        {/* Notification Slide Panel */}
        {showNotifPanel && (
          <div className="absolute top-0 right-0 h-full w-full md:w-96 bg-white shadow-2xl z-40 border-l border-slate-200 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-blue-600" />
                <h3 className="font-bold text-slate-800">การแจ้งเตือน</h3>
                {unreadCount > 0 && (
                  <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount} ใหม่</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">อ่านทั้งหมด</button>
                )}
                <button onClick={() => setShowNotifPanel(false)} className="text-slate-400 hover:text-slate-700">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
                  <Bell size={40} className="mb-3 opacity-30" />
                  <p className="text-sm">ยังไม่มีการแจ้งเตือน</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className={`p-4 hover:bg-slate-50 transition ${n.is_read == 0 ? 'bg-blue-50/40 border-l-4 border-l-blue-400' : 'bg-white'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${n.is_read == 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                        {n.type === 'activity' ? <CalendarCheck size={16} /> : <UserCheck size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-xs font-bold text-slate-700 mb-0.5 flex-1">{n.title}</p>
                          <div className="flex items-center gap-1 shrink-0">
                            {n.is_read == 0 && (
                              <button
                                onClick={() => {
                                  const user = JSON.parse(localStorage.getItem('srs_user') || 'null');
                                  if (!user?.id) return;
                                  fetch(`${API_URL}/mark_notification_read.php`, {
                                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ staff_id: user.id, notif_id: n.id })
                                  }).then(() => {
                                    prevNotifIdsRef.current = '';
                                    setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: 1 } : x));
                                  });
                                }}
                                className="text-[10px] text-blue-500 hover:text-blue-700 border border-blue-200 rounded px-1.5 py-0.5 transition"
                                title="ทำเครื่องหมายว่าอ่านแล้ว"
                              >
                                อ่านแล้ว
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(n.id)}
                              className="text-slate-300 hover:text-rose-500 transition"
                              title="ลบการแจ้งเตือน"
                            >
                              <Trash size={14} />
                            </button>
                          </div>
                        </div>
                        {n.staff_name && <p className="text-[11px] text-indigo-600 font-medium mb-1">👤 {n.staff_name}</p>}
                        {n.message.includes('|ATTACHMENT:') ? (
                            <>
                                <p className="text-sm text-slate-600 leading-relaxed">{n.message.split('|ATTACHMENT:')[0]} (มีเอกสารแนบ 📎)</p>
                                <a href={`${API_URL}/../${n.message.split('|ATTACHMENT:')[1]}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-bold text-blue-700 bg-blue-100/50 border border-blue-200 px-2 py-1 rounded hover:bg-blue-100 transition whitespace-nowrap">
                                     <Paperclip size={12} /> เปิดดูเอกสารอ้างอิง
                                </a>
                            </>
                        ) : (
                            <p className="text-sm text-slate-600 leading-relaxed">{n.message}</p>
                        )}
                        <p className="text-[10px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleString('th-TH')}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'login' && <LoginView />}
            
            {/* Protected Routes */}
            {isAuthenticated ? (
              <>
                {activeTab === 'activities' && <ActivitiesView refreshKey={activitiesRefreshKey} />}
                {activeTab === 'groups' && <GroupManagementView />}
                {activeTab === 'admin' && <AdminView />}
                {activeTab === 'reports' && <ReportsView />}
              </>
            ) : (
              activeTab !== 'dashboard' && activeTab !== 'login' && (
                <div className="text-center p-12 bg-white rounded-xl shadow-sm border border-slate-200">
                  <Lock className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">กรุณาเข้าสู่ระบบ</h3>
                  <p className="text-slate-500 mb-6">คุณต้องเข้าสู่ระบบก่อนจึงจะสามารถเข้าดูเมนูนี้ได้</p>
                  <button onClick={() => setActiveTab('login')} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
                    ไปที่หน้าเข้าสู่ระบบ
                  </button>
                </div>
              )
            )}
          </div>
        </div>

      </main>
    </div>
  );
}