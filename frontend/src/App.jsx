import {
  LayoutDashboard, Mic2, CalendarCheck, FileText,
  History, Bell, Settings, Stethoscope, Sun, Moon,
  User, Home, LogOut, CalendarPlus, Clock,
} from 'lucide-react'
import { AppProvider, useApp } from './context/AppContext'
import Dashboard           from './pages/Dashboard'
import Scribe              from './pages/Scribe'
import Appointments        from './pages/Appointments'
import Reports             from './pages/Reports'
import RoleSelector        from './pages/RoleSelector'
import PatientHome         from './pages/PatientHome'
import PatientVoice        from './pages/PatientVoice'
import PatientBook         from './pages/PatientBook'
import PatientAppointments from './pages/PatientAppointments'
import DoctorAvailability  from './pages/DoctorAvailability'

const DOCTOR_NAV = [
  { id: 'dashboard',     label: 'Dashboard',      icon: LayoutDashboard },
  { id: 'scribe',        label: 'Medical Scribe',  icon: Mic2 },
  { id: 'appointments',  label: 'Appointments',    icon: CalendarCheck },
  { id: 'availability',  label: 'My Availability', icon: Clock },
  { id: 'reports',       label: 'Reports & PDF',   icon: FileText },
  { id: 'sessions',      label: 'Session History', icon: History },
]

const PATIENT_NAV = [
  { id: 'patient-home',  label: 'My Dashboard',      icon: Home },
  { id: 'patient-voice', label: 'Record Symptoms',   icon: Mic2 },
  { id: 'patient-book',  label: 'Book Appointment',  icon: CalendarPlus },
  { id: 'appointments',  label: 'My Appointments',   icon: CalendarCheck },
  { id: 'reports',       label: 'My Reports',        icon: FileText },
]

const PAGE_TITLE = {
  dashboard:      'Dashboard',
  scribe:           'Medical Scribe',
  appointments:     'Appointments',
  availability:     'My Availability',
  reports:          'Reports & PDF',
  sessions:         'Session History',
  'patient-home':   'My Dashboard',
  'patient-voice':  'Record Symptoms',
  'patient-book':   'Book Appointment',
}

