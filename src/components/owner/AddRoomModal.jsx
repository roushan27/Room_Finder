import AddRoomForm from './AddRoomForm'
import { useModalBackButton } from '../../hooks/useModalBackButton'

export default function AddRoomModal({ onClose, onSuccess }) {
  useModalBackButton(true, onClose)

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center z-50 sm:p-4">
      <div
        className="relative w-full max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-white/20 shadow-2xl"
        style={{
          background: 'linear-gradient(145deg, rgba(30,41,59,0.85), rgba(15,23,42,0.95))',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 25px 60px -12px rgba(59,130,246,0.35), 0 0 0 1px rgba(255,255,255,0.08) inset, 0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        {/* Glow accent at top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent blur-sm" />

        <div className="p-5 sm:p-7">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-blue-400">✦</span> Add New Room
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 border border-white/20 text-white/70 hover:text-white hover:bg-white/20 transition"
            >
              ✕
            </button>
          </div>

          <AddRoomForm onSuccess={onSuccess} />
        </div>
      </div>
    </div>
  )
}
