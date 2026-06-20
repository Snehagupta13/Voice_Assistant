import { useApp } from '../context/AppContext'
import {
  Mic2, CalendarCheck, FileText, ChevronRight,
  Calendar, AlertCircle, Eye,
} from 'lucide-react'
import { format } from 'date-fns'

function StatCard({ icon: Icon, label, value, iconBg, iconColor }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex items-start gap-4 hover:-translate-y-0.5 transition-transform cursor-default">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg} ${iconColor}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 leading-tight mt-0.5">{value}</p>
      </div>
    </div>
  )
}

export default function PatientHome() {
  const { sessions, appointments, setPage, setCurrentResult } = useApp()

  const today    = new Date().toISOString().slice(0, 10)
  const upcoming = appointments
    .filter(a => a.date >= today && a.status !== 'cancelled')
    .sort((a, b) => a.date.localeCompare(b.date))
  const nextAppt = upcoming[0]

  return (
    <div className="space-y-6">

      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
        <h2 className="text-xl font-bold mb-1">Welcome back</h2>
        <p className="text-emerald-100 text-sm">
          {nextAppt
            ? `Your next appointment is on ${format(new Date(nextAppt.date + 'T00:00:00'), 'EEEE, MMMM d')} at ${nextAppt.time}`
            : 'No upcoming appointments scheduled'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={CalendarCheck} label="Upcoming Appointments" value={upcoming.length}      iconBg="bg-emerald-50 dark:bg-emerald-900/20" iconColor="text-emerald-600 dark:text-emerald-400" />
        <StatCard icon={Mic2}          label="My Recordings"          value={sessions.length}     iconBg="bg-blue-50 dark:bg-blue-900/20"       iconColor="text-blue-600 dark:text-blue-400" />
        <StatCard icon={FileText}      label="Total Appointments"     value={appointments.length} iconBg="bg-violet-50 dark:bg-violet-900/20"   iconColor="text-violet-600 dark:text-violet-400" />
      </div>

      <div className="grid grid-cols-2 gap-6">

        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Quick Actions</span>
          </div>
          <div className="p-5 space-y-3">
            <button
              onClick={() => setPage('patient-voice')}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center text-white flex-shrink-0">
                <Mic2 size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Record Symptoms</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Describe how you're feeling</p>
              </div>
            </button>

            <button
              onClick={() => setPage('appointments')}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white flex-shrink-0">
                <Calendar size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">My Appointments</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">View scheduled visits</p>
              </div>
            </button>

            <button
              onClick={() => setPage('reports')}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-violet-500 flex items-center justify-center text-white flex-shrink-0">
                <FileText size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">My Reports</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">View health records</p>
              </div>
            </button>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Upcoming Appointments</span>
            <button
              onClick={() => setPage('appointments')}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
            >
              View all <ChevronRight size={12} />
            </button>
          </div>
          <div className="p-5 space-y-3">
            {upcoming.length === 0 ? (
              <div className="text-center py-6">
                <AlertCircle size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">No upcoming appointments</p>
              </div>
            ) : upcoming.slice(0, 4).map(a => (
              <div key={a.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <CalendarCheck size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{a.reason}</p>
                  <p className="text-xs text-slate-400">{format(new Date(a.date + 'T00:00:00'), 'dd MMM yyyy')} · {a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Recordings */}
      {sessions.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Recent Recordings</span>
            <button
              onClick={() => setPage('patient-voice')}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
            >
              New <ChevronRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-700">
            {sessions.slice(0, 3).map(s => (
              <div key={s.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                  <Mic2 size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{s.filename}</p>
                  <p className="text-xs text-slate-400">{format(new Date(s.date), 'dd MMM yyyy · HH:mm')}</p>
                </div>
                <button
                  onClick={() => { setCurrentResult(s.result); setPage('patient-voice') }}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <Eye size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
