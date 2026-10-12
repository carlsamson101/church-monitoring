import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
type T = { id: number; msg: string; kind: 'ok' | 'error' }
const Ctx = createContext<{ push: (m: string, k?: 'ok' | 'error') => void }>({ push: () => {} })
export const useToast = () => useContext(Ctx)
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<T[]>([])
  const push = useCallback((msg: string, kind: 'ok' | 'error' = 'ok') => {
    const id = Date.now() + Math.random(); setItems((s) => [...s, { id, msg, kind }])
    setTimeout(() => setItems((s) => s.filter((x) => x.id !== id)), 4000)
  }, [])
  return (
    <Ctx.Provider value={{ push }}>{children}
      <div className="fixed right-4 top-4 z-[60] space-y-2">
        {items.map((t) => <div key={t.id} className={`max-w-xs rounded-lg px-4 py-2 text-sm text-white shadow-lg ${t.kind === 'ok' ? 'bg-green-600' : 'bg-red-600'}`}>{t.msg}</div>)}
      </div>
    </Ctx.Provider>
  )
}
