import { Stethoscope, User } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function RoleSelector() {
  const { setRole, setPage } = useApp()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="text-center space-y-10 max-w-xl w-full px-6">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg">
            <Stethoscope size={30} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">MediScribe AI</h1>
          <p className="text-slate-500 dark:text-slate-400 text-base">Select your role to continue</p>
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-2 gap-5">
          <button
            onClick={() => { setRole('patient'); setPage('patient-home') }}
            className="group flex flex-col items-center gap-4 p-8 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer"
          >
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors">
              <User size={32} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Patient</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">View appointments, reports & record symptoms</p>
            </div>
          </button>

          <button
            onClick={() => { setRole('doctor'); setPage('dashboard') }}
            className="group flex flex-col items-center gap-4 p-8 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer"
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
              <Stethoscope size={32} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Doctor</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Medical scribe, manage appointments & patient records</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
