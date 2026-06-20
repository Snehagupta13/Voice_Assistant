import { useApp } from '../context/AppContext'
import { format } from 'date-fns'
import { CalendarCheck, Clock, Stethoscope, CalendarX, CalendarPlus } from 'lucide-react'

const STATUS_CLS = {
  scheduled: 'bg-blue-50  dark:bg-blue-900/20  text-blue-700  dark:text-blue-400',
  confirmed:  'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
  completed:  'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400',
  cancelled:  'bg-red-50   dark:bg-red-900/20   text-red-600   dark:text-red-400',
}

const STATUS_MSG = {
  scheduled: 'Awaiting confirmation from your doctor',
  confirmed:  'Confirmed — please arrive 10 min early',
  completed:  'Visit completed',
  cancelled:  'Appointment cancelled',
}

export default function PatientAppointments() {
  const { appointments, setPage } = useApp()

  const today = new Date().toISOString().slice(0, 10)

  const upcoming = appointments
    .filter(a => a.date >= today && a.status !== 'cancelled')
    .sort((a, b) => a.date.localeCompare(b.date))

  const past = appointments
    .filter(a => a.date < today || a.status === 'cancelled')
    .sort((a, b) => b.date.localeCompare(a.date))

  function Section({ title, items, empty }) {
    if (items.length === 0) return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm px-5 py-8 text-center">
        <CalendarX size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
        <p className="text-sm text-slate-500 dark:text-slate-400">{empty}</p>
      </div>
    )

    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</span>
          <span className="ml-2 text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
            {items.length}
          </span>
        </div>
        <div className="divide-y divide-slate-50 dark:divide-slate-700">
          {items.map(a => (
            <div key={a.id} className="px-5 py-4 flex gap-4">

              {/* Date badge */}
              <div className="w-12 flex-shrink-0 text-center">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
                  {format(new Date(a.date + 'T00:00:00'), 'MMM')}
                </p>
                <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 leading-tight">
                  {format(new Date(a.date + 'T00:00:00'), 'd')}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {format(new Date(a.date + 'T00:00:00'), 'EEE')}
                </p>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{a.reason}</p>

                <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> {a.time} · {a.duration} min
                  </span>
                  {a.doctor && (
                    <span className="flex items-center gap-1">
                      <Stethoscope size={11} /> {a.doctor}
                    </span>
                  )}
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${STATUS_CLS[a.status]}`}>
                    {a.status}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {STATUS_MSG[a.status]}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">My Appointments</h2>
          <p className="text-sm text-slate-400 mt-0.5">{appointments.length} total · {upcoming.length} upcoming</p>
        </div>
        <button
          onClick={() => setPage('patient-book')}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors"
        >
          <CalendarPlus size={15} /> Book Appointment
        </button>
      </div>

      {/* Status guide */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 flex flex-wrap gap-4 text-xs">
        {Object.entries(STATUS_CLS).map(([s, cls]) => (
          <span key={s} className={`font-bold px-2.5 py-1 rounded-full ${cls}`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </span>
        ))}
        <span className="text-slate-400 self-center">— your doctor updates these as your visit progresses</span>
      </div>

      <Section
        title="Upcoming"
        items={upcoming}
        empty="No upcoming appointments — book one now!"
      />

      {past.length > 0 && (
        <Section
          title="Past & Cancelled"
          items={past}
          empty=""
        />
      )}
    </div>
  )
}
