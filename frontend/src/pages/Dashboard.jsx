import { useApp } from '../context/AppContext'
import {
  Mic2, CalendarCheck, AlertTriangle, FileDown,
  Upload, CalendarPlus, Eye, Folder, CalendarX, ChevronRight,
  Clock,
} from 'lucide-react'

import { format } from 'date-fns'

function StatCard({ icon: Icon, label, value, trend, iconBg, iconColor }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex items-start gap-4 hover:-translate-y-0.5 transition-transform cursor-default">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg} ${iconColor}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 leading-tight mt-0.5">{value}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{trend}</p>
      </div>
    </div>
  )
}

function QuickAction({ icon: Icon, label, desc, iconColor, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all text-center w-full"
    >
      <Icon size={26} className={iconColor} />
      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{label}</span>
      <span className="text-xs text-slate-500 dark:text-slate-400">{desc}</span>
    </button>
  )
}

export default function Dashboard() {
  const { sessions, appointments, reportCount, setPage, setCurrentResult } = useApp()

  const today        = new Date().toISOString().slice(0, 10)
  const todayAppts   = appointments.filter(a => a.date === today && a.status !== 'cancelled')
  const alertCount   = sessions.filter(s => /alert|urgent|critical/i.test(s.result || '')).length
  const pendingAppts = appointments.filter(a => a.date >= today && a.status === 'scheduled')

  const STATUS_CLS = {
    scheduled: 'bg-blue-50  dark:bg-blue-900/20  text-blue-700  dark:text-blue-400',
    confirmed:  'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
    completed:  'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400',
    cancelled:  'bg-red-50   dark:bg-red-900/20   text-red-600   dark:text-red-400',
  }

  return (
    <div className="space-y-6">

      {/* Pending requests banner */}
      {pendingAppts.length > 0 && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-3">
            <Clock size={18} className="text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                {pendingAppts.length} pending appointment request{pendingAppts.length > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                {pendingAppts.slice(0, 2).map(a => `${a.patientName} (${a.date} ${a.time})`).join(' · ')}
                {pendingAppts.length > 2 ? ` · +${pendingAppts.length - 2} more` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => setPage('appointments')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap"
          >
            Review <ChevronRight size={12} />
          </button>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={Mic2}          label="Total Sessions"       value={sessions.length}   trend="All time"      iconBg="bg-blue-50 dark:bg-blue-900/20"    iconColor="text-blue-600 dark:text-blue-400" />
        <StatCard icon={CalendarCheck} label="Today's Appointments" value={todayAppts.length}  trend="Scheduled"     iconBg="bg-emerald-50 dark:bg-emerald-900/20" iconColor="text-emerald-600 dark:text-emerald-400" />
        <StatCard icon={AlertTriangle} label="Active Alerts"        value={alertCount}         trend="From sessions" iconBg="bg-amber-50 dark:bg-amber-900/20"   iconColor="text-amber-600 dark:text-amber-400" />
        <StatCard icon={FileDown}      label="Reports Generated"    value={reportCount}        trend="PDF downloads" iconBg="bg-violet-50 dark:bg-violet-900/20" iconColor="text-violet-600 dark:text-violet-400" />
      </div>

      <div className="grid grid-cols-2 gap-6">

        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Quick Actions</span>
          </div>
          <div className="p-5 grid grid-cols-3 gap-3">
            <QuickAction icon={Mic2}         label="Record"   desc="Live session"    iconColor="text-red-500"      onClick={() => setPage('scribe')} />
            <QuickAction icon={Upload}       label="Upload"   desc="Audio file"      iconColor="text-blue-600 dark:text-blue-400"   onClick={() => setPage('scribe')} />
            <QuickAction icon={CalendarPlus} label="Schedule" desc="New appointment" iconColor="text-emerald-600 dark:text-emerald-400" onClick={() => setPage('appointments')} />
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Recent Sessions</span>
            <button onClick={() => setPage('sessions')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5">
              View all <ChevronRight size={12} />
            </button>
          </div>
          <div className="p-5 space-y-3">
            {sessions.length === 0 ? (
              <div className="text-center py-6">
                <Folder size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">No sessions yet</p>
              </div>
            ) : sessions.slice(0, 4).map(s => (
              <div key={s.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                  <Mic2 size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{s.filename}</p>
                  <p className="text-xs text-slate-400">{format(new Date(s.date), 'dd MMM yyyy · HH:mm')}</p>
                </div>
                <button
                  onClick={() => { setCurrentResult(s.result); setPage('scribe') }}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <Eye size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Today's Appointments */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Today's Appointments</span>
          <button onClick={() => setPage('appointments')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5">
            Manage <ChevronRight size={12} />
          </button>
        </div>
        <div className="p-5">
          {todayAppts.length === 0 ? (
            <div className="text-center py-6">
              <CalendarX size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">No appointments scheduled for today</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {todayAppts.map(a => (
                <div key={a.id} className="py-3 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <CalendarCheck size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{a.patientName}</p>
                    <p className="text-xs text-slate-400">{a.time} · {a.reason}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_CLS[a.status] || ''}`}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
