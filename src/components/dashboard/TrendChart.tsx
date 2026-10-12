import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Period, TrendPoint } from '../../services/stats'

const label = (d: string, p: Period) =>
  new Date(d + 'T00:00:00').toLocaleDateString(undefined, p === 'month' ? { month: 'short', year: '2-digit' } : { month: 'short', day: 'numeric' })

export default function TrendChart({ data, period }: { data: TrendPoint[]; period: Period }) {
  const rows = data.map((r) => ({ name: label(r.bucket, period), Disciples: r.new_disciples, Invitees: r.new_invitees }))
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip /><Legend />
          <Bar dataKey="Disciples" fill="#4f46e5" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Invitees" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
