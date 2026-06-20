import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const AppContext = createContext(null)

function useLS(key, initial) {
  const [val, setVal] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) ?? initial }
    catch { return initial }
  })
  const persist = useCallback(v => {
    setVal(v)
    localStorage.setItem(key, JSON.stringify(v))
  }, [key])
  return [val, persist]
}

export function AppProvider({ children }) {
  const [page, setPage]                                   = useLS('ms_page', 'dashboard')
  const [currentResult, setCurrentResult]                 = useLS('ms_current_result', null)
  const [currentAgentType, setCurrentAgentType]           = useLS('ms_current_agent_type', 'medical_scribe')
  const [currentConversation, setCurrentConversation]     = useLS('ms_current_conversation', null)
  const [currentAlertData, setCurrentAlertData]           = useLS('ms_current_alert_data', null)
  const [currentSummaryData, setCurrentSummaryData]       = useLS('ms_current_summary_data', null)
  const [currentAyurvedaData, setCurrentAyurvedaData]     = useLS('ms_current_ayurveda_data', null)
  const [sessions, setSessions]           = useLS('ms_sessions', [])
  const [appointments, setAppointments]   = useLS('ms_appointments', [])
  const [reportCount, setReportCount]     = useLS('ms_report_count', 0)
  const [darkMode, setDarkModeRaw]        = useLS('ms_dark', false)
  const [role, setRole]                   = useLS('ms_role', null)
  const [availability, setAvailability]   = useLS('ms_availability', {
    workDays: [1, 2, 3, 4, 5],   // Mon–Fri  (0 = Sun)
    startTime: '09:00',
    endTime: '17:00',
    slotDuration: 30,             // minutes
    blockedDates: [],             // specific dates doctor is away
  })

  // Sync dark class on <html>
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark')
    else          document.documentElement.classList.remove('dark')
  }, [darkMode])

  const toggleDark = useCallback(() => setDarkModeRaw(d => !d), [setDarkModeRaw])

  const addSession = useCallback(session => {
    setSessions(prev => [session, ...prev].slice(0, 50))
  }, [setSessions])

  const upsertAppointment = useCallback(appt => {
    setAppointments(prev => {
      const idx = prev.findIndex(a => a.id === appt.id)
      if (idx >= 0) { const n = [...prev]; n[idx] = appt; return n }
      return [appt, ...prev]
    })
  }, [setAppointments])

  const removeAppointment = useCallback(id => {
    setAppointments(prev => prev.filter(a => a.id !== id))
  }, [setAppointments])

  const removeSession = useCallback(id => {
    setSessions(prev => prev.filter(s => s.id !== id))
  }, [setSessions])

  const incrementReportCount = useCallback(() => {
    setReportCount(n => n + 1)
  }, [setReportCount])

  return (
    <AppContext.Provider value={{
      page, setPage,
      currentResult, setCurrentResult,
      currentAgentType, setCurrentAgentType,
      currentConversation, setCurrentConversation,
      currentAlertData, setCurrentAlertData,
      currentSummaryData, setCurrentSummaryData,
      currentAyurvedaData, setCurrentAyurvedaData,
      sessions, addSession, removeSession, setSessions,
      appointments, upsertAppointment, removeAppointment,
      reportCount, incrementReportCount,
      darkMode, toggleDark,
      role, setRole,
      availability, setAvailability,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