function SessionHistory() {
  const { sessions, removeSession, setCurrentResult, setPage, setSessions } = useApp()
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Session History ({sessions.length})</span>
        {sessions.length > 0 && (
          <button onClick={() => { if (confirm('Clear all sessions?')) setSessions([]) }}
            className="text-xs text-red-500 hover:text-red-700 font-semibold">
            Clear All
          </button>
        )}
      </div>
      {sessions.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <History size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No sessions yet</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50 dark:divide-slate-700">
          {sessions.map(s => (
            <div key={s.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Mic2 size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{s.filename}</p>
                <p className="text-xs text-slate-400">{new Date(s.date).toLocaleString()}</p>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => { setCurrentResult(s.result); setPage('scribe') }}
                  className="px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >View</button>
                <button
                  onClick={() => removeSession(s.id)}
                  className="px-2.5 py-1.5 text-xs border border-red-100 dark:border-red-900/40 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                >Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Layout() {
  const { page, setPage, sessions, appointments, darkMode, toggleDark, role, setRole } = useApp()

  if (!role) return <RoleSelector />

  const isDoctor = role === 'doctor'
  const nav      = isDoctor ? DOCTOR_NAV : PATIENT_NAV

  const today = new Date().toISOString().slice(0, 10)
  const todayCount   = appointments.filter(a => a.date === today && a.status !== 'cancelled').length
  const pendingCount = appointments.filter(a => a.date >= today && a.status === 'scheduled').length
  const hasAlerts    = sessions.some(s => /alert|urgent|critical/i.test(s.result || ''))

  const DOCTOR_PAGES = {
    dashboard:    <Dashboard />,
    scribe:       <Scribe />,
    appointments: <Appointments />,
    availability: <DoctorAvailability />,
    reports:      <Reports />,
    sessions:     <SessionHistory />,
  }

  const PATIENT_PAGES = {
    'patient-home':  <PatientHome />,
    'patient-voice': <PatientVoice />,
    'patient-book':  <PatientBook />,
    'appointments':  <PatientAppointments />,
    'reports':       <Reports />,
  }

  const pages       = isDoctor ? DOCTOR_PAGES : PATIENT_PAGES
  const currentTitle = PAGE_TITLE[page] ?? 'MediScribe AI'
  const accentActive = isDoctor ? 'bg-blue-600/20 text-white'   : 'bg-emerald-600/20 text-white'
  const accentIcon   = isDoctor ? 'text-blue-400'               : 'text-emerald-400'
  const accentBtn    = isDoctor
    ? 'bg-blue-600 hover:bg-blue-700'
    : 'bg-emerald-600 hover:bg-emerald-700'
  const logoGrad = isDoctor
    ? 'from-blue-500 to-violet-600'
    : 'from-emerald-500 to-teal-600'

  return (
    <div className="flex min-h-screen">

      {/* ── Sidebar ───────────────────────────────────────── */}
      <aside className="w-60 bg-slate-900 dark:bg-slate-950 flex flex-col fixed top-0 left-0 bottom-0 z-30 transition-colors">

        {/* Logo */}
        <div className="px-4 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${logoGrad} flex items-center justify-center flex-shrink-0`}>
              {isDoctor
                ? <Stethoscope size={18} className="text-white" />
                : <User size={18} className="text-white" />}
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">MediScribe AI</p>
              <p className="text-xs text-slate-400">{isDoctor ? 'Doctor Portal' : 'Patient Portal'}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 mb-2">
            {isDoctor ? 'Main' : 'Menu'}
          </p>
          {nav.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                page === id
                  ? accentActive
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={16} className={page === id ? accentIcon : ''} />
              <span className="flex-1 text-left">{label}</span>
              {id === 'appointments' && isDoctor && pendingCount > 0 && (
                <span className="text-xs font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
              {id === 'appointments' && !isDoctor && todayCount > 0 && (
                <span className="text-xs font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">
                  {todayCount}
                </span>
              )}
              {id === 'sessions' && sessions.length > 0 && (
                <span className="text-xs font-bold bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded-full">
                  {sessions.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Dark toggle */}
        <div className="px-3 pb-1">
          <button
            onClick={toggleDark}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-all"
          >
            {darkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
            <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>

        {/* Switch Role */}
        <div className="px-3 pb-2">
          <button
            onClick={() => setRole(null)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-all"
          >
            <LogOut size={16} />
            <span>Switch Role</span>
          </button>
        </div>

        {/* User pill */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${logoGrad} flex items-center justify-center text-xs font-bold text-white`}>
              {isDoctor ? 'SG' : 'PT'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {isDoctor ? 'Dr. Sneha Gupta' : 'Patient'}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {isDoctor ? 'sneha.gupta@nuvo.ai' : 'Patient Portal'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────── */}
      <div className="ml-60 flex-1 flex flex-col min-h-screen">

        {/* Topbar */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 h-14 flex items-center justify-between sticky top-0 z-20 transition-colors">
          <div>
            <h1 className="text-base font-bold text-slate-800 dark:text-slate-100">{currentTitle}</h1>
            <p className="text-xs text-slate-400">MediScribe AI / {currentTitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleDark}
              title={darkMode ? 'Switch to Light' : 'Switch to Dark'}
              className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              {darkMode ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
            </button>
            <button className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors relative">
              <Bell size={15} />
              {hasAlerts && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-800" />
              )}
            </button>
            <button className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <Settings size={15} />
            </button>
            <button
              onClick={() => setPage(isDoctor ? 'scribe' : 'patient-voice')}
              className={`flex items-center gap-1.5 px-3 py-1.5 ${accentBtn} text-white text-sm font-semibold rounded-lg transition-colors`}
            >
              <Mic2 size={13} /> {isDoctor ? 'New Session' : 'Record'}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          {pages[page] ?? (isDoctor ? <Dashboard /> : <PatientHome />)}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Layout />
    </AppProvider>
  )
}
