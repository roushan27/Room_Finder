export default function Footer() {
  return (
    <footer className="mt-30 py-3 border-t border-white/10 text-center">
      <p className="text-white/30 text-xs">
        Made with <span className="text-red-400">♥</span> for students — helping you find a place to call home away from home.
      </p>
      <p className="text-white/20 text-[10px] mt-0.5">
        © {new Date().getFullYear()} Room Finder. All rights reserved.
      </p>
    </footer>
  )
}
