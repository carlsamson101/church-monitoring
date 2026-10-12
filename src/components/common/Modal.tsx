import { X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div className="max-h-[92vh] w-full overflow-auto rounded-t-2xl bg-white p-5 sm:max-w-lg sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">{title}</h2><button onClick={onClose} aria-label="Close"><X size={18} /></button></div>
        {children}
      </div>
    </div>
  )
}
export function ConfirmModal({ title, text, label, danger, onConfirm, onClose }: { title: string; text: string; label: string; danger?: boolean; onConfirm: () => Promise<void>; onClose: () => void }) {
  const [busy, setBusy] = useState(false)
  return (
    <Modal title={title} onClose={onClose}>
      <p className="mb-4 text-sm text-slate-600">{text}</p>
      <div className="flex justify-end gap-2">
        <button className="rounded-lg border px-3 py-1.5 text-sm" onClick={onClose}>Cancel</button>
        <button disabled={busy} onClick={async () => { setBusy(true); try { await onConfirm() } finally { setBusy(false); onClose() } }}
          className={`rounded-lg px-3 py-1.5 text-sm text-white disabled:opacity-50 ${danger ? 'bg-red-600' : 'bg-indigo-600'}`}>{label}</button>
      </div>
    </Modal>
  )
}
