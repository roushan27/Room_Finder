import { useNavigate } from 'react-router-dom'
import Footer from '../components/common/Footer'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-brand-cream py-8 antialiased text-slate-800">
      
      {/* Spacer for vertical centering */}
      <div className="flex-1 flex flex-col items-center justify-center w-full px-4">
        <div className="w-full max-w-sm bg-white border border-orange-200/70 rounded-2xl shadow-xl shadow-orange-100/40 p-6 sm:p-8 text-center space-y-6">
          
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-brand-gold tracking-tight">
              Room Finder
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Find your space, build your home</p>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 rounded-xl bg-brand-sage hover:opacity-95 active:scale-95 transition-all text-white font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-800/10"
          >
            Access Account
          </button>

          <div className="relative flex items-center select-none">
            <div className="flex-grow border-t border-slate-100" />
            <span className="flex-shrink mx-3 text-[9px] text-slate-400 font-black uppercase tracking-widest">or register as</span>
            <div className="flex-grow border-t border-slate-100" />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/signup?role=student')}
              className="flex-1 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-black text-[11px] uppercase tracking-wider transition-all active:scale-95 shadow-2xs"
            >
              Student
            </button>
            <button
              onClick={() => navigate('/signup?role=owner')}
              className="flex-1 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-black text-[11px] uppercase tracking-wider transition-all active:scale-95 shadow-2xs"
            >
              Owner
            </button>
          </div>

          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            Need an account?{' '}
            <span 
              onClick={() => navigate('/signup?role=student')}
              className="text-brand-coral cursor-pointer hover:underline font-black transition-colors"
            >
              Start here
            </span>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  )
}