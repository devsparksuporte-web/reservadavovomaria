"use client"

import { useState, useEffect } from "react"
import { supabase } from "../../lib/supabase"
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, addDays, isSameMonth, isToday, isSameDay
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChevronLeft, ChevronRight, ArrowDownLeft, ArrowUpRight, Sparkles, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { ReservaModal } from "@/components/ReservaModal"

type Reserva = {
  id: string
  data_checkin: string
  data_checkout: string
  status: string
  hospedes: { nome: string } | null
  quarto_id: string
  quartos?: { numero: string; tipo: string } | null
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

      const start = format(startOfMonth(subMonths(currentMonth, 1)), "yyyy-MM-dd")
      const end = format(endOfMonth(addMonths(currentMonth, 1)), "yyyy-MM-dd")

      const { data: rData } = await supabase
        .from("reservas")
        .select("id, data_checkin, data_checkout, hospedes(nome), status, quarto_id, quartos(numero, tipo)")
        .gte("data_checkout", start)
        .lte("data_checkin", end)
        .neq("status", "Cancelado")

      setReservas((rData as any) || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [currentMonth])

  // Calendar grid
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

  // Reservations for a given day
  const getReservasForDay = (date: Date) => {
    const d = format(date, "yyyy-MM-dd")
    return reservas.filter(r => d >= r.data_checkin && d < r.data_checkout)
  }

  // Today's events
  const todayReservas = getReservasForDay(selectedDate)
  const checkinToday = reservas.filter(r => r.data_checkin === format(selectedDate, "yyyy-MM-dd"))
  const checkoutToday = reservas.filter(r => r.data_checkout === format(selectedDate, "yyyy-MM-dd"))

  // Status counts
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

  const weekDays = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"]

  return (
    <div className="flex flex-col lg:flex-row gap-6 pb-20 animate-fade-in-up">
      {/* LEFT: Calendar */}
      <div className="flex-1 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[#ededed] tracking-tight">
              Agenda de Reservas
            </h2>
            <p className="text-[13px] text-[#707070] mt-0.5">
              {quartos.length} quartos • {reservas.length} reservas no período
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex bg-[#1c1c1c] p-1 rounded-lg border border-[#2e2e2e]">
              {(["day", "week", "month"] as ViewMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all",
                    viewMode === mode
                      ? "bg-[#3ecf8e] text-[#111111]"
                      : "text-[#707070] hover:text-[#ededed]"
                  )}
                >
                  {mode === "day" ? "Day" : mode === "week" ? "Week" : "Month"}
                </button>
              ))}
            </div>

            {/* Month Navigation */}
            <div className="flex items-center gap-2 bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg px-3 py-1.5">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-0.5 hover:bg-[#2e2e2e] rounded text-[#ededed] transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[13px] font-semibold text-[#ededed] min-w-[120px] text-center capitalize">
                {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
              </span>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-0.5 hover:bg-[#2e2e2e] rounded text-[#ededed] transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg overflow-hidden">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-[#2e2e2e]">
            {weekDays.map(wd => (
              <div key={wd} className="py-3 text-center text-[10px] font-bold text-[#707070] uppercase tracking-widest">
                {wd}
              </div>
            ))}
          </div>

          {/* Calendar Rows */}
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-b border-[#2e2e2e] last:border-b-0">
              {week.map((d, di) => {
                const dayReservas = getReservasForDay(d)
                const inMonth = isSameMonth(d, currentMonth)
                const today = isToday(d)
                const selected = isSameDay(d, selectedDate)

                return (
                  <div
                    key={di}
                    onClick={() => setSelectedDate(d)}
                    className={cn(
                      "min-h-[90px] p-1.5 border-r border-[#2e2e2e] last:border-r-0 cursor-pointer transition-colors",
                      !inMonth && "opacity-30",
                      selected && "bg-[#232323]",
                      !selected && "hover:bg-[#232323]/50"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn(
                        "text-[13px] font-semibold w-7 h-7 flex items-center justify-center rounded-full",
                        today && "bg-[#3ecf8e] text-[#111111]",
                        !today && inMonth && "text-[#ededed]",
                        !today && !inMonth && "text-[#555]"
                      )}>
                        {format(d, "d")}
                      </span>
                      {dayReservas.length > 2 && (
                        <span className="text-[9px] text-[#707070] font-medium">+{dayReservas.length - 2}</span>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {dayReservas.slice(0, 2).map(r => (
                        <div
                          key={r.id}
                          className={cn(
                            "text-[9px] font-bold px-1.5 py-0.5 rounded truncate leading-tight",
                            getReservaPillColor(r.status)
                          )}
                          title={`${r.quartos?.numero || "Q."} - ${r.hospedes?.nome || "Hóspede"}`}
                        >
                          R.{r.quartos?.numero} - {r.hospedes?.nome?.split(" ")[0]?.slice(0, 8) || "..."}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="grid grid-cols-2 gap-4">
          <ReservaModal onRefresh={fetchData}>
            <button className="w-full bg-[#3ecf8e] hover:bg-[#24b47e] text-[#111111] font-bold text-[11px] py-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
              <Plus className="w-4 h-4" /> NEW BOOKING
            </button>
          </ReservaModal>
          <button
            onClick={() => { setCurrentMonth(new Date()); setSelectedDate(new Date()) }}
            className="w-full bg-[#1c1c1c] border border-[#2e2e2e] hover:bg-[#232323] text-[#ededed] font-bold text-[11px] py-4 rounded-lg transition-colors"
          >
            IR PARA HOJE
          </button>
        </div>
      </div>

      {/* RIGHT: Sidebar */}
      <div className="w-full lg:w-[300px] shrink-0 space-y-5">
        {/* Status Overview */}
        <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg p-5">
          <h3 className="text-[10px] font-bold text-[#707070] uppercase tracking-[0.2em] mb-5">
            Status Overview
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#3ecf8e]" />
                <span className="text-[13px] text-[#ededed]">Checked-in</span>
              </div>
              <span className="text-xl font-bold text-[#ededed] tabular-nums">
                {String(statusCounts.checkedIn).padStart(2, "0")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="text-[13px] text-[#ededed]">Confirmado</span>
              </div>
              <span className="text-xl font-bold text-[#ededed] tabular-nums">
                {String(statusCounts.confirmed).padStart(2, "0")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span className="text-[13px] text-[#ededed]">Pendente</span>
              </div>
              <span className="text-xl font-bold text-[#ededed] tabular-nums">
                {String(statusCounts.pending).padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>

        {/* Today's Events */}
        <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[13px] font-semibold text-[#ededed]">Eventos do Dia</h3>
            <span className="text-[10px] font-bold text-[#707070] uppercase tracking-wider">
              {format(selectedDate, "MMM dd", { locale: ptBR })}
            </span>
          </div>

          <div className="space-y-4">
            {/* Check-ins */}
            {checkinToday.map(r => (
              <div key={`ci-${r.id}`} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#3ecf8e]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <ArrowDownLeft className="w-4 h-4 text-[#3ecf8e]" />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[10px] font-bold text-[#3ecf8e] uppercase tracking-wider">Check-in</span>
                  <span className="text-[13px] font-semibold text-[#ededed] truncate">
                    {r.hospedes?.nome || "Hóspede"}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] bg-[#232323] border border-[#2e2e2e] rounded px-1.5 py-0.5 text-[#707070] font-medium">
                      Room {r.quartos?.numero || "—"}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Occupancy */}
            {todayReservas.filter(r => r.data_checkin !== format(selectedDate, "yyyy-MM-dd") && r.data_checkout !== format(selectedDate, "yyyy-MM-dd")).map(r => (
              <div key={`occ-${r.id}`} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Hospedado</span>
                  <span className="text-[13px] font-semibold text-[#ededed] truncate">
                    {r.hospedes?.nome || "Hóspede"}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] bg-[#232323] border border-[#2e2e2e] rounded px-1.5 py-0.5 text-[#707070] font-medium">
                      Room {r.quartos?.numero || "—"}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Check-outs */}
            {checkoutToday.map(r => (
              <div key={`co-${r.id}`} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <ArrowUpRight className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Check-out</span>
                  <span className="text-[13px] font-semibold text-[#ededed] truncate">
                    {r.hospedes?.nome || "Hóspede"}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] bg-[#232323] border border-[#2e2e2e] rounded px-1.5 py-0.5 text-[#707070] font-medium">
                      Room {r.quartos?.numero || "—"}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty state */}
            {checkinToday.length === 0 && checkoutToday.length === 0 && todayReservas.length === 0 && (
              <p className="text-[13px] text-[#555555] text-center py-4">
                Nenhum evento para este dia.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
