"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

type ReportMember = {
  id: string
  name: string
  username: string
  completedTasks: number
  estHours: number
  actualHours: number
  overdueCount: number
  overdueHours: number
}

type BurndownPoint = {
  date: string
  label: string
  completed: number
  cumulative: number
}

type ReportData = {
  start: string
  end: string
  summary: {
    completedTasks: number
    estHours: number
    actualHours: number
    overdueCount: number
    overdueHours: number
    memberCount: number
  }
  members: ReportMember[]
  burndown: BurndownPoint[]
}

const COLORS = {
  accent: "#00FF66",
  warn: "#F59E0B",
  danger: "#EF4444",
  text: "#9CA3AF",
  grid: "#2A2A3A",
}

function toInputDate(iso: string): string {
  return iso.slice(0, 10)
}

export default function ReportsModal({ onClose }: { onClose: () => void }) {
  const defaultEnd = toInputDate(new Date().toISOString())
  const defaultStart = toInputDate(
    new Date(Date.now() - 6 * 86400000).toISOString(),
  )
  const [start, setStart] = useState(defaultStart)
  const [end, setEnd] = useState(defaultEnd)
  const [memberId, setMemberId] = useState("all")
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchReport = useCallback(
    async (s: string, e: string, m: string) => {
      setLoading(true)
      setError("")
      try {
        const params = new URLSearchParams({ start: s, end: e })
        if (m !== "all") params.set("memberId", m)
        const res = await fetch(`/api/reports/team-performance?${params}`)
        const body = await res.json()
        if (!res.ok) throw new Error(body.error || "ERRO")
        setData(body)
      } catch (err) {
        setError("ERRO: FALHA_AO_GERAR_RELATORIO")
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    fetchReport(defaultStart, defaultEnd, "all")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const apply = () => {
    if (!start || !end || start > end) {
      setError("ERRO: PERIODO_INVALIDO")
      return
    }
    fetchReport(start, end, memberId)
  }

  const rows = data?.members || []
  const chartData = data?.burndown || []

  return (
    <div className="br-modal fixed inset-0 bg-[var(--br-overlay)] z-50 flex items-center justify-center p-0 sm:p-4">
      <div className="border-2 border-[var(--br-accent)] bg-[var(--br-bg)] max-w-3xl w-full p-4 md:p-6 max-h-full sm:max-h-[85vh] h-full sm:h-auto overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[var(--br-accent)] font-bold text-sm">
            {">"} RELATORIOS: TEAM_PERFORMANCE
          </div>
          <button
            onClick={onClose}
            className="text-[var(--br-text-secondary)] text-xs border border-[var(--br-border)] px-2 py-1 hover:border-[var(--br-accent)] transition-colors"
          >
            [ FECHAR ]
          </button>
        </div>

        <div className="border border-[var(--br-border)] bg-[var(--br-bg-secondary)] p-3 md:p-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="block">
              <span className="text-[var(--br-text-secondary)] text-[10px]">INICIO:</span>
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="mt-1 w-full h-9 bg-[var(--br-bg)] border border-[var(--br-border)] px-2 text-xs text-[var(--br-text)] focus:outline-none focus:border-[var(--br-accent)]"
              />
            </label>
            <label className="block">
              <span className="text-[var(--br-text-secondary)] text-[10px]">FIM:</span>
              <input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="mt-1 w-full h-9 bg-[var(--br-bg)] border border-[var(--br-border)] px-2 text-xs text-[var(--br-text)] focus:outline-none focus:border-[var(--br-accent)]"
              />
            </label>
            <label className="block">
              <span className="text-[var(--br-text-secondary)] text-[10px]">MEMBRO:</span>
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="mt-1 w-full h-9 bg-[var(--br-bg)] border border-[var(--br-border)] px-2 text-xs text-[var(--br-text)] focus:outline-none focus:border-[var(--br-accent)]"
              >
                <option value="all">TODOS</option>
                {(data?.members || [])
                  .filter((m) => m.id !== "UNASSIGNED")
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <button
            onClick={apply}
            disabled={loading}
            className="mt-3 w-full h-9 border border-[var(--br-accent)] text-[var(--br-accent)] text-xs hover:bg-[var(--br-accent)] hover:text-black transition-colors disabled:opacity-50"
          >
            [ {loading ? "AGUARDE..." : "GERAR_RELATORIO"} ]
          </button>
          {error && <div className="text-[var(--br-danger)] text-[10px] mt-2">{error}</div>}
        </div>

        {loading ? (
          <div className="text-[var(--br-accent)]/50 text-xs py-8 text-center">
            CALCULANDO...
          </div>
        ) : !data ? (
          <div className="text-[var(--br-text-secondary)] text-xs py-8 text-center">
            SEM_DADOS_DISPONIVEIS
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-4">
              <div className="border border-[var(--br-border)] p-3">
                <div className="text-[var(--br-text-secondary)] text-[10px]">
                  TAREFAS_CONCLUIDAS
                </div>
                <div className="text-[var(--br-accent)] text-xl md:text-2xl font-bold mt-1">
                  {data.summary.completedTasks}
                </div>
              </div>
              <div className="border border-[var(--br-border)] p-3">
                <div className="text-[var(--br-text-secondary)] text-[10px]">
                  HORAS_ESTIMADAS
                </div>
                <div className="text-[var(--br-accent)] text-xl md:text-2xl font-bold mt-1">
                  {data.summary.estHours}h
                </div>
              </div>
              <div className="border border-[var(--br-border)] p-3">
                <div className="text-[var(--br-text-secondary)] text-[10px]">
                  HORAS_REALIZADAS
                </div>
                <div className="text-[var(--br-warn)] text-xl md:text-2xl font-bold mt-1">
                  {data.summary.actualHours}h
                </div>
              </div>
              <div className="border border-[var(--br-border)] p-3">
                <div className="text-[var(--br-text-secondary)] text-[10px]">
                  ATRASADAS*
                </div>
                <div
                  className={`text-xl md:text-2xl font-bold mt-1 ${
                    data.summary.overdueCount > 0
                      ? "text-[var(--br-danger)]"
                      : "text-[var(--br-text)]"
                  }`}
                >
                  {data.summary.overdueCount}
                </div>
              </div>
            </div>

            <div className="border border-[var(--br-border)] p-3 md:p-4 mb-4">
              <div className="text-[var(--br-text-secondary)] text-[10px] mb-2">
                BURNDOWN_SEMANAL (CONCLUIDAS_POR_DIA + CUMULATIVO):
              </div>
              <div className="h-52 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                    <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: COLORS.text, fontSize: 10 }}
                      stroke={COLORS.grid}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: COLORS.text, fontSize: 10 }}
                      stroke={COLORS.grid}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#111118",
                        border: "1px solid #2A2A3A",
                        borderRadius: 0,
                        fontSize: 11,
                      }}
                      labelStyle={{ color: COLORS.text }}
                      itemStyle={{ color: COLORS.text }}
                    />
                    <Bar dataKey="completed" name="CONCLUIDAS" fill={COLORS.accent} opacity={0.75} />
                    <Line
                      type="monotone"
                      dataKey="cumulative"
                      name="CUMULATIVO"
                      stroke={COLORS.warn}
                      strokeWidth={2}
                      dot={{ fill: COLORS.warn, r: 3 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[var(--br-text-secondary)] text-[10px] mt-2">
                * ATRASADAS = subtarefas do período com tempo realizado acima da estimativa
                (sem data_limite no schema atual).
              </div>
            </div>

            <div className="text-[var(--br-accent)] text-xs mb-2">{">"} POR_MEMBRO:</div>
            <div className="border border-[var(--br-border)] overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--br-border)] text-[var(--br-text-secondary)] text-[10px]">
                    <th className="text-left px-3 py-2">MEMBRO</th>
                    <th className="text-right px-3 py-2">CONCLUIDAS</th>
                    <th className="text-right px-3 py-2">EST(H)</th>
                    <th className="text-right px-3 py-2">REAL(H)</th>
                    <th className="text-right px-3 py-2">ATRASADAS</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-[var(--br-text-secondary)]">
                        SEM_REGISTROS_NO_PERIODO
                      </td>
                    </tr>
                  )}
                  {rows.map((m) => (
                    <tr
                      key={m.id}
                      className="border-b border-[var(--br-border)] last:border-b-0"
                    >
                      <td className="px-3 py-2 text-[var(--br-text)]">
                        {m.id === "UNASSIGNED" ? (
                          <span className="text-[var(--br-text-secondary)]">{m.name}</span>
                        ) : (
                          m.name
                        )}
                        <span className="text-[var(--br-text-secondary)] text-[10px]">
                          {" "}
                          {m.username.startsWith("@") ? m.username : `@${m.username}`}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right text-[var(--br-accent)]">
                        {m.completedTasks}
                      </td>
                      <td className="px-3 py-2 text-right text-[var(--br-text)]">
                        {m.estHours}h
                      </td>
                      <td
                        className={`px-3 py-2 text-right ${
                          m.actualHours > m.estHours && m.estHours > 0
                            ? "text-[var(--br-danger)]"
                            : "text-[var(--br-warn)]"
                        }`}
                      >
                        {m.actualHours}h
                      </td>
                      <td
                        className={`px-3 py-2 text-right ${
                          m.overdueCount > 0
                            ? "text-[var(--br-danger)]"
                            : "text-[var(--br-text-secondary)]"
                        }`}
                      >
                        {m.overdueCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}