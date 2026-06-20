import { useState } from 'react'
import toast from 'react-hot-toast'
import { format, addDays } from 'date-fns'
import { Clock, CalendarX, CheckCircle, Plus, X, Save } from 'lucide-react'
import { useApp } from '../context/AppContext'

const INP = 'px-3 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-colors'

const DAYS = [
  { idx: 0, short: 'Sun', full: 'Sunday' },
  { idx: 1, short: 'Mon', full: 'Monday' },
  { idx: 2, short: 'Tue', full: 'Tuesday' },
  { idx: 3, short: 'Wed', full: 'Wednesday' },
  { idx: 4, short: 'Thu', full: 'Thursday' },
  { idx: 5, short: 'Fri', full: 'Friday' },
  { idx: 6, short: 'Sat', full: 'Saturday' },
]

export default function DoctorAvailability() {
  const { availability, setAvailability, appointments } = useApp()

  const [local, setLocal]   = useState({ ...availability })
  const [newDate, setNewDate] = useState('')

  const today = new Date().toISOString().slice(0, 10)

  function toggleDay(idx) {
    setLocal(av => {
      const has = av.workDays.includes(idx)
      return { ...av, workDays: has ? av.workDays.filter(d => d !== idx) : [...av.workDays, idx].sort() }
    })
  }

  function addBlockedDate() {
    if (!newDate) { toast.error('Pick a date first'); return }
    if (newDate < today) { toast.error('Cannot block a past date'); return }
    if (local.blockedDates.includes(newDate)) { toast.error('Already blocked'); return }
    setLocal(av => ({ ...av, blockedDates: [...av.blockedDates, newDate].sort() }))
    setNewDate('')
  }

  function removeBlockedDate(date) {
    setLocal(av => ({ ...av, blockedDates: av.blockedDates.filter(d => d !== date) }))
  }

  function save() {
    if (!local.workDays.length) { toast.error('Select at least one work day'); return }
    if (local.startTime >= local.endTime) { toast.error('End time must be after start time'); return }
    setAvailability(local)
    toast.success('Availability saved! Patients will see your updated schedule.')
  }

  // Calculate total slots per day
  const [sh, sm] = local.startTime.split(':').map(Number)
  const [eh, em] = local.endTime.split(':').map(Number)
  const totalMins  = Math.max(0, (eh * 60 + em) - (sh * 60 + sm))
  const slotsPerDay = Math.floor(totalMins / local.slotDuration)

  // Upcoming appointments for quick reference
  const upcoming = appointments
    .filter(a => a.date >= today && a.status !== 'cancelled')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5)

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-violet-600 rounded-2xl p-6 text-white">
        <h2 className="text-xl font-bold mb-1">Manage Your Availability</h2>
        <p className="text-blue-100 text-sm">
          Set your working hours and days. Patients can only book within these slots.
        </p>
      </div>

      <div className="grid grid-cols-5 gap-5">

        {/* ── Left: Settings ───────────────────────────────── */}
        <div className="col-span-3 space-y-5">

          {/* Work days */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Working Days</span>
            </div>
            <div className="p-5 grid grid-cols-7 gap-2">
              {DAYS.map(({ idx, short, full }) => {
                const active = local.workDays.includes(idx)
                return (
                  <button
                    key={idx}
                    onClick={() => toggleDay(idx)}
                    title={full}
                    className={`flex flex-col items-center py-3 rounded-xl border-2 transition-all ${
                      active
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                        : 'border-slate-200 dark:border-slate-600 text-slate-400 hover:border-slate-300 dark:hover:border-slate-500'
                    }`}
                  >
                    <span className="text-xs font-bold">{short}</span>
                    {active && <CheckCircle size={12} className="mt-1 text-blue-500 dark:text-blue-400" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Working hours */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Working Hours</span>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Start Time</label>
                  <input
                    type="time"
                    value={local.startTime}
                    onChange={e => setLocal(av => ({ ...av, startTime: e.target.value }))}
                    className={INP + ' w-full'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">End Time</label>
                  <input
                    type="time"
                    value={local.endTime}
                    onChange={e => setLocal(av => ({ ...av, endTime: e.target.value }))}
                    className={INP + ' w-full'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Slot Duration</label>
                  <select
                    value={local.slotDuration}
                    onChange={e => setLocal(av => ({ ...av, slotDuration: Number(e.target.value) }))}
                    className={INP + ' w-full'}
                  >
                    <option value={15}>15 min</option>
                    <option value={20}>20 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                  </select>
                </div>
              </div>

              {/* Summary */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-sm">
                <Clock size={14} className="text-blue-500 flex-shrink-0" />
                <span className="text-blue-700 dark:text-blue-300">
                  <strong>{slotsPerDay}</strong> slots/day · {local.startTime} – {local.endTime} · every {local.slotDuration} min
                </span>
              </div>
            </div>
          </div>

          {/* Blocked dates */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Blocked Dates</span>
              <p className="text-xs text-slate-400 mt-0.5">Specific dates you are unavailable (holiday, leave, etc.)</p>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex gap-2">
                <input
                  type="date"
                  value={newDate}
                  min={today}
                  onChange={e => setNewDate(e.target.value)}
                  className={INP + ' flex-1'}
                />
                <button
                  onClick={addBlockedDate}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors"
                >
                  <Plus size={14} /> Block
                </button>
              </div>

              {local.blockedDates.length === 0 ? (
                <div className="text-center py-4">
                  <CalendarX size={24} className="mx-auto text-slate-300 dark:text-slate-600 mb-1" />
                  <p className="text-xs text-slate-400 dark:text-slate-500">No blocked dates</p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {local.blockedDates.map(date => (
                    <div key={date} className="flex items-center justify-between px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
                      <div className="flex items-center gap-2">
                        <CalendarX size={13} className="text-red-400" />
                        <span className="text-sm text-red-700 dark:text-red-400 font-semibold">
                          {format(new Date(date + 'T00:00:00'), 'EEE, MMM d yyyy')}
                        </span>
                      </div>
                      <button
                        onClick={() => removeBlockedDate(date)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Save */}
          <button
            onClick={save}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors shadow-sm"
          >
            <Save size={15} /> Save Availability
          </button>
        </div>

        {/* ── Right: Upcoming bookings preview ─────────────── */}
        <div className="col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Upcoming Bookings</span>
              <p className="text-xs text-slate-400 mt-0.5">Existing bookings — cannot overlap</p>
            </div>
            {upcoming.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle size={24} className="mx-auto text-slate-300 dark:text-slate-600 mb-1" />
                <p className="text-xs text-slate-400">No upcoming bookings</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-700">
                {upcoming.map(a => (
                  <div key={a.id} className="px-4 py-3">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{a.patientName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {format(new Date(a.date + 'T00:00:00'), 'EEE, MMM d')} · {a.time}
                    </p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                      a.status === 'confirmed' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                        : a.status === 'scheduled' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                    }`}>
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Availability summary card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 space-y-2">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Current Settings</p>
            <div className="flex flex-wrap gap-1">
              {DAYS.filter(d => availability.workDays.includes(d.idx)).map(d => (
                <span key={d.idx} className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                  {d.short}
                </span>
              ))}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {availability.startTime} – {availability.endTime} · {availability.slotDuration} min slots
            </p>
            {availability.blockedDates.length > 0 && (
              <p className="text-xs text-red-500 dark:text-red-400">
                {availability.blockedDates.length} blocked date{availability.blockedDates.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
