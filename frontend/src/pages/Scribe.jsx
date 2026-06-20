import { useState, useRef, useEffect } from 'react'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import {
  Mic, Square, Send, Upload, CloudUpload, Server,
  FileDown, Copy, Save, CalendarPlus, Stethoscope,
  BookOpen, Activity, Clock, Pill, AlertTriangle,
  FlaskConical, Search, ClipboardList, CalendarCheck, Archive,
  BellRing, Leaf, Flame, Wind, Droplets,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { parseResult } from '../utils/parseResult'
import { generatePDF } from '../utils/pdf'

const ICONS = {
  'Chief Complaint':            Stethoscope,
  'History of Present Illness': BookOpen,
  'Symptoms':                   Activity,
  'Duration':                   Clock,
  'Past Medical History':       Archive,
  'Current Medications':        Pill,
  'Medications':                Pill,
  'Allergies':                  AlertTriangle,
  'Vital Signs':                Activity,
  'Recommended Tests':          FlaskConical,
  'Assessment':                 Search,
  'Diagnosis':                  Search,
  'Plan':                       ClipboardList,
  'Treatment Plan':             ClipboardList,
  'Follow-up':                  CalendarCheck,
  'Follow-up Instructions':     CalendarCheck,
}

/* ── Markdown renderer components ───────────────────────────── */
const MD = {
  h1: ({ children }) => (
    <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-6 mb-3 pb-2 border-b border-slate-200 dark:border-slate-600 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-base font-bold text-blue-700 dark:text-blue-400 mt-5 mb-2 flex items-center gap-1.5">
      <span className="w-1 h-4 rounded-full bg-blue-500 dark:bg-blue-400 inline-block" />
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-3 mb-1.5 uppercase tracking-wide">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-sm text-slate-700 dark:text-slate-300 leading-7 mb-2">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mb-3 space-y-1 ml-2">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 space-y-1 ml-4 list-decimal">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-400 dark:bg-blue-500 flex-shrink-0" />
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-slate-900 dark:text-white">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-slate-600 dark:text-slate-400">{children}</em>
  ),
  hr: () => <hr className="my-4 border-slate-200 dark:border-slate-600" />,
}

/* ── Clinical Note ──────────────────────────────────────────── */
const SECTION_COLOR = {
  'Chief Complaint':            'border-red-400 bg-red-50 dark:bg-red-900/10',
  'History of Present Illness': 'border-blue-400 bg-blue-50 dark:bg-blue-900/10',
  'Symptoms':                   'border-orange-400 bg-orange-50 dark:bg-orange-900/10',
  'Duration':                   'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10',
  'Past Medical History':       'border-purple-400 bg-purple-50 dark:bg-purple-900/10',
  'Current Medications':        'border-teal-400 bg-teal-50 dark:bg-teal-900/10',
  'Medications':                'border-teal-400 bg-teal-50 dark:bg-teal-900/10',
  'Allergies':                  'border-rose-400 bg-rose-50 dark:bg-rose-900/10',
  'Vital Signs':                'border-pink-400 bg-pink-50 dark:bg-pink-900/10',
  'Recommended Tests':          'border-cyan-400 bg-cyan-50 dark:bg-cyan-900/10',
  'Assessment':                 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/10',
  'Diagnosis':                  'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/10',
  'Plan':                       'border-green-400 bg-green-50 dark:bg-green-900/10',
  'Treatment Plan':             'border-green-400 bg-green-50 dark:bg-green-900/10',
  'Follow-up':                  'border-slate-400 bg-slate-50 dark:bg-slate-700/30',
  'Follow-up Instructions':     'border-slate-400 bg-slate-50 dark:bg-slate-700/30',
}

const LABEL_COLOR = {
  'Chief Complaint':            'text-red-700 dark:text-red-400',
  'History of Present Illness': 'text-blue-700 dark:text-blue-400',
  'Symptoms':                   'text-orange-700 dark:text-orange-400',
  'Duration':                   'text-yellow-700 dark:text-yellow-500',
  'Past Medical History':       'text-purple-700 dark:text-purple-400',
  'Current Medications':        'text-teal-700 dark:text-teal-400',
  'Medications':                'text-teal-700 dark:text-teal-400',
  'Allergies':                  'text-rose-700 dark:text-rose-400',
  'Vital Signs':                'text-pink-700 dark:text-pink-400',
  'Recommended Tests':          'text-cyan-700 dark:text-cyan-400',
  'Assessment':                 'text-indigo-700 dark:text-indigo-400',
  'Diagnosis':                  'text-indigo-700 dark:text-indigo-400',
  'Plan':                       'text-green-700 dark:text-green-400',
  'Treatment Plan':             'text-green-700 dark:text-green-400',
  'Follow-up':                  'text-slate-600 dark:text-slate-400',
  'Follow-up Instructions':     'text-slate-600 dark:text-slate-400',
}

function ClinicalNote({ parsed }) {
  // Markdown output — render with rich components
  if (parsed.isMarkdown) {
    return (
      <div className="px-1">
        <ReactMarkdown components={MD}>{parsed.clinicalNote}</ReactMarkdown>
      </div>
    )
  }

  // Legacy key-value sections
  const entries = Object.entries(parsed.sections)
  if (entries.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600">
        <pre className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 leading-7 font-sans">
          {parsed.clinicalNote || parsed.raw}
        </pre>
      </div>
    )
  }
  return (
    <div className="space-y-2.5">
      {entries.map(([key, val]) => {
        const Icon    = ICONS[key]
        const empty   = !val || val.trim() === 'Not Mentioned' || val.trim() === ''
        const lines   = val ? val.split('\n').map(l => l.trim()).filter(Boolean) : []
        const isList  = lines.some(l => l.startsWith('-'))
        const cardCls = SECTION_COLOR[key] || 'border-blue-400 bg-blue-50 dark:bg-blue-900/10'
        const lblCls  = LABEL_COLOR[key]   || 'text-blue-700 dark:text-blue-400'
        return (
          <div key={key} className={`rounded-xl border-l-4 px-4 py-3 ${empty ? 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/20' : cardCls}`}>
            <div className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest mb-1.5 ${empty ? 'text-slate-400' : lblCls}`}>
              {Icon && <Icon size={11} strokeWidth={2.5} />}{key}
            </div>
            {empty ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 italic">Not mentioned</p>
            ) : isList ? (
              <ul className="space-y-1 mt-0.5">
                {lines.filter(l => l.startsWith('-')).map((l, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current flex-shrink-0 opacity-60" />
                    {l.replace(/^-\s*/, '')}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">{lines.join(' ')}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── Conversation ───────────────────────────────────────────── */
function parseConversation(text) {
  const messages = []
  let currentRole = null

  // Build a speaker→role map for SPEAKER_XX style labels.
  // The first speaker encountered becomes 'doctor', the second 'patient'.
  const speakerMap = {}
  const speakerRoles = ['doctor', 'patient']

  const resolveRole = (speaker) => {
    if (!(speaker in speakerMap)) {
      speakerMap[speaker] = speakerRoles[Object.keys(speakerMap).length % 2]
    }
    return speakerMap[speaker]
  }

  for (const raw of text.split('\n')) {
    const line = raw.trim().replace(/\*{1,2}(Doctor|Patient)\*{1,2}:/gi, '$1:')
    if (!line) continue
    const inlineDoc = line.match(/^Doctor:\s+(.+)/i)
    const inlinePat = line.match(/^Patient:\s+(.+)/i)
    const inlineSpk = line.match(/^(SPEAKER_\w+):\s+(.+)/i)
    if (inlineDoc) {
      messages.push({ role: 'doctor', text: inlineDoc[1].replace(/\*{1,2}(.*?)\*{1,2}/g, '$1') })
      currentRole = 'doctor'
    } else if (inlinePat) {
      messages.push({ role: 'patient', text: inlinePat[1].replace(/\*{1,2}(.*?)\*{1,2}/g, '$1') })
      currentRole = 'patient'
    } else if (inlineSpk) {
      const role = resolveRole(inlineSpk[1].toUpperCase())
      messages.push({ role, text: inlineSpk[2].replace(/\*{1,2}(.*?)\*{1,2}/g, '$1'), label: inlineSpk[1] })
      currentRole = role
    } else if (/^Doctor:\s*$/i.test(line)) {
      currentRole = 'doctor'
    } else if (/^Patient:\s*$/i.test(line)) {
      currentRole = 'patient'
    } else if (currentRole) {
      messages.push({ role: currentRole, text: line.replace(/\*{1,2}(.*?)\*{1,2}/g, '$1') })
    }
  }
  return messages
}

function Conversation({ conversation }) {
  if (!conversation) {
    return <p className="text-sm text-slate-400 text-center py-8">No conversation extracted</p>
  }
  const messages = parseConversation(conversation)
  if (messages.length === 0) {
    // Raw fallback — show the text as-is so nothing is silently swallowed
    return (
      <pre className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 leading-7 font-sans p-2">
        {conversation}
      </pre>
    )
  }
  return (
    <div className="space-y-3">
      {messages.map((msg, i) => {
        const isDoc = msg.role === 'doctor'
        return (
          <div key={i} className={`flex gap-3 ${isDoc ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-1 ${isDoc ? 'bg-blue-600' : 'bg-emerald-500'}`}>
              {isDoc ? 'Dr' : 'Pt'}
            </div>
            <div className={`max-w-[80%] flex flex-col ${isDoc ? 'items-end' : 'items-start'}`}>
              <span className="text-xs text-slate-400 mb-1 font-semibold">{msg.label || (isDoc ? 'Doctor' : 'Patient')}</span>
              <div className={`text-sm px-4 py-2.5 rounded-2xl leading-relaxed ${
                isDoc
                  ? 'bg-blue-600 text-white rounded-tr-sm'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── JSON Viewer ────────────────────────────────────────────── */
function JsonViewer({ data }) {
  if (!data) return <p className="text-sm text-slate-400 text-center py-8">No JSON extracted</p>
  const html = JSON.stringify(data, null, 2)
    .replace(/(".*?")/g,          '<span class="json-key">$1</span>')
    .replace(/: (".*?")/g,        ': <span class="json-str">$1</span>')
    .replace(/: (true|false|null)/g, ': <span class="json-bool">$1</span>')
    .replace(/: (\d+\.?\d*)/g,    ': <span class="json-num">$1</span>')
  return (
    <div className="bg-slate-800 dark:bg-slate-900 rounded-lg p-4 overflow-x-auto">
      <pre className="text-xs leading-relaxed font-mono" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}

/* ── Alert Banner ───────────────────────────────────────────── */
function AlertBanner({ parsed }) {
  const d = parsed.jsonData || {}
  const level = (d.risk_level || 'UNKNOWN').toUpperCase()

  const styles = {
    CRITICAL: { wrap: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',    badge: 'bg-red-600',    text: 'text-red-700 dark:text-red-400' },
    HIGH:     { wrap: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800', badge: 'bg-orange-500', text: 'text-orange-700 dark:text-orange-400' },
    MEDIUM:   { wrap: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',   badge: 'bg-amber-500',  text: 'text-amber-700 dark:text-amber-400' },
    LOW:      { wrap: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',   badge: 'bg-green-600',  text: 'text-green-700 dark:text-green-400' },
  }
  const s = styles[level] || styles.MEDIUM

  return (
    <div className="space-y-4">
      <div className={`rounded-xl border p-5 ${s.wrap}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white flex-shrink-0 ${s.badge}`}>
            <BellRing size={22} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xl font-bold ${s.text}`}>{level} RISK</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold text-white ${s.badge}`}>{level}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Alert Detected: {d.alert_detected || 'YES'}
            </p>
          </div>
        </div>
        {d.reason && (
          <div className="mb-3">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Reason</p>
            <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">{d.reason}</p>
          </div>
        )}
        {d.recommended_action && (
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Recommended Action</p>
            <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">{d.recommended_action}</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Summary Panel ──────────────────────────────────────────── */
function SummaryPanel({ parsed }) {
  const d = parsed.jsonData || {}

  const fields = [
    { key: 'reason_for_visit',   label: 'Reason for Visit',   Icon: Stethoscope },
    { key: 'symptoms',           label: 'Symptoms',           Icon: Activity },
    { key: 'diagnosis',          label: 'Diagnosis',          Icon: Search },
    { key: 'medications',        label: 'Medications',        Icon: Pill },
    { key: 'recommended_tests',  label: 'Recommended Tests',  Icon: FlaskConical },
    { key: 'treatment_plan',     label: 'Treatment Plan',     Icon: ClipboardList },
    { key: 'follow_up',          label: 'Follow-up',          Icon: CalendarCheck },
  ]

  return (
    <div className="space-y-3">
      {d.patient_summary && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">Patient Summary</p>
          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{d.patient_summary}</p>
        </div>
      )}
      {fields.map(({ key, label, Icon }) => {
        const val = d[key]
        if (!val || (Array.isArray(val) && val.length === 0)) return null
        return (
          <div key={key} className="rounded-xl border border-slate-100 dark:border-slate-700 px-4 py-3">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
              <Icon size={11} /> {label}
            </div>
            {Array.isArray(val) ? (
              <ul className="space-y-1">
                {val.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">{val}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── Ayurveda Panel ─────────────────────────────────────────── */
const DOSHA_ICON = { Vata: Wind, Pitta: Flame, Kapha: Droplets }
const DOSHA_COLOR = {
  Vata:  { card: 'border-violet-400 bg-violet-50 dark:bg-violet-900/10', text: 'text-violet-700 dark:text-violet-400', badge: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300' },
  Pitta: { card: 'border-orange-400 bg-orange-50 dark:bg-orange-900/10', text: 'text-orange-700 dark:text-orange-400', badge: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' },
  Kapha: { card: 'border-teal-400 bg-teal-50 dark:bg-teal-900/10',       text: 'text-teal-700 dark:text-teal-400',     badge: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300' },
}

function parseAyurveda(raw) {
  if (!raw) return null
  const [agentBlock, ...rest] = raw.split(/^---\s*$/m)
  const modelOutput = rest.join('---').trim()
  const get = key => { const m = agentBlock.match(new RegExp(key + '\\s*:\\s*(.+)')); return m ? m[1].trim() : null }
  return {
    primary:   get('Primary Imbalance'),
    secondary: get('Secondary'),
    principle: get('Treatment Principle'),
    herbs:     get('Suggested Herbs'),
    modelOutput,
  }
}

function AyurvedaPanel({ raw }) {
  if (!raw) return <p className="text-sm text-slate-400 text-center py-8">No Ayurvedic assessment available</p>
  const d = parseAyurveda(raw)
  if (!d) return <pre className="whitespace-pre-wrap text-xs text-slate-600 dark:text-slate-300">{raw}</pre>

  const primary = d.primary || 'Vata'
  const colors  = DOSHA_COLOR[primary] || DOSHA_COLOR.Vata
  const DoshaIcon = DOSHA_ICON[primary] || Leaf

  return (
    <div className="space-y-4">
      {/* Dosha card */}
      <div className={`rounded-xl border-l-4 px-5 py-4 ${colors.card}`}>
        <div className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest mb-3 ${colors.text}`}>
          <DoshaIcon size={13} strokeWidth={2.5} /> Dosha Analysis
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${colors.badge}`}>
            Primary: {d.primary || '—'}
          </span>
          {d.secondary && d.secondary !== 'None' && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              Secondary: {d.secondary}
            </span>
          )}
        </div>
      </div>

      {/* Treatment principle */}
      {d.principle && (
        <div className="rounded-xl border border-slate-100 dark:border-slate-700 px-4 py-3">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
            <Leaf size={11} /> Treatment Principle
          </div>
          <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">{d.principle}</p>
        </div>
      )}

      {/* Herbs */}
      {d.herbs && (
        <div className="rounded-xl border border-slate-100 dark:border-slate-700 px-4 py-3">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
            <Leaf size={11} /> Suggested Herbs
          </div>
          <div className="flex flex-wrap gap-2">
            {d.herbs.split(',').map(h => (
              <span key={h} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-800">
                {h.trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* MedGemma guidance */}
      {d.modelOutput && (
        <div className="rounded-xl border border-emerald-100 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10 px-4 py-4">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-3">
            <Leaf size={11} /> Ayurvedic Guidance
          </div>
          <pre className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 leading-7 font-sans">{d.modelOutput}</pre>
        </div>
      )}
    </div>
  )
}

/* ── Main Scribe Page ───────────────────────────────────────── */
export default function Scribe() {
  const { currentResult, setCurrentResult, setCurrentAgentType, currentConversation, setCurrentConversation, currentAlertData, setCurrentAlertData, currentSummaryData, setCurrentSummaryData, currentAyurvedaData, setCurrentAyurvedaData, addSession, setPage, incrementReportCount } = useApp()

  const [inputTab,    setInputTab]    = useState('record')
  const [resultTab,   setResultTab]   = useState('clinical')
  const [isRecording, setIsRecording] = useState(false)
  const [hasStopped,  setHasStopped]  = useState(false)
  const [timerSecs,   setTimerSecs]   = useState(0)
  const [file,        setFile]        = useState(null)
  const [isDrag,      setIsDrag]      = useState(false)
  const [processing,  setProcessing]  = useState(false)
  const [apiUrl,    setApiUrl]    = useState('http://localhost:8009')
  const [apiStatus, setApiStatus] = useState('idle')

  const mediaRef    = useRef(null)
  const chunksRef   = useRef([])
  const timerRef    = useRef(null)
  const fileInputRef = useRef(null)

  const parsed = currentResult ? parseResult(currentResult) : null

  useEffect(() => { checkHealth() }, [])
  useEffect(() => {
    if (currentResult) setResultTab('clinical')
  }, [currentResult])

  const getBase = () => apiUrl.trim().replace(/\/$/, '') || 'http://localhost:8009'

  async function checkHealth() {
    setApiStatus('checking')
    try {
      const r = await fetch(`${getBase()}/health`, { signal: AbortSignal.timeout(5000) })
      setApiStatus(r.ok ? 'online' : 'error')
    } catch { setApiStatus('offline') }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []
      const mr = new MediaRecorder(stream)
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.start(200)
      mediaRef.current = mr
      setIsRecording(true); setHasStopped(false); setTimerSecs(0)
      timerRef.current = setInterval(() => setTimerSecs(s => s + 1), 1000)
    } catch (err) { toast.error('Microphone access denied: ' + err.message) }
  }

  function stopRecording() {
    mediaRef.current?.stop()
    mediaRef.current?.stream.getTracks().forEach(t => t.stop())
    clearInterval(timerRef.current)
    setIsRecording(false); setHasStopped(true)
    toast('Recording stopped — click Process to analyze', { icon: '🎙️' })
  }

  async function processRecording() {
    if (!chunksRef.current.length) { toast.error('No audio recorded'); return }
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
    await runPipeline(new File([blob], 'recording.webm', { type: 'audio/webm' }))
    setHasStopped(false); setTimerSecs(0)
  }

  function handleDrop(e) {
    e.preventDefault(); setIsDrag(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  async function runPipeline(audioFile) {
    setProcessing(true)
    try {
      const fd = new FormData()
      fd.append('file', audioFile)
      const r = await fetch(`${getBase()}/process`, { method: 'POST', body: fd })
      if (!r.ok) {
        const err = await r.json().catch(() => ({ detail: `HTTP ${r.status}` }))
        throw new Error(err.detail || `HTTP ${r.status}`)
      }
      const data = await r.json()
      setCurrentResult(data.result)
      setCurrentConversation(data.conversation || null)
      const agentType = data.agent_type || 'medical_scribe'
      setCurrentAgentType(agentType)
      setCurrentAlertData(data.alert_data || null)
      setCurrentSummaryData(data.summary_data || null)
      setCurrentAyurvedaData(data.ayurveda_data || null)
      addSession({ id: Date.now(), filename: audioFile.name, date: new Date().toISOString(), result: data.result, audioUrl: data.audio_url ? `${getBase()}${data.audio_url}` : null, agentType, alertData: data.alert_data || null, summaryData: data.summary_data || null, ayurvedaData: data.ayurveda_data || null })
      toast.success('Clinical note generated!')
    } catch (err) {
      toast.error('Processing failed: ' + err.message)
    } finally {
      setProcessing(false)
    }
  }

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const statusBadge = {
    online:   'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
    offline:  'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',
    checking: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
    idle:     'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
  }

  const tabBtn = (id, label) => (
    <button
      onClick={() => setResultTab(id)}
      className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
        resultTab === id
          ? 'border-blue-600 text-blue-600 dark:text-blue-400'
          : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="grid grid-cols-2 gap-5">

      {/* ── Left: Input Panel ─────────────────────────────── */}
      <div className="space-y-4">

        {/* Mode tabs */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
            {['record', 'upload'].map(t => (
              <button
                key={t}
                onClick={() => setInputTab(t)}
                className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                  inputTab === t
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {t === 'record' ? <><Mic size={15} /> Live Record</> : <><Upload size={15} /> Upload File</>}
              </button>
            ))}
          </div>

          {inputTab === 'record' && (
            <div className="flex flex-col items-center gap-4 py-8 px-6">
              {/* Waveform */}
              <div className={`flex items-end gap-1 h-8 transition-opacity ${isRecording ? 'opacity-100' : 'opacity-0'}`}>
                {Array.from({ length: 8 }, (_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-blue-500 dark:bg-blue-400 rounded-sm wave-bar"
                    style={{ animationDelay: `${i * 0.1}s`, height: '5px' }}
                  />
                ))}
              </div>

              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={processing}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-all ${
                  isRecording ? 'bg-red-500 recording-pulse' : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {isRecording ? <Square size={22} fill="white" /> : <Mic size={22} />}
              </button>

              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                {isRecording ? 'Recording...' : hasStopped ? 'Recording ready' : 'Click to start recording'}
              </p>

              {(isRecording || hasStopped) && (
                <span className="text-2xl font-mono font-bold text-red-500">{fmt(timerSecs)}</span>
              )}

              {hasStopped && (
                <button
                  onClick={processRecording}
                  disabled={processing}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  <Send size={14} /> Process Recording
                </button>
              )}
            </div>
          )}

          {inputTab === 'upload' && (
            <div className="p-5">
              <div
                onClick={() => fileInputRef.current.click()}
                onDragOver={e => { e.preventDefault(); setIsDrag(true) }}
                onDragLeave={() => setIsDrag(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                  isDrag
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                    : 'border-slate-200 dark:border-slate-600 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                }`}
              >
                <CloudUpload size={36} className="mx-auto text-blue-500 dark:text-blue-400 mb-3" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Drop audio file or click to browse</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">MP3 · WAV · M4A · FLAC · OGG</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp3,.wav,.m4a,.flac,.ogg"
                className="hidden"
                onChange={e => setFile(e.target.files[0])}
              />

              {file && (
                <div className="mt-3 flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                  <Upload size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex-1 truncate">{file.name}</span>
                  <button
                    onClick={() => runPipeline(file)}
                    disabled={processing}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Activity size={12} /> Process
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* API Status */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
            <Server size={15} className="text-blue-600 dark:text-blue-400" /> API Status
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-300">Backend Server</span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusBadge[apiStatus]}`}>
              {apiStatus === 'online' ? '● Online' : apiStatus === 'offline' ? '● Offline' : apiStatus === 'checking' ? '◌ Checking...' : '— Idle'}
            </span>
          </div>
          <input
            value={apiUrl}
            onChange={e => setApiUrl(e.target.value.trim())}
            placeholder="http://localhost:8009"
            className="inp"
          />
          {apiStatus === 'offline' && (
            <div className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg px-3 py-2 space-y-1">
              <p className="font-bold">Server is offline</p>
              <p className="text-red-400 dark:text-red-500 font-mono">uv run python main.py</p>
            </div>
          )}
          <button
            onClick={checkHealth}
            className="w-full py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Check Health
          </button>
        </div>

        {/* Processing indicator */}
        {processing && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm p-5 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-slate-100 dark:border-slate-700 border-t-blue-600 rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Running AI pipeline...</p>
            <p className="text-xs text-slate-400">Transcribing · Diarizing · Generating clinical note</p>
          </div>
        )}
      </div>

      {/* ── Right: Results Panel ────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
        {!currentResult ? (
          <div className="flex flex-col items-center justify-center flex-1 py-20 px-6 text-center">
            <Stethoscope size={48} className="text-slate-200 dark:text-slate-600 mb-4" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-200 mb-1">Ready to Process</h3>
            <p className="text-sm text-slate-400 dark:text-slate-500">Record audio or upload a file to generate the clinical note</p>
          </div>
        ) : (
          <>
            {currentAlertData && <AlertBanner parsed={parseResult(currentAlertData)} />}

            <div className="flex border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 overflow-x-auto">
              {tabBtn('clinical',     '📋 Clinical Note')}
              {currentSummaryData && tabBtn('summary', '📊 Summary')}
              {currentAyurvedaData && tabBtn('ayurveda', '🌿 Ayurveda')}
              {tabBtn('conversation', '💬 Conversation')}
              {tabBtn('json',         '{ } JSON')}
              {tabBtn('raw',          '≡ Raw')}
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {resultTab === 'clinical'     && <ClinicalNote parsed={parsed} />}
              {resultTab === 'summary'      && currentSummaryData && <SummaryPanel parsed={parseResult(currentSummaryData)} />}
              {resultTab === 'ayurveda'     && <AyurvedaPanel raw={currentAyurvedaData} />}
              {resultTab === 'conversation' && <Conversation conversation={parsed.conversation || currentConversation} />}
              {resultTab === 'json'         && <JsonViewer data={parsed.jsonData} />}
              {resultTab === 'raw'          && (
                <pre className="whitespace-pre-wrap text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-mono">
                  {currentResult}
                </pre>
              )}
            </div>

            {/* Action bar */}
            <div className="flex flex-wrap gap-2 px-5 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
              <button
                onClick={() => { generatePDF(currentResult); incrementReportCount(); toast.success('PDF downloaded') }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
              >
                <FileDown size={13} /> Download PDF
              </button>
              <button
                onClick={() => { navigator.clipboard.writeText(currentResult); toast.success('Copied!') }}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <Copy size={13} /> Copy
              </button>
              <button
                onClick={() => { addSession({ id: Date.now(), filename: 'Manual Save', date: new Date().toISOString(), result: currentResult }); toast.success('Saved') }}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <Save size={13} /> Save
              </button>
              <button
                onClick={() => setPage('appointments')}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <CalendarPlus size={13} /> Follow-up
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
