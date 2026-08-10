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

type ClientLabel = { id: string; name: string; color: string }

type ClientTask = {
  id: string
  title: string
  status: string
  columnName: string | null
  isComplete: boolean
  assignees: string[]
  createdAt: string
  labels: ClientLabel[]
  totalSubtasks: number
  doneSubtasks: number
  progress: number
  estHours: number
  actualHours: number
}

type ClientData = {
  labels: Array<ClientLabel & { taskCount: number; doneCount: number; estHours: number; actualHours: number }>
  summary: {
    taskCount: number
    doneCount: number
    estHours: number
    actualHours: number
    progress: number
  }
  tasks: ClientTask[]
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

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function escCell(value: string): string {
  return `"${String(value).replace(/"/g, '""')}"`
}

export default function ReportsModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"team" | "client">("team")

  // ----- Aba TEAM_PERFORMANCE -----
  const defaultEnd = toInputDate(new Date().toISOString())
  const defaultStart = toInputDate(new Date(Date.now() - 6 * 86400000).toISOString())
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
    if (tab === "client" && availableLabels.length === 0) loadLabels()
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

  // ----- Aba POR_CLIENTE -----
  const [availableLabels, setAvailableLabels] = useState<ClientLabel[]>([])
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])
  const [cStart, setCStart] = useState("")
  const [cEnd, setCEnd] = useState("")
  const [cData, setCData] = useState<ClientData | null>(null)
  const [cLoading, setCLoading] = useState(false)
  const [cError, setCError] = useState("")

  const loadLabels = useCallback(async () => {
    try {
      const res = await fetch("/api/labels")
      const body = await res.json()
      setAvailableLabels(body.labels || [])
    } catch {
      setAvailableLabels([])
    }
  }, [])

  useEffect(() => {
    if (tab === "client" && availableLabels.length === 0) loadLabels()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const toggleLabel = (id: string) => {
    setSelectedLabels((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const applyClient = async () => {
    if (selectedLabels.length === 0) {
      setCError("ERRO: SELECIONE_PELO_MENOS_UM_LABEL")
      return
    }
    if (cStart && cEnd && cStart > cEnd) {
      setCError("ERRO: PERIODO_INVALIDO")
      return
    }
    setCLoading(true)
    setCError("")
    try {
      const params = new URLSearchParams({ labelIds: selectedLabels.join(",") })
      if (cStart) params.set("start", cStart)
      if (cEnd) params.set("end", cEnd)
      const res = await fetch(`/api/reports/by-client?${params}`)
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || "ERRO")
      setCData(body)
    } catch (err) {
      setCError("ERRO: FALHA_AO_GERAR_RELATORIO")
    } finally {
      setCLoading(false)
    }
  }

  const exportCsv = () => {
    if (!cData) return
    const header = [
      "TAREFA",
      "LABELS",
      "COLUNA",
      "STATUS",
      "RESPONSAVEL",
      "CRIADA_EM",
      "SUBTAREFAS_CONCLUIDAS",
      "TOTAL_SUBTAREFAS",
      "PROGRESSO_PCT",
      "HORAS_ESTIMADAS",
      "HORAS_REALIZADAS",
    ]
    const lines = cData.tasks.map((t) =>
      [
        escCell(t.title),
        escCell(t.labels.map((l) => l.name).join(" | ")),
        escCell(t.columnName || ""),
        escCell(t.isComplete ? "CONCLUIDA" : t.status),
        escCell(t.assignees.join(" | ")),
        escCell(fmtDate(t.createdAt)),
        String(t.doneSubtasks),
        String(t.totalSubtasks),
        String(t.progress),
        String(t.estHours),
        String(t.actualHours),
      ].join(";"),
    )
    const csv = "\uFEFF" + [header.join(";"), ...lines].join("\r\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `relatorio_por_cliente_${toInputDate(new Date().toISOString())}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPdf = () => {
    if (!cData) return
    const rowsHtml = cData.tasks
      .map(
        (t) => `<tr>
          <td>${escCell(t.title).replace(/^"|"$/g, "")}</td>
          <td>${escCell(t.labels.map((l) => l.name).join(" | ")).replace(/^"|"$/g, "")}</td>
          <td>${escCell(t.columnName || "").replace(/^"|"$/g, "")}</td>
          <td>${escCell(t.isComplete ? "CONCLUIDA" : t.status).replace(/^"|"$/g, "")}</td>
          <td>${escCell(t.assignees.join(" | ")).replace(/^"|"$/g, "")}</td>
          <td>${escCell(fmtDate(t.createdAt)).replace(/^"|"$/g, "")}</td>
          <td>${t.doneSubtasks}/${t.totalSubtasks} (${t.progress}%)</td>
          <td>${t.estHours}h</td>
          <td>${t.actualHours}h</td>
        </tr>`,
      )
      .join("")
    const html = `<html>
      <head>
        <title>Relatorio por Cliente</title>
        <style>
          * { font-family: Arial, Helvetica, sans-serif; color: #111; }
          h1 { font-size: 18px; }
          .labels-summary { margin: 10px 0 16px; font-size: 12px; }
          table { border-collapse: collapse; width: 100%; font-size: 10px; }
          th, td { border: 1px solid #999; padding: 4px 6px; text-align: left; }
          th { background: #eee; }
          .muted { color: #666; }
        </style>
      </head>
      <body>
        <h1>BRO.LABS — RELATORIO POR CLIENTE</h1>
        <div class="labels-summary">
          LABELS: ${cData.labels.map((l) => `${l.name} (${l.taskCount} tarefas)`).join(" | ") || "—"}<br/>
          <span class="muted">Gerado em: ${new Date().toLocaleString("pt-BR")} — ${cData.tasks.length} tarefas, ${cData.summary.progress}% concluidas, ${cData.summary.estHours}h estimadas, ${cData.summary.actualHours}h realizadas.</span>
        </div>
        <table>
          <thead><tr>
            <th>TAREFA</th><th>LABELS</th><th>COLUNA</th><th>STATUS</th>
            <th>RESPONSAVEL</th><th>CRIADA_EM</th><th>SUBTAREFAS</th>
            <th>EST(h)</th><th>REAL(h)</th>
          </tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </body>
    </html>`
    const w = window.open("", "_blank")
    if (!w) return
    w.document.write(html)
    w.document.close()
    w.focus()
    w.print()
  }

  return (
    <div className="br-modal fixed inset-0 bg-[var(--br-overlay)] z-50 flex items-center justify-center p-0 sm:p-4">
      <div className="border-2 border-[var(--br-accent)] bg-[var(--br-bg)] max-w-3xl w-full p-4 md:p-6 max-h-full sm:max-h-[85vh] h-full sm:h-auto overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[var(--br-accent)] font-bold text-sm">
            {">"} RELATORIOS:
          </div>
          <button
            onClick={onClose}
            className="text-[var(--br-text-secondary)] text-xs border border-[var(--br-border)] px-2 py-1 hover:border-[var(--br-accent)] transition-colors"
          >
            [ FECHAR ]
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setTab("team")}
            className={`h-9 px-3 text-xs border transition-colors ${
              tab === "team"
                ? "border-[var(--br-accent)] bg-[var(--br-accent)] text-black font-bold"
                : "border-[var(--br-border)] text-[var(--br-text-secondary)] hover:border-[var(--br-accent)]"
            }`}
          >
            [ TEAM_PERFORMANCE ]
          </button>
          <button
            onClick={() => setTab("client")}
            className={`h-9 px-3 text-xs border transition-colors ${
              tab === "client"
                ? "border-[var(--br-accent)] bg-[var(--br-accent)] text-black font-bold"
                : "border-[var(--br-border)] text-[var(--br-text-secondary)] hover:border-[var(--br-accent)]"
            }`}
          >
            [ POR_CLIENTE ]
          </button>
        </div>

        {tab === "team" && (
          <>
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
          </>
        )}

        {tab === "client" && (
          <>
            <div className="border border-[var(--br-border)] bg-[var(--br-bg-secondary)] p-3 md:p-4 mb-4">
              <div className="text-[var(--br-text-secondary)] text-[10px] mb-2">
                SELECT_LABELS (multiplos para cruzar):
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {availableLabels.length === 0 && (
                  <span className="text-[var(--br-text-secondary)] text-xs">NO_LABELS</span>
                )}
                {availableLabels.map((l) => {
                  const active = selectedLabels.includes(l.id)
                  return (
                    <button
                      key={l.id}
                      onClick={() => toggleLabel(l.id)}
                      className={`h-8 px-3 text-[11px] border transition-colors ${
                        active
                          ? "border-[var(--br-accent)] text-black"
                          : "border-[var(--br-border)] text-[var(--br-text-secondary)] hover:border-[var(--br-accent)]"
                      }`}
                      style={active ? { background: l.color, borderColor: l.color } : undefined}
                      title={l.name}
                    >
                      {active ? "✓ " : ""}{l.name}
                    </button>
                  )
                })}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[var(--br-text-secondary)] text-[10px]">
                    INICIO (opcional):
                  </span>
                  <input
                    type="date"
                    value={cStart}
                    onChange={(e) => setCStart(e.target.value)}
                    className="mt-1 w-full h-9 bg-[var(--br-bg)] border border-[var(--br-border)] px-2 text-xs text-[var(--br-text)] focus:outline-none focus:border-[var(--br-accent)]"
                  />
                </label>
                <label className="block">
                  <span className="text-[var(--br-text-secondary)] text-[10px]">
                    FIM (opcional):
                  </span>
                  <input
                    type="date"
                    value={cEnd}
                    onChange={(e) => setCEnd(e.target.value)}
                    className="mt-1 w-full h-9 bg-[var(--br-bg)] border border-[var(--br-border)] px-2 text-xs text-[var(--br-text)] focus:outline-none focus:border-[var(--br-accent)]"
                  />
                </label>
              </div>
              <button
                onClick={applyClient}
                disabled={cLoading}
                className="mt-3 w-full h-9 border border-[var(--br-accent)] text-[var(--br-accent)] text-xs hover:bg-[var(--br-accent)] hover:text-black transition-colors disabled:opacity-50"
              >
                [ {cLoading ? "AGUARDE..." : "GERAR_RELATORIO"} ]
              </button>
              {cError && <div className="text-[var(--br-danger)] text-[10px] mt-2">{cError}</div>}
            </div>

            {cLoading ? (
              <div className="text-[var(--br-accent)]/50 text-xs py-8 text-center">
                CALCULANDO...
              </div>
            ) : !cData ? (
              <div className="text-[var(--br-text-secondary)] text-xs py-8 text-center">
                SELECIONE_LABELS_E_GERE_O_RELATORIO
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={exportCsv}
                    className="h-9 px-3 border border-[var(--br-accent)] text-[var(--br-accent)] text-xs hover:bg-[var(--br-accent)] hover:text-black transition-colors"
                  >
                    [ EXPORTAR_CSV ]
                  </button>
                  <button
                    onClick={exportPdf}
                    className="h-9 px-3 border border-[var(--br-warn)] text-[var(--br-warn)] text-xs hover:bg-[var(--br-warn)] hover:text-black transition-colors"
                  >
                    [ EXPORTAR_PDF ]
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-4">
                  <div className="border border-[var(--br-border)] p-3">
                    <div className="text-[var(--br-text-secondary)] text-[10px]">TAREFAS</div>
                    <div className="text-[var(--br-accent)] text-xl md:text-2xl font-bold mt-1">
                      {cData.summary.taskCount}
                    </div>
                  </div>
                  <div className="border border-[var(--br-border)] p-3">
                    <div className="text-[var(--br-text-secondary)] text-[10px]">CONCLUIDAS</div>
                    <div className="text-[var(--br-accent)] text-xl md:text-2xl font-bold mt-1">
                      {cData.summary.doneCount}
                    </div>
                  </div>
                  <div className="border border-[var(--br-border)] p-3">
                    <div className="text-[var(--br-text-secondary)] text-[10px]">PROGRESSO</div>
                    <div className="text-[var(--br-warn)] text-xl md:text-2xl font-bold mt-1">
                      {cData.summary.progress}%
                    </div>
                  </div>
                  <div className="border border-[var(--br-border)] p-3">
                    <div className="text-[var(--br-text-secondary)] text-[10px]">
                      HORAS (EST/REAL)
                    </div>
                    <div className="text-[var(--br-text)] text-xl md:text-2xl font-bold mt-1">
                      {cData.summary.estHours}h
                      <span className="text-[var(--br-text-secondary)] text-sm">
                        {" "}/ {cData.summary.actualHours}h
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[var(--br-accent)] text-xs mb-2">{">"} POR_LABEL:</div>
                <div className="border border-[var(--br-border)] overflow-x-auto mb-4">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[var(--br-border)] text-[var(--br-text-secondary)] text-[10px]">
                        <th className="text-left px-3 py-2">LABEL</th>
                        <th className="text-right px-3 py-2">TAREFAS</th>
                        <th className="text-right px-3 py-2">CONCLUIDAS</th>
                        <th className="text-right px-3 py-2">PROGRESSO</th>
                        <th className="text-right px-3 py-2">EST(H)</th>
                        <th className="text-right px-3 py-2">REAL(H)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cData.labels.map((l) => (
                        <tr key={l.id} className="border-b border-[var(--br-border)] last:border-b-0">
                          <td className="px-3 py-2 text-[var(--br-text)]">
                            <span
                              className="inline-block w-2 h-2 mr-2"
                              style={{ background: l.color }}
                            />
                            {l.name}
                          </td>
                          <td className="px-3 py-2 text-right text-[var(--br-text)]">{l.taskCount}</td>
                          <td className="px-3 py-2 text-right text-[var(--br-accent)]">{l.doneCount}</td>
                          <td className="px-3 py-2 text-right text-[var(--br-warn)]">
                            {l.taskCount > 0 ? Math.round((l.doneCount / l.taskCount) * 100) : 0}%
                          </td>
                          <td className="px-3 py-2 text-right text-[var(--br-text)]">{l.estHours}h</td>
                          <td className="px-3 py-2 text-right text-[var(--br-text)]">{l.actualHours}h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="text-[var(--br-accent)] text-xs mb-2">{">"} TAREFAS:</div>
                <div className="border border-[var(--br-border)] overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[var(--br-border)] text-[var(--br-text-secondary)] text-[10px]">
                        <th className="text-left px-3 py-2">TAREFA</th>
                        <th className="text-left px-3 py-2">LABELS</th>
                        <th className="text-left px-3 py-2">COLUNA</th>
                        <th className="text-left px-3 py-2">RESPONSAVEL</th>
                        <th className="text-left px-3 py-2">CRIADA_EM</th>
                        <th className="text-left px-3 py-2">SUBTAREFAS</th>
                        <th className="text-right px-3 py-2">EST(H)</th>
                        <th className="text-right px-3 py-2">REAL(H)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cData.tasks.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-3 py-4 text-center text-[var(--br-text-secondary)]">
                            SEM_TAREFAS_PARA_OS_LABELS_SELECIONADOS
                          </td>
                        </tr>
                      )}
                      {cData.tasks.map((t) => (
                        <tr key={t.id} className="border-b border-[var(--br-border)] last:border-b-0 align-top">
                          <td className="px-3 py-2">
                            <div
                              className={
                                t.isComplete
                                  ? "text-[var(--br-text-secondary)] line-through decoration-[var(--br-danger)]"
                                  : "text-[var(--br-text)]"
                              }
                            >
                              {t.title}
                            </div>
                            {t.totalSubtasks > 0 && (
                              <div className="mt-1 flex items-center gap-2">
                                <div className="h-1.5 w-24 bg-[var(--br-border)]">
                                  <div
                                    className="h-full bg-[var(--br-accent)]"
                                    style={{ width: `${t.progress}%` }}
                                  />
                                </div>
                                <span className="text-[10px] text-[var(--br-text-secondary)]">
                                  {t.progress}%
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap gap-1">
                              {t.labels.map((l) => (
                                <span
                                  key={l.id}
                                  className="inline-block px-1.5 py-0.5 text-[10px] border"
                                  style={{ borderColor: l.color, color: l.color }}
                                >
                                  {l.name}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-[var(--br-text-secondary)]">
                            <div>{t.columnName || "—"}</div>
                            <div className="text-[10px]">
                              {t.isComplete ? "CONCLUIDA" : t.status}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-[var(--br-text)]">
                            {t.assignees.length > 0 ? t.assignees.join(", ") : "—"}
                          </td>
                          <td className="px-3 py-2 text-[var(--br-text-secondary)]">
                            {fmtDate(t.createdAt)}
                          </td>
                          <td className="px-3 py-2 text-[var(--br-text-secondary)]">
                            {t.doneSubtasks}/{t.totalSubtasks}
                          </td>
                          <td className="px-3 py-2 text-right text-[var(--br-text)]">{t.estHours}h</td>
                          <td className="px-3 py-2 text-right text-[var(--br-warn)]">{t.actualHours}h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}