import { useState, useMemo } from 'react'
import toast from 'react-hot-toast'
import { format, addDays } from 'date-fns'
import { CalendarCheck, Clock, AlertCircle, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { useApp } from '../context/AppContext'

const INP = 'w-full px-3 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 transition-colors'
const LBL  = 'block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_FULL  = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function generateSlots(date, availability, appointments) {
  const day = new Date(date + 'T00:00:00').getDay()
  if (!availability.workDays.includes(day)) return null  // not a work day
  if (availability.blockedDates.includes(date)) return null  // doctor away

  const [sh, sm] = availability.startTime.split(':').map(Number)
  const [eh, em] = availability.endTime.split(':').map(Number)
  const dur = availability.slotDuration

  const slots = []
  let cur = sh * 60 + sm
  const end = eh * 60 + em

  while (cur + dur <= end) {
    const h    = Math.floor(cur / 60)
    const m    = cur % 60
    const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    const booked = appointments.some(
      a => a.date === date && a.time === time && a.status !== 'cancelled'
    )
    slots.push({ time, booked })
    cur += dur
  }
  return slots
}

export default function PatientBook() {
  const { appointments, upsertAppointment, availability } = useApp()

  const today     = new Date().toISOString().slice(0, 10)
  const [weekOffset, setWeekOffset] = useState(0)
  const [selected, setSelected]     = useState(null)  // { date, time }
  const [name,     setName]         = useState('')
  const [reason,   setReason]       = useState('')
  const [phone,    setPhone]        = useState('')

  // Build 7-day window starting from today + weekOffset*7
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(new Date(today + 'T00:00:00'), weekOffset * 7 + i)
      return d.toISOString().slice(0, 10)
    })
  }, [today, weekOffset])

  // Slots for each visible day
  const daySlots = useMemo(() => {
    return days.map(date => ({
      date,
      slots: generateSlots(date, availability, appointments),
    }))
  }, [days, availability, appointments])

  // Slots for the currently focused date (for mobile-style detail view)
  const [focusDate, setFocusDate] = useState(null)
  const focusSlots = focusDate
    ? (daySlots.find(d => d.date === focusDate)?.slots ?? null)
    : null

  function book() {
    if (!selected) { toast.error('Pick a time slot first'); return }
    if (!name.trim()) { toast.error('Enter your name'); return }
    if (!reason.trim()) { toast.error('Enter the reason for your visit'); return }

    upsertAppointment({
      id:          Date.now(),
      patientName: name.trim(),
      doctor:      '',
      date:        selected.date,
      time:        selected.time,
      duration:    String(availability.slotDuration),
      status:      'scheduled',
      reason:      reason.trim(),
      phone:       phone.trim(),
      email:       '',
      notes:       '',
      createdAt:   new Date().toISOString(),
    })
    toast.success('Appointment booked! Your doctor will confirm shortly.')
    setSelected(null)
    setName('')
    setReason('')
    setPhone('')
  }

  const isDayAvailable = date => {
    const slots = daySlots.find(d => d.date === date)?.slots
    return slots !== null && slots !== undefined && slots.some(s => !s.booked)
  }

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
        <h2 className="text-xl font-bold mb-1">Book an Appointment</h2>
        <p className="text-emerald-100 text-sm">
          Pick an available slot below. Your doctor will confirm the booking.
        </p>
      </div>

      <div className="grid grid-cols-5 gap-5">

        {/* ── Left: Calendar + Slots ────────────────────────── */}
        <div className="col-span-3 space-y-4">

          {/* Week navigator */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-700">
              <button
                onClick={() => { setWeekOffset(w => Math.max(0, w - 1)); setFocusDate(null); setSelected(null) }}
                disabled={weekOffset === 0}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {format(new Date(days[0] + 'T00:00:00'), 'MMM d')} – {format(new Date(days[6] + 'T00:00:00'), 'MMM d, yyyy')}
              </span>
              <button
                onClick={() => { setWeekOffset(w => Math.min(8, w + 1)); setFocusDate(null); setSelected(null) }}
                disabled={weekOffset >= 8}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Day strip */}
            <div className="grid grid-cols-7 divide-x divide-slate-100 dark:divide-slate-700">
              {daySlots.map(({ date, slots }) => {
                const isToday  = date === today
                const isPast   = date < today
                const avail    = !isPast && slots !== null
                const hasOpen  = avail && slots.some(s => !s.booked)
                const focused  = focusDate === date

                return (
                  <button
                    key={date}
                    disabled={isPast || !avail}
                    onClick={() => { setFocusDate(focused ? null : date); setSelected(null) }}
                    className={`flex flex-col items-center py-3 px-1 transition-colors text-center ${
                      focused
                        ? 'bg-emerald-50 dark:bg-emerald-900/20'
                        : isPast || !avail
                          ? 'opacity-30 cursor-not-allowed'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                      {DAY_NAMES[new Date(date + 'T00:00:00').getDay()]}
                    </span>
                    <span className={`text-sm font-bold mt-1 w-7 h-7 rounded-full flex items-center justify-center ${
                      isToday
                        ? 'bg-emerald-500 text-white'
                        : focused
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-700 dark:text-slate-200'
                    }`}>
                      {new Date(date + 'T00:00:00').getDate()}
                    </span>
                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${
                      !avail || isPast ? 'bg-transparent'
                        : hasOpen ? 'bg-emerald-400' : 'bg-red-400'
                    }`} />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Slot grid for focused day */}
          {focusDate && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {format(new Date(focusDate + 'T00:00:00'), 'EEEE, MMMM d')}
                </span>
              </div>

              {focusSlots === null ? (
                <div className="flex items-center gap-3 px-5 py-5 text-slate-500">
                  <XCircle size={18} className="text-red-400 flex-shrink-0" />
                  <p className="text-sm">Doctor is not available on {DAY_FULL[new Date(focusDate + 'T00:00:00').getDay()]}s</p>
                </div>
              ) : focusSlots.length === 0 ? (
                <div className="flex items-center gap-3 px-5 py-5 text-slate-500">
                  <AlertCircle size={18} className="text-amber-400 flex-shrink-0" />
                  <p className="text-sm">No slots configured for this day</p>
                </div>
              ) : (
                <div className="p-4 grid grid-cols-4 gap-2">
                  {focusSlots.map(({ time, booked }) => {
                    const isSelected = selected?.date === focusDate && selected?.time === time
                    return (
                      <button
                        key={time}
                        disabled={booked}
                        onClick={() => setSelected(booked ? null : { date: focusDate, time })}
                        className={`py-2 rounded-lg text-sm font-semibold border transition-all ${
                          booked
                            ? 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 text-slate-300 dark:text-slate-600 cursor-not-allowed line-through'
                            : isSelected
                              ? 'border-emerald-500 bg-emerald-500 text-white shadow-md scale-105'
                              : 'border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                        }`}
                      >
                        {time}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Legend */}
              <div className="flex gap-4 px-5 pb-4 text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border-2 border-emerald-400 inline-block" /> Available</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Selected</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-600 inline-block" /> Booked</span>
              </div>
            </div>
          )}

          {/* Prompt if no day selected */}
          {!focusDate && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm px-5 py-8 text-center">
              <CalendarCheck size={32} className="mx-auto text-slate-200 dark:text-slate-600 mb-2" />
              <p className="text-sm text-slate-400 dark:text-slate-500">Click a date above to see available time slots</p>
              <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-1" />available &nbsp;
                <span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-1" />fully booked &nbsp;
                <span className="inline-block w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 mr-1" />unavailable
              </p>
            </div>
          )}
        </div>

        {/* ── Right: Booking Form ───────────────────────────── */}
        <div className="col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Your Details</span>
            </div>
            <div className="p-5 space-y-4">

              {/* Selected slot summary */}
              {selected ? (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-bold text-emerald-700 dark:text-emerald-400">
                      {format(new Date(selected.date + 'T00:00:00'), 'EEEE, MMM d')}
                    </p>
                    <p className="text-emerald-600 dark:text-emerald-500 flex items-center gap-1 mt-0.5">
                      <Clock size={12} /> {selected.time} · {availability.slotDuration} min
                    </p>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="ml-auto text-emerald-400 hover:text-emerald-600 transition-colors"
                  >
                    <XCircle size={15} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600 text-slate-400 text-sm">
                  <CalendarCheck size={15} />
                  No slot selected yet
                </div>
              )}

              <div>
                <label className={LBL}>Your Name *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" className={INP} />
              </div>

              <div>
                <label className={LBL}>Reason for Visit *</label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Describe your symptoms or reason..."
                  rows={3}
                  className={INP + ' resize-none'}
                />
              </div>

              <div>
                <label className={LBL}>Phone (optional)</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" type="tel" className={INP} />
              </div>

              <button
                onClick={book}
                disabled={!selected || !name.trim() || !reason.trim()}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-colors"
              >
                Confirm Booking
              </button>

              <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
                Status will show as <strong>Scheduled</strong> until your doctor confirms.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
