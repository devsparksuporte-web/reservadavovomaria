"use client"

import { useState, useEffect } from "react"
import { supabase } from "../../lib/supabase"
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, addDays, isSameMonth, isToday, isSameDay, parseISO
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChevronLeft, ChevronRight, ArrowDownLeft, ArrowUpRight, Sparkles, Plus, Calendar as CalendarIcon, Filter } from "lucide-react"
import { cn } from "@/lib/utils"
import { ReservaModal } from "@/components/ReservaModal"

type Reserva = {
  id: string
  data_checkin: string
  data_checkout: string
  status: string
  hospedes: { nome: string; telefone?: string; cpf?: string } | null
  quarto_id: string
  quartos?: { numero: string; tipo: string } | null
  valor_total?: number
  numero_pessoas?: number
}

type ViewMode = "day" | "week" | "month"

export default function AgendaPage() {
  const [quartos, setQuartos] = useState<{ id: string; numero: string; tipo: string }[]>([])
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>("month")

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data: qData } = await supabase.from("quartos").select("*").order("numero")
      setQuartos((qData as any) || [])

      // Fetch a wider range for overlapping reservations
      const start = format(startOfMonth(subMonths(currentMonth, 1)), "yyyy-MM-dd")
      const end = format(endOfMonth(addMonths(currentMonth, 1)), "yyyy-MM-dd")

      const { data: rData } = await supabase
        .from("reservas")
        .select(`
          *,
          hospedes(nome, telefone, cpf),
          quartos(numero, tipo)
        `)
        .gte("data_checkout", start)
        .lte("data_checkin", end)
        .neq("status", "Cancelado")

      setReservas((rData as any) || [])
    } catch (e) {
      console.error("Erro ao buscar dados:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [currentMonth])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const calendarDays: Date[] = []
  let day = calStart
  while (day <= calEnd) {
    calendarDays.push(day)
    day = addDays(day, 1)
  }

  const weeks: Date[][] = []
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7))
  }

  const getReservasForDay = (date: Date) => {
    const d = format(date, "yyyy-MM-dd")
    return reservas.filter(r => d >= r.data_checkin && d < r.data_checkout)
  }

  // Activity filters for Sidebar
  const selectedDateStr = format(selectedDate, "yyyy-MM-dd")
  const checkinToday = reservas.filter(r => r.data_checkin === selectedDateStr)
  const checkoutToday = reservas.filter(r => r.data_checkout === selectedDateStr)
  const stayingToday = reservas.filter(r => selectedDateStr >= r.data_checkin && selectedDateStr < r.data_checkout && r.data_checkin !== selectedDateStr)

  // Status counts (total current active)
  const statusCounts = {
    checkedIn: reservas.filter(r => r.status === "Checked-in").length,
    confirmed: reservas.filter(r => r.status === "Confirmado" || r.status === "Reservado").length,
    pending: reservas.filter(r => r.status === "Pendente").length,
  }

  const getReservaPillColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "checked-in": return "bg-[#3ecf8e]/80 text-[#111]"
      case "confirmado": return "bg-purple-500/80 text-white"
      case "pendente": return "bg-amber-500/80 text-[#111]"
      case "reservado": return "bg-purple-500/80 text-white"
      default: return "bg-[#555]/80 text-white"
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 pb-20 animate-fade-in">
      {/* LEFT: Calendar Section */}
      <div className="flex-1 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[#ededed] tracking-tight">Agenda de Reservas</h2>
            <p className="text-[13px] text-[#707070] mt-0.5">
              Administre a ocupação de {quartos.length} quartos em tempo real
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-[#1c1c1c] p-1 rounded-lg border border-[#2e2e2e]">
              {(["day", "week", "month"] as ViewMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all",
                    viewMode === mode ? "bg-[#3ecf8e] text-[#111111]" : "text-[#707070] hover:text-[#ededed]"
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg px-2 py-1.5">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-[#2e2e2e] rounded text-[#ededed]"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-[12px] font-bold text-[#ededed] min-w-[110px] text-center capitalize">
                {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
              </span>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-[#2e2e2e] rounded text-[#ededed]"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg overflow-hidden">
          <div className="grid grid-cols-7 border-b border-[#2e2e2e] bg-[#232323]/50">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(wd => (
              <div key={wd} className="py-2.5 text-center text-[10px] font-bold text-[#555] uppercase tracking-widest">{wd}</div>
            ))}
          </div>

          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-b border-[#2e2e2e] last:border-b-0">
              {week.map((d, di) => {
                const dayReservas = getReservasForDay(d)
                const inMonth = isSameMonth(d, currentMonth)
                const selected = isSameDay(d, selectedDate)
                const isTdy = isToday(d)

                return (
                  <div
                    key={di}
                    onClick={() => setSelectedDate(d)}
                    onDoubleClick={() => setSelectedDate(d)} // UI logic: Double click could trigger new booking
                    className={cn(
                      "min-h-[100px] p-1.5 border-r border-[#2e2e2e] last:border-r-0 cursor-pointer transition-all flex flex-col gap-1",
                      !inMonth && "opacity-25",
                      selected ? "bg-[#232323]" : "hover:bg-[#232323]/40"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "text-[12px] font-bold w-6 h-6 flex items-center justify-center rounded-full",
                        isTdy ? "bg-[#3ecf8e] text-[#111]" : inMonth ? "text-[#ededed]" : "text-[#555]"
                      )}>
                        {format(d, "d")}
                      </span>
                      {dayReservas.length > 3 && (
                        <span className="text-[9px] text-[#555] font-bold">+{dayReservas.length - 3}</span>
                      )}
                    </div>

                    <div className="flex-1 space-y-1">
                      {dayReservas.slice(0, 3).map(r => (
                        <ReservaModal key={r.id} reserva={r} onRefresh={fetchData}>
                          <div
                            className={cn(
                              "text-[9px] font-bold px-1.5 py-0.5 rounded truncate leading-tight border border-black/10 hover:brightness-110 transition-all",
                              getReservaPillColor(r.status)
                            )}
                          >
                            Q.{r.quartos?.numero} - {r.hospedes?.nome?.split(" ")[0]}
                          </div>
                        </ReservaModal>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <ReservaModal onRefresh={fetchData} initialData={{ data_checkin: format(selectedDate, "yyyy-MM-dd") }}>
            <button className="flex-1 bg-[#3ecf8e] hover:bg-[#24b47e] text-[#111] font-bold text-[11px] py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
              <Plus className="w-4 h-4" /> NOVA RESERVA
            </button>
          </ReservaModal>
          <button
            onClick={() => { setCurrentMonth(new Date()); setSelectedDate(new Date()) }}
            className="flex-1 bg-[#1c1c1c] border border-[#2e2e2e] hover:bg-[#232323] text-[#ededed] font-bold text-[11px] py-3.5 rounded-lg transition-all"
          >
            VOLTAR PARA HOJE
          </button>
        </div>
      </div>

      {/* RIGHT: Stats & Events */}
      <div className="w-full lg:w-[320px] shrink-0 space-y-6">
        {/* Stats */}
        <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg p-5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-bold text-[#555] uppercase tracking-[0.2em]">Resumo de Status</h3>
            <Filter className="w-3.5 h-3.5 text-[#555]" />
          </div>
          <div className="grid grid-cols-1 gap-5">
            {[
              { label: "Checked-in", count: statusCounts.checkedIn, color: "bg-[#3ecf8e]" },
              { label: "Confirmados", count: statusCounts.confirmed, color: "bg-purple-500" },
              { label: "Pendentes", count: statusCounts.pending, color: "bg-amber-400" }
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className={cn("w-2 h-2 rounded-full", item.color)} />
                  <span className="text-[13px] text-[#ededed] font-medium group-hover:text-[#3ecf8e] transition-colors">{item.label}</span>
                </div>
                <span className="text-xl font-bold text-[#ededed] tabular-nums">
                  {String(item.count).padStart(2, "0")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Events */}
        <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg p-5 min-h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[13px] font-bold text-[#ededed]">Eventos do Dia</h3>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-[#232323] rounded-md border border-[#2e2e2e]">
              <CalendarIcon className="w-3 h-3 text-[#3ecf8e]" />
              <span className="text-[10px] font-bold text-[#3ecf8e] uppercase">
                {format(selectedDate, "dd MMM", { locale: ptBR })}
              </span>
            </div>
          </div>

          <div className="relative space-y-6 before:absolute before:left-[18px] before:top-2 before:bottom-2 before:w-[1px] before:bg-[#2e2e2e]">
            {/* Check-ins */}
            {checkinToday.map(r => (
              <ReservaModal key={`ci-${r.id}`} reserva={r} onRefresh={fetchData}>
                <div className="relative pl-10 group cursor-pointer">
                  <div className="absolute left-0 top-0 w-9 h-9 rounded-lg bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 flex items-center justify-center z-10 group-hover:scale-110 transition-transform">
                    <ArrowDownLeft className="w-4 h-4 text-[#3ecf8e]" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold text-[#3ecf8e] uppercase tracking-wider">Check-in</span>
                    <span className="text-[13px] font-bold text-[#ededed] group-hover:text-[#3ecf8e] transition-colors">{r.hospedes?.nome}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] bg-[#232323] border border-[#2e2e2e] rounded px-2 py-0.5 text-[#707070] font-bold">
                        QUARTO {r.quartos?.numero}
                      </span>
                    </div>
                  </div>
                </div>
              </ReservaModal>
            ))}

            {/* Occupied */}
            {stayingToday.map(r => (
              <ReservaModal key={`occ-${r.id}`} reserva={r} onRefresh={fetchData}>
                <div className="relative pl-10 group cursor-pointer">
                  <div className="absolute left-0 top-0 w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center z-10 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Hospedado</span>
                    <span className="text-[13px] font-bold text-[#ededed] group-hover:text-purple-400 transition-colors">{r.hospedes?.nome}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] bg-[#232323] border border-[#2e2e2e] rounded px-2 py-0.5 text-[#707070] font-bold">
                        QUARTO {r.quartos?.numero}
                      </span>
                    </div>
                  </div>
                </div>
              </ReservaModal>
            ))}

            {/* Check-outs */}
            {checkoutToday.map(r => (
              <ReservaModal key={`co-${r.id}`} reserva={r} onRefresh={fetchData}>
                <div className="relative pl-10 group cursor-pointer">
                  <div className="absolute left-0 top-0 w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center z-10 group-hover:scale-110 transition-transform">
                    <ArrowUpRight className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Check-out</span>
                    <span className="text-[13px] font-bold text-[#ededed] group-hover:text-rose-400 transition-colors">{r.hospedes?.nome}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] bg-[#232323] border border-[#2e2e2e] rounded px-2 py-0.5 text-[#707070] font-bold">
                        QUARTO {r.quartos?.numero}
                      </span>
                    </div>
                  </div>
                </div>
              </ReservaModal>
            ))}

            {checkinToday.length === 0 && checkoutToday.length === 0 && stayingToday.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 opacity-30">
                <CalendarIcon className="w-8 h-8 mb-2" />
                <p className="text-[12px] font-medium">Sem atividades</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
