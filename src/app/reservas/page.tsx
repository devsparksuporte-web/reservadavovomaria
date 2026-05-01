/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { supabase } from "@/lib/supabase"
import { ReservaModal } from "@/components/ReservaModal"
import { Trash2, Search } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { useRole } from "@/hooks/useRole"

export default function ReservasPage() {
  const [reservas, setReservas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { isAdmin } = useRole()

  const fetchReservas = async () => {
    setLoading(true)
    let query = supabase
      .from('reservas')
      .select(`
        *,
        hospedes (nome, telefone),
        quartos (numero, tipo)
      `)
      .order('data_checkin', { ascending: true })

    if (searchTerm) {
      query = query.ilike('codigo', `%${searchTerm}%`)
    }

    const { data, error } = await query
    
    if (!error) {
      setReservas(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchReservas()
  }, [searchTerm])

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta reserva? Esta ação não pode ser desfeita.")) {
      const { error } = await supabase.from('reservas').delete().eq('id', id)
      if (error) {
        alert("Erro ao excluir: " + error.message)
      } else {
        fetchReservas()
      }
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Hospedado':
      case 'Checked-in':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'Reservado':
      case 'Confirmado':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'Cancelado':
        return 'bg-red-500/10 text-red-400 border-red-500/20'
      case 'Finalizado':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#ededed] tracking-tight">
            Reservas
          </h2>
          <p className="mt-1 text-[13px] text-[#707070]">
            Acompanhe todas as reservas, check-ins e check-outs.
          </p>
        </div>
        <div className="mt-4 sm:ml-4 sm:mt-0">
          <ReservaModal onRefresh={fetchReservas} />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-[#555555]" />
          </div>
          <input
            type="text"
            placeholder="Buscar por código (Ex: A8B9C1D2)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-md border border-[#2e2e2e] bg-[#232323] py-2.5 pl-10 pr-3 text-[13px] text-[#ededed] placeholder:text-[#555555] focus:border-[#3ecf8e]/40 focus:outline-none focus:ring-1 focus:ring-[#3ecf8e]/40 transition-all"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-[#1c1c1c] border border-[#2e2e2e]">
        <table className="min-w-full divide-y divide-[#2e2e2e]">
          <thead className="bg-[#232323]">
            <tr>
              <th scope="col" className="py-3.5 pl-6 pr-3 text-left text-[11px] font-medium text-[#707070] uppercase tracking-wider">Código</th>
              <th scope="col" className="py-3.5 px-3 text-left text-[11px] font-medium text-[#707070] uppercase tracking-wider">Hóspede</th>
              <th scope="col" className="px-3 py-3.5 text-left text-[11px] font-medium text-[#707070] uppercase tracking-wider">Quarto</th>
              <th scope="col" className="px-3 py-3.5 text-left text-[11px] font-medium text-[#707070] uppercase tracking-wider">Período</th>
              <th scope="col" className="px-3 py-3.5 text-left text-[11px] font-medium text-[#707070] uppercase tracking-wider">Status</th>
              <th scope="col" className="px-3 py-3.5 text-left text-[11px] font-medium text-[#707070] uppercase tracking-wider">Total</th>
              <th scope="col" className="relative py-3.5 pl-3 pr-6"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2e2e2e]">
            {reservas.map((reserva: any) => (
              <tr key={reserva.id} className="hover:bg-[#232323] transition-colors">
                <td className="whitespace-nowrap py-4 pl-6 pr-3 text-[13px] font-mono font-bold text-[#ededed]">
                  {reserva.codigo || `#${reserva.id.slice(0,8).toUpperCase()}`}
                </td>
                <td className="whitespace-nowrap py-4 px-3 text-[13px] font-medium text-[#ededed]">
                  {reserva.hospedes?.nome || 'Hóspede Desconhecido'}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-[13px]">
                  <span className="font-semibold text-[#3ecf8e]">
                    {reserva.quartos?.numero ? `Q. ${reserva.quartos.numero}` : 'N/A'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-[13px] text-[#707070]">
                  {new Date(reserva.data_checkin).toLocaleDateString('pt-BR')} - {new Date(reserva.data_checkout).toLocaleDateString('pt-BR')}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-[13px]">
                  <span className={cn("inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-bold border uppercase tracking-wider", getStatusStyle(reserva.status))}>
                    {reserva.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-[13px] font-semibold text-[#ededed]">
                  R$ {reserva.valor_total?.toFixed(2)}
                </td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm font-medium space-x-3">
                  <ReservaModal reserva={reserva} onRefresh={fetchReservas} />
                  {isAdmin && (
                    <button 
                      onClick={() => handleDelete(reserva.id)}
                      className="text-[#555555] hover:text-red-400 transition-colors"
                      title="Excluir reserva"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {!loading && reservas.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[13px] text-[#707070]">
                  {searchTerm ? "Nenhuma reserva encontrada com este código." : "Nenhuma reserva encontrada. Adicione uma nova reserva para começar."}
                </td>
              </tr>
            )}
            
            {loading && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[13px] text-[#707070]">
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-5 w-5 border-2 border-[#3ecf8e] border-t-transparent rounded-full animate-spin"></div>
                    Carregando reservas...
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
