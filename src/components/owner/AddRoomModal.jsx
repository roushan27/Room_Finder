import AddRoomForm from './AddRoomForm'
import { useModalBackButton } from '../../hooks/useModalBackButton'

export default function AddRoomModal({ onClose, onSuccess }) {
  useModalBackButton(true, onClose)

  return (
    // Transformed: Dimmed ambient backdrop with soft neutral overlay instead of neon glassmorphism
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 sm:p-4 animate-fade-in">
      <div
        className="relative w-full max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10"
      >
        <div className="p-5 sm:p-7">
          
          {/* Header Layout Grid Block */}
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
            <h2 className="text-base sm:text-lg font-black text-brand-gold uppercase tracking-wider flex items-center gap-2">
              <span className="text-brand-coral">✦</span> Add New Room Layout
            </h2>
            
            {/* Standard clean close control anchor */}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 transition active:scale-95 text-xs font-bold"
            >
              ✕
            </button>
          </div>

          {/* Form Processing Subsystem Ingestion */}
          <AddRoomForm onSuccess={onSuccess} />
        </div>
      </div>
    </div>
  )
}