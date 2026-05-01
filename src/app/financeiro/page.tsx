"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { ArrowUpRight, ArrowDownRight, CircleDollarSign, CheckCircle, Trash2, Calendar, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRole } from "@/hooks/useRole"

export default function FinanceiroPage() {
  const [pagamentos, setPagamentos] = useState<any[]>([])
  const [stats, setStats] = useState({ totalRecebido: 0, totalPendente: 0 })
  const [loading, setLoading] = useState(true)
  const { isAdmin } = useRole()

  const fetchData = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('pagamentos')
      .select(`
        id,
        valor,
        forma_pagamento,
        status,
        data_pagamento,
        reservas(hospedes(nome))
      `)
      .order('data_pagamento', { ascending: false })
    
    if (error) {
      console.error(error)
    } else {
      setPagamentos(data || [])
      
      const recebido = data?.filter(p => p.status === 'Pago').reduce((acc, curr) => acc + Number(curr.valor), 0) || 0
      const pendente = data?.filter(p => p.status === 'Pendente').reduce((acc, curr) => acc + Number(curr.valor), 0) || 0
      setStats({ totalRecebido: recebido, totalPendente: pendente })
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleConfirmPayment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('pagamentos')
        .update({ status: 'Pago', data_pagamento: new Date().toISOString() })
        .eq('id', id)
      
      if (error) throw error
      fetchData()
    } catch (err: any) {
      alert("Erro ao confirmar pagamento: " + err.message)
    }
  }

  const handleDeletePayment = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este registro de pagamento?")) return

    try {
      const { error } = await supabase
        .from('pagamentos')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      fetchData()
    } catch (err: any) {
      alert("Erro ao excluir pagamento: " + err.message)
    }
  }

  const statCards = [
    { 
      name: 'Total Recebido', 
      value: `R$ ${stats.totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: ArrowUpRight, 
      color: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20',
      accent: 'border-t-emerald-500'
    },
    { 
      name: 'Total Pendente', 
      value: `R$ ${stats.totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: ArrowDownRight, 
      color: 'text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20',
      accent: 'border-t-amber-500'
    },
    { 
      name: 'Receita Projetada', 
      value: `R$ ${(stats.totalRecebido + stats.totalPendente).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: CircleDollarSign, 
      color: 'text-blue-400',
      iconBg: 'bg-blue-500/10 border-blue-500/20',
      accent: 'border-t-blue-500'
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Financeiro</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
          Acompanhamento de receitas e pendências de pagamentos.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 stagger-children">
        {statCards.map((card) => (
          <div key={card.name} className={cn("overflow-hidden rounded-2xl bg-white dark:bg-[#1a1d27] p-5 border border-zinc-200 dark:border-[#2a2d3a] border-t-4", card.accent)}>
            <div className="flex items-center gap-3">
              <div className={cn("p-2.5 rounded-xl border", card.iconBg)}>
                <card.icon className={cn("h-5 w-5", card.color)} />
              </div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-500">{card.name}</p>
            </div>
            <p className="mt-3 text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl bg-white dark:bg-[#1a1d27] border border-zinc-200 dark:border-[#2a2d3a]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-[#2a2d3a]">
            <thead className="bg-zinc-50 dark:bg-[#151821]">
              <tr>
                <th scope="col" className="py-3.5 pl-6 pr-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> Data</div>
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2"><User className="h-3.5 w-3.5" /> Hóspede</div>
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">Forma de Pgto</th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-3 py-3.5 text-right text-xs font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">Valor</th>
                <th scope="col" className="relative py-3.5 pl-3 pr-6"><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-[#2a2d3a]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-zinc-500">
                    <div className="flex items-center justify-center gap-3">
                      <div className="h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      Carregando pagamentos...
                    </div>
                  </td>
                </tr>
              ) : pagamentos.map((pagamento: any) => (
                <tr key={pagamento.id} className="hover:bg-zinc-50 dark:hover:bg-[#151821] transition-colors">
                  <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm text-zinc-500 dark:text-zinc-400">
                    {new Date(pagamento.data_pagamento).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-zinc-900 dark:text-white">
                    {pagamento.reservas?.hospedes?.nome || 'Hóspede Removido'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-zinc-500 dark:text-zinc-400 capitalize">
                    {pagamento.forma_pagamento}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <span className={cn("inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-bold border uppercase tracking-wider",
                      pagamento.status === 'Pago' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    )}>
                      {pagamento.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm font-bold text-zinc-900 dark:text-white text-right">
                    R$ {Number(pagamento.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      {pagamento.status === 'Pendente' && (
                        <button
                          onClick={() => handleConfirmPayment(pagamento.id)}
                          className="text-emerald-500 hover:text-emerald-400 transition-colors p-1"
                          title="Confirmar Pagamento"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => handleDeletePayment(pagamento.id)}
                          className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                          title="Excluir Registro"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              
              {!loading && pagamentos.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-zinc-500">
                    Nenhum registro financeiro encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
