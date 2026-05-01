"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { 
  BedDouble, 
  Users, 
  CalendarCheck, 
  Wallet, 
  Plus, 
  CalendarDays, 
  CheckCircle2, 
  PlusCircle, 
  TrendingUp,
  ArrowUpRight
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { ReservaModal } from "@/components/ReservaModal"
import { Skeleton } from "@/components/Skeleton"
import { Tooltip } from "@/components/Tooltip"
import { toast } from "sonner"

// Skeleton for Stats
const StatSkeleton = () => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="rounded-lg bg-[#1c1c1c] p-5 border border-[#2e2e2e]">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
        <Skeleton className="h-3 w-24 mt-4" />
      </div>
    ))}
  </div>
)

// Skeleton for Room Map
const RoomMapSkeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
      <div key={i} className="rounded-lg border border-[#2e2e2e] flex flex-col items-center justify-center py-5 px-3 bg-[#1c1c1c]">
        <Skeleton className="h-5 w-8 mb-2" />
        <Skeleton className="h-6 w-6 mb-2" />
        <Skeleton className="h-3 w-12" />
      </div>
    ))}
  </div>
)

export default function Dashboard() {
  const [quartos, setQuartos] = useState<any[]>([])
  const [reservasAtivas, setReservasAtivas] = useState<any[]>([])
  const [proximasChegadas, setProximasChegadas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      setLoading(true)
      const today = format(new Date(), 'yyyy-MM-dd')

      // Quartos
      const { data: qData, error: qError } = await supabase.from('quartos').select('*').order('numero')
      if (qError) throw qError
      setQuartos(qData || [])

      // Reservas Ativas (Ocupação)
      const { data: rAtivas } = await supabase
        .from('reservas')
        .select('*, hospedes(nome)')
        .lte('data_checkin', today)
        .gt('data_checkout', today)
        .neq('status', 'Cancelado')
      
      // Próximas Chegadas
      const { data: pChegadas, error: pError } = await supabase
        .from('reservas')
        .select('*, hospedes(nome), quartos(numero, tipo)')
        .gte('data_checkin', today)
        .order('data_checkin')
        .limit(5)
      
      if (pError) throw pError
      setProximasChegadas(pChegadas || [])

      // Financeiro
      const { data: rFinanceiro, error: fError } = await supabase
        .from('reservas')
        .select('valor_total, status')
        .neq('status', 'Cancelado')
      
      if (fError) throw fError
      
      let realizada = 0
      rFinanceiro?.forEach(r => {
        if (r.status === 'Checked-in' || r.status === 'Finalizado') realizada += r.valor_total
      })

      // Reservas Hoje
      const { data: rHoje, error: rhError } = await supabase
        .from('reservas')
        .select('id, status')
        .eq('data_checkin', today)
        .neq('status', 'Cancelado')
      
      if (rhError) throw rhError

      // Atividades Recentes (Últimas Reservas)
      const { data: rRecentes } = await supabase
        .from('reservas')
        .select('*, hospedes(nome)')
        .order('created_at', { ascending: false })
        .limit(3)
      
      const activities = rRecentes?.map(r => ({
        text: `Nova reserva: ${r.hospedes?.nome || 'Hóspede'}`,
        time: format(new Date(r.created_at), "HH:mm", { locale: ptBR }),
        icon: PlusCircle,
        color: 'text-blue-400',
        bg: 'bg-blue-500/10'
      })) || []

      const occupiedCount = rAtivas?.filter(r => r.status === 'Checked-in').length || 0
      const reservedTodayCount = rHoje?.length || 0
      const pendingCount = rHoje?.filter(r => r.status === 'Pendente' || r.status === 'Reservado').length || 0
      const totalQuartos = qData?.length || 0
      const freeCount = totalQuartos - occupiedCount
      const occupancyPercent = totalQuartos > 0 ? Math.round((occupiedCount / totalQuartos) * 100) : 0
      const freePercent = totalQuartos > 0 ? Math.round((freeCount / totalQuartos) * 100) : 0

      setStats([
        { 
          name: 'Receita Realizada', 
          value: `R$ ${realizada.toLocaleString('pt-BR')}`, 
          sub: 'Valor total processado',
          icon: Wallet, 
          color: 'text-[#3ecf8e]',
          iconBg: 'bg-[#3ecf8e]/10 border-[#3ecf8e]/20'
        },
        { 
          name: 'Reservas Hoje', 
          value: reservedTodayCount, 
          sub: `${pendingCount} pendentes`,
          icon: CalendarCheck, 
          color: 'text-blue-400',
          iconBg: 'bg-blue-500/10 border-blue-500/20'
        },
        { 
          name: 'Quartos Ocupados', 
          value: `${occupiedCount}/${totalQuartos}`, 
          sub: `${occupancyPercent}% ocupado`,
          icon: Users, 
          color: 'text-amber-400',
          iconBg: 'bg-amber-500/10 border-amber-500/20'
        },
        { 
          name: 'Quartos Livres', 
          value: freeCount, 
          sub: `${freePercent}% livre`,
          icon: BedDouble, 
          color: 'text-purple-400',
          iconBg: 'bg-purple-500/10 border-purple-500/20'
        },
      ])
      setReservasAtivas(rAtivas || [])
      setRecentActivities(activities)

    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const [recentActivities, setRecentActivities] = useState<any[]>([])

  const handleQuickStatusUpdate = async (reservaId: string, newStatus: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const { error } = await supabase
        .from('reservas')
        .update({ status: newStatus })
        .eq('id', reservaId)
      
      if (error) throw error
      toast.success(`Status atualizado para ${newStatus}`)
      fetchDashboardData()
    } catch (error: any) {
      toast.error(`Erro ao atualizar: ${error.message}`)
    }
  }

  return (
    <main className="space-y-5 animate-fade-in-up" aria-label="Dashboard principal">
      {/* Stats Grid */}
      <section aria-label="Resumo Financeiro e Ocupação">
        {loading && stats.length === 0 ? <StatSkeleton /> : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
            {stats.map((stat) => (
              <article key={stat.name} className="relative overflow-hidden rounded-lg bg-[#1c1c1c] p-5 border border-[#2e2e2e] transition-all hover:border-[#444444] group">
                <div className="flex items-center gap-4">
                  <div className={cn("p-2.5 rounded-lg border transition-transform duration-200 group-hover:scale-105", stat.iconBg)}>
                    <stat.icon className={cn("h-4 w-4", stat.color)} aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[11px] font-medium text-[#707070] uppercase tracking-wider truncate">{stat.name}</h3>
                    <p className="text-xl font-semibold text-[#ededed] mt-0.5 tracking-tight">{stat.value}</p>
                  </div>
                </div>
                <p className="text-[11px] text-[#3ecf8e] font-medium mt-3 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                  {stat.sub}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Room Map + Painel de Controle */}
        <section className="lg:col-span-2 space-y-5" aria-labelledby="painel-controle-title">
          {/* Painel de Controle + Room Map */}
          <div className="bg-[#1c1c1c] rounded-lg p-5 border border-[#2e2e2e]">
            <header className="mb-5">
              <h2 id="painel-controle-title" className="text-base font-semibold text-[#ededed] tracking-tight">Painel de Controle</h2>
              <p className="text-[13px] text-[#707070] mt-0.5">Resumo geral das operações da Pousada Vovó Maria.</p>
            </header>

            {/* Mapa de Quartos */}
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-[13px] font-semibold text-[#ededed]">Mapa de Quartos</h3>
              <div className="flex items-center gap-4 text-[11px] font-medium text-[#707070]" aria-label="Legenda do mapa de quartos">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#3ecf8e] shadow-[0_0_6px_rgba(62,207,142,0.5)]" aria-hidden="true"></span> Livre
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]" aria-hidden="true"></span> Reservado
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]" aria-hidden="true"></span> Ocupado
                </div>
              </div>
            </div>

            {loading && quartos.length === 0 ? <RoomMapSkeleton /> : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                {quartos.map(quarto => {
                  const reserva = reservasAtivas.find(r => r.quarto_id === quarto.id)
                  const isOcupado = reserva?.status === 'Checked-in'
                  const isReservado = reserva && (reserva.status === 'Confirmado' || reserva.status === 'Pendente' || reserva.status === 'Reservado')
                  const isLivre = !reserva

                  let borderColor = "border-[#3ecf8e]/30"
                  let numberColor = "text-[#3ecf8e]"
                  let statusLabel = "LIVRE"
                  let bgHover = "hover:bg-[#3ecf8e]/5"

                  if (isOcupado) {
                    borderColor = "border-red-500/30"
                    numberColor = "text-red-400"
                    statusLabel = "OCUPADO"
                    bgHover = "hover:bg-red-500/5"
                  } else if (isReservado) {
                    borderColor = "border-blue-500/30"
                    numberColor = "text-blue-400"
                    statusLabel = "RESERVADO"
                    bgHover = "hover:bg-blue-500/5"
                  }
                  
                  const content = (
                    <button 
                      type="button"
                      aria-label={`Quarto ${quarto.numero}, Tipo ${quarto.tipo}, Status ${statusLabel}`}
                      className={cn(
                        "relative w-full group rounded-lg border flex flex-col items-center justify-center py-4 px-3 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf8e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1c1c1c]",
                        "bg-[#232323]",
                        borderColor,
                        bgHover
                      )}
                    >
                      <span className={cn("text-base font-semibold", numberColor)}>
                        {quarto.numero}
                      </span>
                      <BedDouble className="h-5 w-5 text-[#555555] my-1 transition-transform group-hover:scale-110" aria-hidden="true" />
                      <span className="text-[9px] font-medium text-[#707070] uppercase tracking-wider">
                        {quarto.tipo}
                      </span>
                      {!isLivre && (
                        <div className="flex gap-2 mt-2">
                          {(reserva.status === 'Confirmado' || reserva.status === 'Reservado' || reserva.status === 'Pendente') && (
                            <button 
                              type="button"
                              onClick={(e) => handleQuickStatusUpdate(reserva.id, 'Checked-in', e)}
                              className="px-2 py-0.5 rounded bg-[#3ecf8e]/15 hover:bg-[#3ecf8e]/25 text-[#3ecf8e] text-[8px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3ecf8e]"
                              aria-label={`Realizar check-in para reserva de ${reserva.hospedes?.nome}`}
                            >
                              CHECK-IN
                            </button>
                          )}
                          {reserva.status === 'Checked-in' && (
                            <button 
                              type="button"
                              onClick={(e) => handleQuickStatusUpdate(reserva.id, 'Finalizado', e)}
                              className="px-2 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 text-[8px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500"
                              aria-label={`Realizar check-out para reserva de ${reserva.hospedes?.nome}`}
                            >
                              CHECK-OUT
                            </button>
                          )}
                        </div>
                      )}
                    </button>
                  )

                  return (
                    <ReservaModal 
                      key={quarto.id}
                      reserva={reserva}
                      initialData={isLivre ? { quarto_id: quarto.id } : undefined}
                      onRefresh={fetchDashboardData}
                    >
                      {!isLivre ? (
                        <Tooltip 
                          content={
                            <div className="flex flex-col gap-1">
                              <span className="font-semibold">{reserva.hospedes?.nome || 'Hóspede'}</span>
                              <span className="text-[10px] opacity-70">Saída: {format(new Date(reserva.data_checkout), "dd/MM")}</span>
                            </div>
                          }
                        >
                          {content}
                        </Tooltip>
                      ) : content}
                    </ReservaModal>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Quick Actions + Arrivals + Activity */}
        <aside className="space-y-5" aria-label="Ações rápidas e informações secundárias">
          {/* Quick Actions */}
          <div className="bg-[#1c1c1c] rounded-lg p-5 border border-[#2e2e2e]">
            <h3 className="text-[13px] font-semibold text-[#ededed] mb-4">Ações Rápidas</h3>
            <div className="space-y-2.5">
              <ReservaModal onRefresh={fetchDashboardData}>
                <button 
                  type="button"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#3ecf8e] hover:bg-[#24b47e] text-[#111111] rounded-lg font-semibold text-[13px] transition-all active:scale-[0.98] shadow-md shadow-[#3ecf8e]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf8e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1c1c1c]"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Nova Reserva
                </button>
              </ReservaModal>
              <Link
                href="/hospedes"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#232323] hover:bg-[#2e2e2e] text-[#ededed] rounded-lg font-medium text-[13px] transition-all active:scale-[0.98] border border-[#2e2e2e] hover:border-[#444444] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf8e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1c1c1c]"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Novo Hóspede
              </Link>
            </div>
          </div>

          {/* Chegadas */}
          <div className="bg-[#1c1c1c] rounded-lg p-5 border border-[#2e2e2e]">
            <h3 className="text-[13px] font-semibold text-[#ededed] mb-4">Próximas Chegadas</h3>
            <ul className="space-y-3" role="list">
              {proximasChegadas.length > 0 ? proximasChegadas.slice(0, 3).map((reserva) => (
                <li key={reserva.id} className="flex items-center gap-3 group">
                  <div className="h-8 w-8 rounded-md bg-[#232323] flex items-center justify-center text-[12px] font-semibold text-[#707070] border border-[#2e2e2e] shrink-0" aria-hidden="true">
                    {reserva.hospedes?.nome?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[#ededed] truncate" title={reserva.hospedes?.nome}>
                      {reserva.hospedes?.nome}
                    </p>
                    <p className="text-[11px] text-[#555555]">
                      {reserva.quartos?.numero ? `${reserva.quartos.numero} ${reserva.quartos.tipo?.toUpperCase()}` : ''} · {format(new Date(reserva.data_checkin), "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                  </div>
                  <span className="inline-flex items-center justify-center rounded-md bg-[#3ecf8e]/10 px-2 py-0.5 text-[10px] font-semibold text-[#3ecf8e] uppercase tracking-wider border border-[#3ecf8e]/20 shrink-0">
                    {reserva.status}
                  </span>
                </li>
              )) : (
                <li className="py-6 text-center">
                  <p className="text-[13px] text-[#555555] italic">Nenhuma chegada prevista</p>
                </li>
              )}
            </ul>
            <Link 
              href="/reservas"
              className="w-full mt-4 py-2 text-[11px] font-semibold text-[#707070] hover:text-[#3ecf8e] transition-colors border-t border-[#2e2e2e] pt-3 block text-center uppercase tracking-wider focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf8e] rounded-b-lg"
            >
              Ver agenda completa
            </Link>
          </div>

          {/* Atividade */}
          <div className="bg-[#1c1c1c] rounded-lg p-5 border border-[#2e2e2e]">
            <h3 className="text-[13px] font-semibold text-[#ededed] mb-4">Atividade Recente</h3>
            <ul className="space-y-3" role="list">
              {recentActivities.length > 0 ? recentActivities.map((item, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <div className={cn("p-1.5 rounded-md shrink-0", item.bg)} aria-hidden="true">
                    <item.icon className={cn("h-3.5 w-3.5", item.color)} />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-[#ededed] leading-snug">{item.text}</p>
                    <p className="text-[10px] text-[#555555] mt-0.5 font-medium">{item.time}</p>
                  </div>
                </li>
              )) : (
                <li className="py-4 text-center">
                  <p className="text-[13px] text-[#555555] italic">Sem atividades recentes</p>
                </li>
              )}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  )
}
