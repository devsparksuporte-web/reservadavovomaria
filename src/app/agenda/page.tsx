"use client"

import { useState, useEffect } from "react"
import { supabase } from "../../lib/supabase"
import { format, addDays, startOfToday, subDays, isToday } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, BedDouble, Info, User, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { ReservaModal } from "@/components/ReservaModal"

type Reserva = {
  id: string;
  data_checkin: string;
  data_checkout: string;
  status: string;
  hospedes: { nome: string } | null;
  quarto_id: string;
}

export default function AgendaPage() {
  const [quartos, setQuartos] = useState<{ id: string, numero: string, tipo: string }[]>([])
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [loading, setLoading] = useState(true)
  const today = startOfToday()
  const [startDate, setStartDate] = useState(today)

  const days = Array.from({ length: 14 }).map((_, i) => addDays(startDate, i))

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data: qData, error: qError } = await supabase.from('quartos').select('*').order('numero')
      if (qError) throw qError
      setQuartos((qData as any) || [])

      const endDate = addDays(startDate, 14)
      const { data: rData, error: rError } = await supabase
        .from('reservas')
        .select(`
          id,
          data_checkin,
          data_checkout,
          hospedes(nome),
          status,
          quarto_id
        `)
        .gte('data_checkout', format(startDate, 'yyyy-MM-dd'))
        .lte('data_checkin', format(endDate, 'yyyy-MM-dd'))

      if (rError) throw rError
      setReservas((rData as any) || [])
    } catch (error) {
      console.error('Erro ao buscar dados da agenda:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [startDate])

  const getReservaForQuartoAndDate = (quartoId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return reservas.find((r: any) => {
      return r.quarto_id === quartoId && dateStr >= r.data_checkin && dateStr < r.data_checkout
    })
  }

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase()
    switch (s) {
      case 'confirmado': return 'bg-emerald-600 dark:bg-emerald-500 shadow-[0_2px_10px_-3px_rgba(16,185,129,0.5)]'
      case 'pendente': return 'bg-amber-500 dark:bg-amber-600 shadow-[0_2px_10px_-3px_rgba(245,158,11,0.5)]'
      case 'cancelado': return 'bg-rose-500 dark:bg-rose-600 shadow-[0_2px_10px_-3px_rgba(244,63,94,0.5)]'
      case 'checked-in': return 'bg-blue-600 dark:bg-blue-500 shadow-[0_2px_10px_-3px_rgba(37,99,235,0.5)]'
      case 'finalizado': return 'bg-zinc-700 dark:bg-zinc-800'
      default: return 'bg-zinc-500 dark:bg-zinc-600'
    }
  }


  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold text-emerald-400 tracking-[0.2em] uppercase">Calendar Overview</span>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
          Agenda
        </h2>
      </div>

      <div className="flex bg-[#1a1d27] p-1 rounded-xl border border-[#2a2d3a] w-fit">
        <button className="bg-emerald-400 text-[#0f1117] font-bold text-xs px-6 py-2 rounded-lg">
          Weekly
        </button>
        <button className="text-zinc-400 font-bold text-xs px-6 py-2 rounded-lg hover:text-white">
          Monthly
        </button>
      </div>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-white font-medium text-sm">
            <CalendarIcon className="w-4 h-4 text-emerald-400" />
            {format(startDate, 'MMMM yyyy', { locale: ptBR })}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStartDate(subDays(startDate, 7))} className="p-1 hover:bg-[#2a2d3a] rounded-lg text-white">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setStartDate(addDays(startDate, 7))} className="p-1 hover:bg-[#2a2d3a] rounded-lg text-white">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {days.slice(0, 7).map((day, i) => {
            const isSelected = format(day, 'yyyy-MM-dd') === format(startDate, 'yyyy-MM-dd')
            return (
              <div
                key={i}
                onClick={() => setStartDate(day)}
                className={cn(
                  "flex-shrink-0 w-[48px] h-[72px] flex flex-col items-center justify-between py-2 rounded-xl border cursor-pointer transition-all",
                  isSelected ? "border-emerald-400 bg-[#2a2d3a]/50" : "border-transparent bg-[#151821] hover:border-[#2a2d3a]"
                )}
              >
                <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">
                  {format(day, 'EEE', { locale: ptBR }).slice(0, 3)}
                </span>
                <span className={cn("text-lg font-bold", isSelected ? "text-emerald-400" : "text-white")}>
                  {format(day, 'dd')}
                </span>
                <div className="w-4 h-1 rounded-full bg-emerald-400/20" />
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-medium">
            {format(startDate, 'MMMM do', { locale: ptBR })}
          </h3>
          <button
            onClick={() => setStartDate(today)}
            className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-lg"
          >
            Hoje
          </button>
        </div>

        <div className="space-y-4">
          {quartos.map((quarto) => {
            const reserva = getReservaForQuartoAndDate(quarto.id, startDate);
            if (!reserva) return null;

            return (
              <div key={quarto.id} className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#2a2d3a] flex items-center justify-center border border-[#3a3d4a] shrink-0">
                  <span className={cn(
                    "font-bold text-lg",
                    reserva.status === 'Checked-in' ? 'text-emerald-400' :
                      reserva.status === 'Confirmado' ? 'text-purple-400' : 'text-rose-400'
                  )}>
                    {quarto.numero}
                  </span>
                </div>

                <div className="flex flex-col gap-1 border-b border-[#2a2d3a] pb-4 flex-1">
                  <span className="text-white font-bold text-sm">
                    {reserva.hospedes?.nome || 'Hóspede não identificado'}
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={cn(
                      "font-bold",
                      reserva.status === 'Checked-in' ? 'text-emerald-400' :
                        reserva.status === 'Confirmado' ? 'text-purple-400' : 'text-rose-400'
                    )}>
                      {reserva.status}
                    </span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-zinc-400">
                      {Math.ceil((new Date(reserva.data_checkout).getTime() - new Date(reserva.data_checkin).getTime()) / (1000 * 3600 * 24))} Nights
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {quartos.every(q => !getReservaForQuartoAndDate(q.id, startDate)) && (
            <div className="text-center py-8 text-zinc-500 text-sm">Nenhuma reserva para este dia.</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <ReservaModal onRefresh={fetchData}>
          <button className="w-full bg-emerald-400 hover:bg-emerald-500 text-[#0f1117] font-bold text-xs py-4 rounded-xl flex flex-col items-center gap-2 transition-colors">
            <Plus className="w-5 h-5" />
            NEW BOOKING
          </button>
        </ReservaModal>

        <button className="w-full bg-[#1a1d27] border border-[#2a2d3a] hover:bg-[#2a2d3a] text-white font-bold text-xs py-4 rounded-xl flex flex-col items-center gap-2 transition-colors">
          <CalendarIcon className="w-5 h-5 text-emerald-400" />
          DAILY REPORT
        </button>
      </div>
    </div>
  )
}
