import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { FilePlus, FileDown, Eye, Trash2, FolderOpen, FileX, Play, X, BellRing, FileText } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { generatePDF } from '../utils/pdf'
import { parseResult } from '../utils/parseResult'

export default function Reports() {
  const { sessions, removeSession, setSessions, setCurrentResult, setCurrentAgentType, setCurrentAlertData, setCurrentSummaryData, setPage, incrementReportCount } = useApp()

  const [playingId, setPlayingId] = useState(null)

  const pdfInputRef = useRef(null)
  const iframeRef   = useRef(null)
  const pdfUrlRef   = useRef(null)
  const pdfNameRef  = useRef(null)
  const dlBtnRef    = useRef(null)

  function openPDF(e) {
    const file = e.target.files[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    pdfUrlRef.current  = url
    pdfNameRef.current = file.name
    iframeRef.current.src = url
    iframeRef.current.style.display = 'block'
    iframeRef.current.previousElementSibling.style.display = 'none'
    dlBtnRef.current.style.display = 'flex'
    toast.success(`Loaded: ${file.name}`)
  }

  function downloadLoaded() {
    const a = document.createElement('a')
    a.href = pdfUrlRef.current
    a.download = pdfNameRef.current || 'document.pdf'
    a.click()
  }

  function viewSession(s) {
    setCurrentResult(s.result)
    setCurrentAgentType(s.agentType || 'medical_scribe')
    setCurrentAlertData(s.alertData || null)
    setCurrentSummaryData(s.summaryData || null)
    setPage('scribe')
  }

  function downloadSession(s) {
    generatePDF(s.result)
    incrementReportCount()
    toast.success('PDF downloaded')
  }

  function delSession(id) {
    if (!confirm('Delete this session?')) return
    removeSession(id)
    toast('Session deleted', { icon: '🗑️' })
  }

  function clearAll() {
    if (!confirm('Clear all saved sessions? This cannot be undone.')) return
    setSessions([])
    toast('History cleared', { icon: '🗑️' })
  }

  return (
    <div className="space-y-6">

      {/* PDF Viewer */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FilePlus size={15} className="text-blue-600 dark:text-blue-400" /> PDF Viewer
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => pdfInputRef.current.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <FolderOpen size={13} /> Open PDF
            </button>
            <button
              ref={dlBtnRef}
              onClick={downloadLoaded}
              style={{ display: 'none' }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <FileDown size={13} /> Download
            </button>
          </div>
          <input ref={pdfInputRef} type="file" accept=".pdf" className="hidden" onChange={openPDF} />
        </div>

        <div className="p-5">
          {/* Placeholder shown until a PDF is loaded */}
          <div className="flex flex-col items-center justify-center h-96 bg-slate-50 dark:bg-slate-900/40 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 gap-3">
            <FileX size={48} className="text-slate-200 dark:text-slate-600" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No PDF Loaded</p>
            <p className="text-xs text-center max-w-xs text-slate-400 dark:text-slate-500">
              Open a local PDF file above, or generate one from a clinical note in the Medical Scribe section.
            </p>
            <p className="text-xs text-slate-300 dark:text-slate-600">
              🏥 Hospital PDF integration — coming soon
            </p>
          </div>
          <iframe
            ref={iframeRef}
            title="PDF Viewer"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700"
            style={{ height: 600, display: 'none' }}
          />
        </div>
      </div>

      {/* Saved Reports */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Saved Reports ({sessions.length})
          </span>
          {sessions.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
            >
              <Trash2 size={12} /> Clear All
            </button>
          )}
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-16">
            <FilePlus size={36} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-sm text-slate-400 dark:text-slate-500">No saved reports yet</p>
            <p className="text-xs mt-1 text-slate-400 dark:text-slate-500">
              Process a session and click Save to create a report
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {sessions.map(s => {
              const p  = parseResult(s.result)
              const cc = p.sections['Chief Complaint'] || p.sections['Assessment'] || 'Clinical Note'
              return (
                <div key={s.id}>
                  <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      s.agentType === 'alert'   ? 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400' :
                      s.agentType === 'summary' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' :
                      'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    }`}>
                      {s.agentType === 'alert'   ? <BellRing size={16} /> :
                       s.agentType === 'summary' ? <FileText size={16} /> :
                       <FilePlus size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{s.filename}</p>
                        {s.agentType === 'alert' && (
                          <span className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">ALERT</span>
                        )}
                        {s.agentType === 'summary' && (
                          <span className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">SUMMARY</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                        {cc.slice(0, 60)} · {format(new Date(s.date), 'dd MMM yyyy, HH:mm')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {s.audioUrl && (
                        <button
                          onClick={() => setPlayingId(playingId === s.id ? null : s.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold border border-emerald-200 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                        >
                          {playingId === s.id ? <X size={12} /> : <Play size={12} />}
                          {playingId === s.id ? 'Close' : 'Play'}
                        </button>
                      )}
                      <button
                        onClick={() => viewSession(s)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Eye size={12} /> View
                      </button>
                      <button
                        onClick={() => downloadSession(s)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        <FileDown size={12} /> PDF
                      </button>
                      <button
                        onClick={() => delSession(s.id)}
                        className="p-1.5 rounded-lg border border-red-100 dark:border-red-900/40 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  {playingId === s.id && s.audioUrl && (
                    <div className="px-5 pb-4">
                      <audio
                        controls
                        autoPlay
                        src={s.audioUrl}
                        className="w-full h-10 rounded-lg"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
