"use client"

import { supabase } from "@/lib/supabase"
import { CheckCircle2, Calendar, User, AlertTriangle, Trash2, TrendingUp, BedDouble } from "lucide-react"
import { QuartoModal } from "@/components/QuartoModal"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/Skeleton"
import { Tooltip } from "@/components/Tooltip"
import { format } from "date-fns"
import { toast } from "sonner"
import { useRole } from "@/hooks/useRole"

export default function QuartosPage() {
  const [quartos, setQuartos] = useState<any[]>([])
  const [reservasAtivas, setReservasAtivas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { isAdmin } = useRole()

  const fetchQuartos = async () => {
    try {
      setLoading(true)
      const { data: qData, error: qError } = await supabase
        .from('quartos')
        .select('*')
        .order('numero', { ascending: true })
      
      if (qError) throw qError
      setQuartos(qData || [])

      const today = format(new Date(), 'yyyy-MM-dd')
      const { data: rAtivas } = await supabase
        .from('reservas')
        .select('*, hospedes(nome)')
        .lte('data_checkin', today)
        .gt('data_checkout', today)
        .neq('status', 'Cancelado')
      
      setReservasAtivas(rAtivas || [])
    } catch (error) {
      console.error('Erro ao carregar quartos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuartos()
  }, [])

  const handleQuickStatusUpdate = async (reservaId: string, newStatus: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const { error } = await supabase
        .from('reservas')
        .update({ status: newStatus })
        .eq('id', reservaId)
      
      if (error) throw error
      toast.success(`Status atualizado para ${newStatus}`)
      fetchQuartos()
    } catch (error: any) {
      toast.error(`Erro ao atualizar: ${error.message}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este quarto? Todas as referências em reservas serão afetadas.")) {
      const { error } = await supabase.from('quartos').delete().eq('id', id)
      if (error) {
        alert("Erro ao excluir: " + error.message)
      } else {
        fetchQuartos()
      }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Disponível': return <CheckCircle2 className="h-5 w-5 text-[#3ecf8e]" />
      case 'Ocupado': return <User className="h-5 w-5 text-rose-400" />
      case 'Reservado': return <Calendar className="h-5 w-5 text-purple-400" />
      default: return <AlertTriangle className="h-5 w-5 text-amber-400" />
    }
  }

  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'Disponível': return 'text-[#3ecf8e]'
      case 'Ocupado': return 'text-rose-400'
      case 'Reservado': return 'text-purple-400'
      default: return 'text-amber-400'
    }
  }

  const getCardBorder = (status: string) => {
    switch (status) {
      case 'Disponível': return 'border-[#2e2e2e] hover:border-[#3ecf8e]/30'
      case 'Ocupado': return 'border-l-2 border-l-rose-400 border-t-[#2e2e2e] border-r-[#2e2e2e] border-b-[#2e2e2e]'
      case 'Reservado': return 'border-[#2e2e2e] hover:border-purple-500/30'
      default: return 'border-[#2e2e2e]'
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-[#ededed] tracking-tight">
          Mapa de Quartos
        </h2>
        <p className="text-[13px] text-[#707070]">
          Status em tempo real da ocupação do estabelecimento.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-[#1c1c1c] border border-[#2e2e2e] px-3 py-1.5 rounded-full">
          <div className="w-2 h-2 rounded-full bg-[#3ecf8e]"></div>
          <span className="text-[11px] font-medium text-[#ededed]">Livre</span>
        </div>
        <div className="flex items-center gap-2 bg-[#1c1c1c] border border-[#2e2e2e] px-3 py-1.5 rounded-full">
          <div className="w-2 h-2 rounded-full bg-purple-400"></div>
          <span className="text-[11px] font-medium text-[#ededed]">Reservado</span>
        </div>
        <div className="flex items-center gap-2 bg-[#1c1c1c] border border-[#2e2e2e] px-3 py-1.5 rounded-full">
          <div className="w-2 h-2 rounded-full bg-rose-400"></div>
          <span className="text-[11px] font-medium text-[#ededed]">Ocupado</span>
        </div>
        
        <div className="ml-auto">
          <QuartoModal onRefresh={fetchQuartos} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading && quartos.length === 0 ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col justify-between p-4 rounded-lg bg-[#1c1c1c] border border-[#2e2e2e] min-h-[120px]">
              <div className="flex items-start justify-between">
                <Skeleton className="h-5 w-8" />
                <Skeleton className="h-5 w-5 rounded-full" />
              </div>
              <div className="mt-4 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))
        ) : (
          quartos.map((quarto) => {
            const reserva = reservasAtivas.find(r => r.quarto_id === quarto.id)
            const card = (
              <div
                key={quarto.id}
                className={cn("flex flex-col justify-between p-4 rounded-lg bg-[#1c1c1c] border transition-all duration-200 min-h-[120px]", getCardBorder(quarto.status))}
              >
                <div className="flex items-start justify-between">
                  <span className="font-semibold text-[#ededed] text-base">
                    {quarto.numero}
                  </span>
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <button 
                        onClick={() => handleDelete(quarto.id)}
                        className="p-1 text-[#555555] hover:text-red-400 transition-colors rounded-md"
                        title="Excluir Quarto"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {getStatusIcon(quarto.status)}
                  </div>
                </div>
                
                <div className="mt-4 flex flex-col gap-1">
                  <span className="text-[11px] text-[#707070] font-medium truncate">{quarto.tipo}</span>
                  <span className={cn("text-[10px] font-bold uppercase tracking-wider", getStatusColorClass(quarto.status))}>
                    {quarto.status === 'Disponível' ? 'LIVRE' : quarto.status}
                  </span>
                  {reserva && (
                    <div className="flex gap-2 mt-2">
                      {(reserva.status === 'Confirmado' || reserva.status === 'Reservado' || reserva.status === 'Pendente') && (
                        <button 
                          onClick={(e) => handleQuickStatusUpdate(reserva.id, 'Checked-in', e)}
                          className="px-2 py-1 rounded bg-[#3ecf8e]/20 hover:bg-[#3ecf8e]/30 text-[#3ecf8e] text-[8px] font-bold transition-colors"
                        >
                          CHECK-IN
                        </button>
                      )}
                      {reserva.status === 'Checked-in' && (
                        <button 
                          onClick={(e) => handleQuickStatusUpdate(reserva.id, 'Finalizado', e)}
                          className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-[8px] font-bold transition-colors"
                        >
                          CHECK-OUT
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )

            if (reserva) {
              return (
                <Tooltip 
                  key={quarto.id}
                  content={
                    <div className="flex flex-col gap-1">
                      <span className="font-bold">{reserva.hospedes?.nome || 'Hóspede'}</span>
                      <span className="text-[10px] opacity-70">Saída: {format(new Date(reserva.data_checkout), "dd/MM")}</span>
                    </div>
                  }
                >
                  {card}
                </Tooltip>
              )
            }

            return card
          })
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <div className="relative overflow-hidden rounded-lg bg-[#1c1c1c] border border-[#2e2e2e] p-6 flex flex-col justify-between min-h-[160px]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1c1c1c] via-transparent to-[#1c1c1c]/50 z-10" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=600&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay" />
          
          <div className="relative z-20 flex flex-col gap-2">
            <h3 className="text-[#ededed] font-medium text-[13px]">Status das Suítes</h3>
            <p className="text-[#707070] text-[11px] max-w-[200px] leading-relaxed">
              {quartos.filter(q => q.status !== 'Disponível').length} de {quartos.length} unidades ocupadas ou reservadas.
            </p>
          </div>
          
          <button className="relative z-20 mt-4 bg-[#3ecf8e] hover:bg-[#24b47e] text-[#111111] text-[11px] font-bold py-2.5 px-4 rounded-md w-fit transition-colors">
            Ver Detalhes
          </button>
        </div>

        <div className="rounded-lg bg-[#1c1c1c] border border-[#2e2e2e] p-6 flex flex-col justify-center">
          <p className="text-[11px] text-[#ededed] font-medium mb-3">Taxa de Ocupação</p>
          <div className="flex items-baseline gap-2 mb-4">
            <h2 className="text-4xl font-light text-[#3ecf8e] tracking-tighter">
              {quartos.length > 0 
                ? Math.round((quartos.filter(q => q.status === 'Ocupado').length / quartos.length) * 100)
                : 0}%
            </h2>
            <span className="text-[#3ecf8e] text-[11px] font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> Atualizado
            </span>
          </div>
          <div className="w-full bg-[#232323] rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-[#3ecf8e] h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${quartos.length > 0 ? (quartos.filter(q => q.status === 'Ocupado').length / quartos.length) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {!loading && quartos.length === 0 && (
        <div className="text-center py-16 bg-[#1c1c1c] rounded-lg border border-dashed border-[#2e2e2e]">
          <BedDouble className="mx-auto h-10 w-10 text-[#555555] mb-4" />
          <h3 className="text-[13px] font-semibold text-[#ededed]">Nenhum quarto encontrado</h3>
          <p className="mt-1 text-[13px] text-[#707070]">Adicione um novo quarto utilizando o botão no topo da página.</p>
        </div>
      )}
    </div>
  )
}
