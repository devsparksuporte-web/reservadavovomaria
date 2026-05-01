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
      <div key={i} className="rounded-2xl bg-white dark:bg-[#1a1d27] p-5 border border-zinc-200 dark:border-[#2a2d3a]">
        <div className="flex items-center gap-4">
          <Skeleton className="h-11 w-11 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-16" />
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
      <div key={i} className="rounded-xl border-2 border-zinc-100 dark:border-[#2a2d3a] flex flex-col items-center justify-center py-5 px-3 bg-white dark:bg-[#151821]">
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
          color: 'text-emerald-400',
          iconBg: 'bg-emerald-500/10 border-emerald-500/20'
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
    <main className="space-y-6 animate-fade-in-up" aria-label="Dashboard principal">
      {/* Stats Grid */}
      <section aria-label="Resumo Financeiro e Ocupação">
        {loading && stats.length === 0 ? <StatSkeleton /> : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
            {stats.map((stat) => (
              <article key={stat.name} className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-[#1a1d27]/80 backdrop-blur-md p-5 border border-zinc-200/50 dark:border-[#2a2d3a]/50 transition-all hover:border-zinc-300 dark:hover:border-[#32364a] hover:shadow-sm group">
                <div className="flex items-center gap-4">
                  <div className={cn("p-3 rounded-xl border transition-transform duration-300 group-hover:scale-105", stat.iconBg)}>
                    <stat.icon className={cn("h-5 w-5", stat.color)} aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider truncate">{stat.name}</h3>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-0.5 tracking-tight">{stat.value}</p>
                  </div>
                </div>
                <p className="text-xs text-emerald-600 dark:text-emerald-500 font-medium mt-3 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                  {stat.sub}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Room Map + Painel de Controle */}
        <section className="lg:col-span-2 space-y-6" aria-labelledby="painel-controle-title">
          {/* Painel de Controle + Room Map */}
          <div className="bg-white/80 dark:bg-[#1a1d27]/80 backdrop-blur-md rounded-2xl p-6 border border-zinc-200/50 dark:border-[#2a2d3a]/50 shadow-sm">
            <header className="mb-6">
              <h2 id="painel-controle-title" className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Painel de Controle</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Resumo geral das operações da Pousada Vovó Maria.</p>
            </header>

            {/* Mapa de Quartos */}
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Mapa de Quartos</h3>
              <div className="flex items-center gap-4 text-xs font-medium text-zinc-600 dark:text-zinc-400" aria-label="Legenda do mapa de quartos">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" aria-hidden="true"></span> LIVRE
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" aria-hidden="true"></span> RESERVADO
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" aria-hidden="true"></span> OCUPADO
                </div>
              </div>
            </div>

            {loading && quartos.length === 0 ? <RoomMapSkeleton /> : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {quartos.map(quarto => {
                  const reserva = reservasAtivas.find(r => r.quarto_id === quarto.id)
                  const isOcupado = reserva?.status === 'Checked-in'
                  const isReservado = reserva && (reserva.status === 'Confirmado' || reserva.status === 'Pendente' || reserva.status === 'Reservado')
                  const isLivre = !reserva

                  let borderColor = "border-emerald-500/40"
                  let numberColor = "text-emerald-400"
                  let statusLabel = "LIVRE"
                  let bgHover = "hover:bg-emerald-500/5"

                  if (isOcupado) {
                    borderColor = "border-red-500/40"
                    numberColor = "text-red-400"
                    statusLabel = "OCUPADO"
                    bgHover = "hover:bg-red-500/5"
                  } else if (isReservado) {
                    borderColor = "border-blue-500/40"
                    numberColor = "text-blue-400"
                    statusLabel = "RESERVADO"
                    bgHover = "hover:bg-blue-500/5"
                  }
                  
                  const content = (
                    <button 
                      type="button"
                      aria-label={`Quarto ${quarto.numero}, Tipo ${quarto.tipo}, Status ${statusLabel}`}
                      className={cn(
                        "relative w-full group rounded-xl border-2 flex flex-col items-center justify-center py-5 px-3 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#1a1d27]",
                        "bg-white dark:bg-[#151821]",
                        borderColor,
                        bgHover
                      )}
                    >
                      <span className={cn("text-lg font-bold", numberColor)}>
                        {quarto.numero}
                      </span>
                      <BedDouble className="h-6 w-6 text-zinc-600 dark:text-zinc-500 my-1.5 transition-transform group-hover:scale-110" aria-hidden="true" />
                      <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        {quarto.tipo}
                      </span>
                      {!isLivre && (
                        <div className="flex gap-2 mt-2">
                          {(reserva.status === 'Confirmado' || reserva.status === 'Reservado' || reserva.status === 'Pendente') && (
                            <button 
                              type="button"
                              onClick={(e) => handleQuickStatusUpdate(reserva.id, 'Checked-in', e)}
                              className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[8px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                              aria-label={`Realizar check-in para reserva de ${reserva.hospedes?.nome}`}
                            >
                              CHECK-IN
                            </button>
                          )}
                          {reserva.status === 'Checked-in' && (
                            <button 
                              type="button"
                              onClick={(e) => handleQuickStatusUpdate(reserva.id, 'Finalizado', e)}
                              className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-600 dark:text-amber-400 text-[8px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500"
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
                              <span className="font-bold">{reserva.hospedes?.nome || 'Hóspede'}</span>
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
        <aside className="space-y-6" aria-label="Ações rápidas e informações secundárias">
          {/* Quick Actions */}
          <div className="bg-white/80 dark:bg-[#1a1d27]/80 backdrop-blur-md rounded-2xl p-6 border border-zinc-200/50 dark:border-[#2a2d3a]/50 shadow-sm">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-4">Ações Rápidas</h3>
            <div className="space-y-3">
              <ReservaModal onRefresh={fetchDashboardData}>
                <button 
                  type="button"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-all active:scale-[0.98] shadow-lg shadow-emerald-600/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#1a1d27]"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Nova Reserva
                </button>
              </ReservaModal>
              <Link
                href="/hospedes"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-900 dark:bg-emerald-600/10 dark:hover:bg-emerald-600/20 dark:text-emerald-400 text-white rounded-xl font-semibold text-sm transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#1a1d27]"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Novo Hóspede
              </Link>
            </div>
          </div>

          {/* Chegadas */}
          <div className="bg-white/80 dark:bg-[#1a1d27]/80 backdrop-blur-md rounded-2xl p-6 border border-zinc-200/50 dark:border-[#2a2d3a]/50 shadow-sm">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-4">Próximas Chegadas</h3>
            <ul className="space-y-4" role="list">
              {proximasChegadas.length > 0 ? proximasChegadas.slice(0, 3).map((reserva) => (
                <li key={reserva.id} className="flex items-center gap-3 group">
                  <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-[#252836] flex items-center justify-center text-sm font-bold text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-[#2a2d3a] shrink-0" aria-hidden="true">
                    {reserva.hospedes?.nome?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate" title={reserva.hospedes?.nome}>
                      {reserva.hospedes?.nome}
                    </p>
                    <p className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      {reserva.quartos?.numero ? `${reserva.quartos.numero} ${reserva.quartos.tipo?.toUpperCase()}` : ''} · {format(new Date(reserva.data_checkin), "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                  </div>
                  <span className="inline-flex items-center justify-center rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider border border-emerald-500/20 shrink-0">
                    {reserva.status}
                  </span>
                </li>
              )) : (
                <li className="py-8 text-center">
                  <p className="text-sm text-zinc-500 italic">Nenhuma chegada prevista</p>
                </li>
              )}
            </ul>
            <Link 
              href="/reservas"
              className="w-full mt-4 py-2.5 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors border-t border-zinc-200 dark:border-[#2a2d3a] pt-4 block text-center uppercase tracking-wider focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-b-xl"
            >
              Ver agenda completa
            </Link>
          </div>

          {/* Atividade */}
          <div className="bg-white/80 dark:bg-[#1a1d27]/80 backdrop-blur-md rounded-2xl p-6 border border-zinc-200/50 dark:border-[#2a2d3a]/50 shadow-sm">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-4">Atividade Recente</h3>
            <ul className="space-y-4" role="list">
              {recentActivities.length > 0 ? recentActivities.map((item, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <div className={cn("p-2 rounded-lg shrink-0", item.bg)} aria-hidden="true">
                    <item.icon className={cn("h-4 w-4", item.color)} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-snug">{item.text}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5 uppercase font-semibold tracking-wider">{item.time}</p>
                  </div>
                </li>
              )) : (
                <li className="py-4 text-center">
                  <p className="text-xs text-zinc-500 italic">Sem atividades recentes</p>
                </li>
              )}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  )
}
