import { useState } from 'react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import {
  CalendarPlus, Search, X, Eye, Pencil, Trash2,
  Phone, Mail, Clock, User, Stethoscope, StickyNote, Filter,
} from 'lucide-react'
import { useApp } from '../context/AppContext'

const STATUS_CLS = {
  scheduled: 'bg-blue-50  dark:bg-blue-900/20  text-blue-700  dark:text-blue-400',
  confirmed:  'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
  completed:  'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400',
  cancelled:  'bg-red-50   dark:bg-red-900/20   text-red-700   dark:text-red-400',
}

const EMPTY = {
  patientName: '', doctor: '', date: '', time: '09:00',
  duration: '30', status: 'scheduled', reason: '',
  phone: '', email: '', notes: '',
}

/* ── Shared input class ─────────────────────────────────────── */
const INP = 'w-full px-3 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-colors'
const LBL = 'block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1'

/* ── Form Modal ─────────────────────────────────────────────── */
function FormModal({ title, form, setForm, onClose, onSave }) {
  const field = (label, id, type = 'text', placeholder = '', extra = {}) => (
    <div className={extra.full ? 'col-span-2' : ''}>
      <label className={LBL}>{label}</label>
      {extra.select ? (
        <select value={form[id]} onChange={e => setForm(f => ({ ...f, [id]: e.target.value }))} className={INP}>
          {extra.select.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      ) : extra.textarea ? (
        <textarea
          value={form[id]} onChange={e => setForm(f => ({ ...f, [id]: e.target.value }))}
          placeholder={placeholder} rows={3} className={INP + ' resize-none'}
        />
      ) : (
        <input
          type={type} value={form[id]} onChange={e => setForm(f => ({ ...f, [id]: e.target.value }))}
          placeholder={placeholder} className={INP}
        />
      )}
    </div>
  )

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          {field('Patient Name *',   'patientName', 'text',  'Full name')}
          {field('Doctor / Physician', 'doctor',   'text',  'Dr. Name')}
          {field('Date *',           'date',        'date')}
          {field('Time *',           'time',        'time')}
          {field('Duration',         'duration',    'text',  '', { select: [['15','15 min'],['30','30 min'],['45','45 min'],['60','1 hour'],['90','1.5 hours']] })}
          {field('Status',           'status',      'text',  '', { select: [['scheduled','Scheduled'],['confirmed','Confirmed'],['completed','Completed'],['cancelled','Cancelled']] })}
          {field('Reason for Visit *', 'reason',   'text',  'Chief complaint', { full: true })}
          {field('Contact Phone',    'phone',       'tel',   '+91 XXXXX XXXXX')}
          {field('Contact Email',    'email',       'email', 'patient@email.com')}
          {field('Notes',            'notes',       'text',  'Additional notes...', { full: true, textarea: true })}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-700">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            Cancel
          </button>
          <button onClick={onSave} className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Save Appointment
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Detail Modal ───────────────────────────────────────────── */
function DetailModal({ appt, onClose, onEdit }) {
  if (!appt) return null

  const row = (Icon, label, val) => val ? (
    <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
      <Icon size={14} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-sm text-slate-700 dark:text-slate-200 mt-0.5">{val}</p>
      </div>
    </div>
  ) : null

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Appointment Details</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-2">
          {row(User,        'Patient',     appt.patientName)}
          {row(Stethoscope, 'Doctor',      appt.doctor || '—')}
          {row(Clock,       'Date & Time', `${appt.date ? format(new Date(appt.date + 'T00:00'), 'dd MMM yyyy') : ''} at ${appt.time} (${appt.duration} min)`)}
          {row(StickyNote,  'Reason',      appt.reason)}
          <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <Filter size={14} className="text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Status</p>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full mt-1 inline-block ${STATUS_CLS[appt.status]}`}>
                {appt.status}
              </span>
            </div>
          </div>
          {row(Phone,      'Phone', appt.phone)}
          {row(Mail,       'Email', appt.email)}
          {row(StickyNote, 'Notes', appt.notes)}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-700">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            Close
          </button>
          <button onClick={onEdit} className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 transition-colors">
            <Pencil size={13} /> Edit
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Main Page ──────────────────────────────────────────────── */
export default function Appointments() {
  const { appointments, upsertAppointment, removeAppointment } = useApp()

  const [showModal,    setShowModal]    = useState(false)
  const [showDetail,   setShowDetail]   = useState(null)
  const [form,         setForm]         = useState(EMPTY)
  const [editId,       setEditId]       = useState(null)
  const [search,       setSearch]       = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDate,   setFilterDate]   = useState('')

  function openNew() {
    setEditId(null)
    setForm({ ...EMPTY, date: new Date().toISOString().slice(0, 10) })
    setShowModal(true)
  }

  function openEdit(appt) {
    setEditId(appt.id)
    setForm({
      patientName: appt.patientName, doctor: appt.doctor || '',
      date: appt.date, time: appt.time, duration: appt.duration,
      status: appt.status, reason: appt.reason,
      phone: appt.phone || '', email: appt.email || '', notes: appt.notes || '',
    })
    setShowModal(true)
    setShowDetail(null)
  }

  function save() {
    if (!form.patientName || !form.date || !form.time || !form.reason) {
      toast.error('Fill in all required fields'); return
    }
    upsertAppointment({ ...form, id: editId ?? Date.now(), createdAt: editId ? undefined : new Date().toISOString() })
    setShowModal(false)
    toast.success(editId ? 'Appointment updated' : 'Appointment scheduled!')
  }

  function del(id) {
    if (!confirm('Delete this appointment?')) return
    removeAppointment(id)
    toast('Appointment deleted', { icon: '🗑️' })
  }

  function updateStatus(id, status) {
    const a = appointments.find(x => x.id === id)
    if (a) upsertAppointment({ ...a, status })
  }

  const filtered = appointments.filter(a => {
    const q = search.toLowerCase()
    return (!q || a.patientName.toLowerCase().includes(q) || a.reason.toLowerCase().includes(q))
        && (!filterStatus || a.status === filterStatus)
        && (!filterDate   || a.date   === filterDate)
  })

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage patient appointments · {appointments.length} total
        </p>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <CalendarPlus size={15} /> New Appointment
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search patient or reason..."
              className={INP + ' pl-9'}
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className={INP + ' w-40'}
          >
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <input
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className={INP + ' w-44'}
          />
          {(search || filterStatus || filterDate) && (
            <button
              onClick={() => { setSearch(''); setFilterStatus(''); setFilterDate('') }}
              className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1 transition-colors"
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">All Appointments</span>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-700">
                {['Patient', 'Date & Time', 'Doctor', 'Reason', 'Duration', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <CalendarPlus size={32} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm text-slate-400 dark:text-slate-500">
                      {appointments.length === 0 ? 'No appointments yet — create one above' : 'No results for current filters'}
                    </p>
                  </td>
                </tr>
              ) : filtered.map(a => (
                <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{a.patientName}</p>
                    {a.phone && <p className="text-xs text-slate-400">{a.phone}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {a.date ? format(new Date(a.date + 'T00:00'), 'dd MMM yyyy') : '—'}
                    </p>
                    <p className="text-xs text-slate-400">{a.time} · {a.duration} min</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                    {a.doctor || <span className="text-slate-300 dark:text-slate-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 max-w-[160px] truncate">
                    {a.reason}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                    {a.duration} min
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={a.status}
                      onChange={e => updateStatus(a.id, e.target.value)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border-0 cursor-pointer ${STATUS_CLS[a.status]}`}
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setShowDetail(a)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      ><Eye size={13} /></button>
                      <button
                        onClick={() => openEdit(a)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      ><Pencil size={13} /></button>
                      <button
                        onClick={() => del(a.id)}
                        className="p-1.5 rounded-lg border border-red-100 dark:border-red-900/40 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      ><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal  && <FormModal title={editId ? 'Edit Appointment' : 'New Appointment'} form={form} setForm={setForm} onClose={() => setShowModal(false)} onSave={save} />}
      {showDetail && <DetailModal appt={showDetail} onClose={() => setShowDetail(null)} onEdit={() => openEdit(showDetail)} />}
    </div>
  )
}
