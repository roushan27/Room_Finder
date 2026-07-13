export default function Footer() {
  return (
    // Centralized Update: Shifted to a soft slate border and neutral text palette
    <footer className="mt-20 py-6 border-t border-slate-200/60 text-center w-full max-w-xl mx-auto">
      <p className="text-slate-400 font-medium text-xs">
        Made with <span className="text-brand-coral">♥</span> for students — helping you find a place to call home away from home.
      </p>
      <p className="text-slate-400/70 text-[10px] mt-1.5 font-semibold uppercase tracking-wider">
        © {new Date().getFullYear()} Room Finder. All rights reserved.
      </p>
    </footer>
  )
}