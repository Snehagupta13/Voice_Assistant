import { useState, useRef, useEffect } from 'react'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import {
  Mic, Square, Send, Upload, CloudUpload, Server,
  Heart, Activity, Pill, CalendarCheck, Stethoscope,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { parseResult } from '../utils/parseResult'

const PATIENT_SECTIONS = [
  'Chief Complaint', 'Symptoms', 'Medications', 'Current Medications',
  'Treatment Plan', 'Plan', 'Follow-up', 'Follow-up Instructions',
]

const SECTION_ICONS = {
  'Chief Complaint':        Heart,
  'Symptoms':               Activity,
  'Medications':            Pill,
  'Current Medications':    Pill,
  'Treatment Plan':         Stethoscope,
  'Plan':                   Stethoscope,
  'Follow-up':              CalendarCheck,
  'Follow-up Instructions': CalendarCheck,
}

const MD = {
  h1: ({ children }) => <h1 className="text-lg font-bold text-slate-900 dark:text-white mt-5 mb-2 first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mt-4 mb-1.5">{children}</h2>,
  p:  ({ children }) => <p className="text-sm text-slate-700 dark:text-slate-300 leading-7 mb-2">{children}</p>,
  ul: ({ children }) => <ul className="mb-3 space-y-1 ml-2">{children}</ul>,
  li: ({ children }) => (
    <li className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }) => <strong className="font-semibold text-slate-900 dark:text-white">{children}</strong>,
}

function PatientSummary({ parsed }) {
  if (parsed.isMarkdown) {
    return (
      <div className="px-1">
        <ReactMarkdown components={MD}>{parsed.clinicalNote}</ReactMarkdown>
      </div>
    )
  }
  const entries = Object.entries(parsed.sections).filter(([k]) => PATIENT_SECTIONS.includes(k))
  if (entries.length === 0) {
    return (
      <pre className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 leading-7 font-sans p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
        {parsed.clinicalNote || parsed.raw}
      </pre>
    )
  }
  return (
    <div className="space-y-3">
      {entries.map(([key, val]) => {
        const Icon  = SECTION_ICONS[key] || Activity
        const empty = !val || val.trim() === 'Not Mentioned' || val.trim() === ''
        const lines = val ? val.split('\n').map(l => l.trim()).filter(Boolean) : []
        return (
          <div key={key} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              <Icon size={13} /> {key}
            </div>
            {empty ? (
              <p className="text-sm text-slate-400 italic">Not mentioned</p>
            ) : (
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{lines.join(' ')}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function PatientVoice() {
  const { currentResult, setCurrentResult, addSession } = useApp()

  const [inputTab,    setInputTab]    = useState('record')
  const [isRecording, setIsRecording] = useState(false)
  const [hasStopped,  setHasStopped]  = useState(false)
  const [timerSecs,   setTimerSecs]   = useState(0)
  const [file,        setFile]        = useState(null)
  const [isDrag,      setIsDrag]      = useState(false)
  const [processing,  setProcessing]  = useState(false)
  const [apiUrl,      setApiUrl]      = useState('http://localhost:8009')
  const [apiStatus,   setApiStatus]   = useState('idle')

  const mediaRef     = useRef(null)
  const chunksRef    = useRef([])
  const timerRef     = useRef(null)
  const fileInputRef = useRef(null)

  const parsed = currentResult ? parseResult(currentResult) : null

  useEffect(() => { checkHealth() }, [])

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
    toast('Recording stopped — click Submit to analyze', { icon: '🎙️' })
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
      addSession({ id: Date.now(), filename: audioFile.name, date: new Date().toISOString(), result: data.result, audioUrl: data.audio_url ? `${getBase()}${data.audio_url}` : null })
      toast.success('Analysis complete!')
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

  return (
    <div className="grid grid-cols-2 gap-5">

      {/* ── Left: Input ───────────────────────────────────── */}
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
            {['record', 'upload'].map(t => (
              <button
                key={t}
                onClick={() => setInputTab(t)}
                className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                  inputTab === t
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {t === 'record' ? <><Mic size={15} /> Speak Now</> : <><Upload size={15} /> Upload Audio</>}
              </button>
            ))}
          </div>

          {inputTab === 'record' && (
            <div className="flex flex-col items-center gap-4 py-8 px-6">
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center">Describe your symptoms or how you're feeling</p>

              <div className={`flex items-end gap-1 h-8 transition-opacity ${isRecording ? 'opacity-100' : 'opacity-0'}`}>
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className="w-1 bg-emerald-500 dark:bg-emerald-400 rounded-sm wave-bar"
                    style={{ animationDelay: `${i * 0.1}s`, height: '5px' }} />
                ))}
              </div>

              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={processing}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-all ${
                  isRecording ? 'bg-red-500 recording-pulse' : 'bg-emerald-500 hover:bg-emerald-600'
                }`}
              >
                {isRecording ? <Square size={22} fill="white" /> : <Mic size={22} />}
              </button>

              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                {isRecording ? 'Listening...' : hasStopped ? 'Recording ready' : 'Tap to start speaking'}
              </p>

              {(isRecording || hasStopped) && (
                <span className="text-2xl font-mono font-bold text-emerald-600">{fmt(timerSecs)}</span>
              )}

              {hasStopped && (
                <button
                  onClick={processRecording}
                  disabled={processing}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  <Send size={14} /> Submit for Analysis
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
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10'
                    : 'border-slate-200 dark:border-slate-600 hover:border-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                }`}
              >
                <CloudUpload size={36} className="mx-auto text-emerald-500 dark:text-emerald-400 mb-3" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Drop audio or click to browse</p>
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
                <div className="mt-3 flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800">
                  <Upload size={16} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex-1 truncate">{file.name}</span>
                  <button
                    onClick={() => runPipeline(file)}
                    disabled={processing}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    Analyze
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Connection status */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
            <Server size={15} className="text-emerald-600 dark:text-emerald-400" /> Connection
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-300">Server Status</span>
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
          <button
            onClick={checkHealth}
            className="w-full py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Check Connection
          </button>
        </div>

        {processing && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-sm p-5 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-slate-100 dark:border-slate-700 border-t-emerald-600 rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Analyzing your recording...</p>
          </div>
        )}
      </div>

      {/* ── Right: Results ────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
        {!currentResult ? (
          <div className="flex flex-col items-center justify-center flex-1 py-20 px-6 text-center">
            <Heart size={48} className="text-slate-200 dark:text-slate-600 mb-4" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-200 mb-1">Your Health Summary</h3>
            <p className="text-sm text-slate-400 dark:text-slate-500">Record or upload audio to get your personalized summary</p>
          </div>
        ) : (
          <>
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Your Health Summary</span>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <PatientSummary parsed={parsed} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
