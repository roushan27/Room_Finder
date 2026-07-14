export default function Footer() {
  return (
    <footer className="mt-20 pt-8 pb-6 w-full">
      <div className="max-w-2xl mx-auto px-4">
        
        {/* Gradient divider with logo badge centered on top */}
        <div className="relative flex items-center justify-center mb-6">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-orange-300/60 to-transparent" />
          <div className="absolute bg-[#fdf2e4] px-3">
            <img src="/logo.png" alt="Room Finder" className="h-8 w-8 object-contain" />
          </div>
        </div>

        {/* Brand row */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-[#b5451a] font-black text-sm tracking-tight">Room Finder</span>
        </div>

        <p className="text-slate-500 font-semibold text-xs text-center leading-relaxed">
          Made with <span className="text-brand-coral">♥</span> for students — helping you find a place to call home away from home.
        </p>

        {/* Quick links */}
        <div className="flex items-center justify-center gap-3 mt-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          <a href="#" className="hover:text-[#b5451a] transition">About</a>
          <span className="text-orange-300">•</span>
          <a href="#" className="hover:text-[#b5451a] transition">Contact</a>
          <span className="text-orange-300">•</span>
          <a href="#" className="hover:text-[#b5451a] transition">Privacy</a>
        </div>

        <p className="text-slate-400 text-[10px] mt-5 font-semibold uppercase tracking-widest text-center">
          © {new Date().getFullYear()} Room Finder. All rights reserved.
        </p>
      </div>
    </footer>
  )
}