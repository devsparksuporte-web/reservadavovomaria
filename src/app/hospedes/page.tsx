"use client"

import { supabase } from "@/lib/supabase"
import { Search, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { HospedeModal } from "@/components/HospedeModal"

export default function HospedesPage() {
  const [hospedes, setHospedes] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  const fetchHospedes = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('hospedes')
      .select('*')
      .order('nome', { ascending: true })
    
    if (!error) {
      setHospedes(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchHospedes()
  }, [])

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este hóspede? Todas as suas reservas serão removidas (CASCADE).")) {
      const { error } = await supabase.from('hospedes').delete().eq('id', id)
      if (error) {
        alert("Erro ao excluir: " + error.message)
      } else {
        fetchHospedes()
      }
    }
  }

  const filteredHospedes = hospedes.filter(h => 
    h.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (h.cpf && h.cpf.includes(searchTerm))
  )

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
            Hóspedes
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
            Gerenciamento de clientes e histórico de contatos.
          </p>
        </div>
        <div className="mt-4 sm:ml-4 sm:mt-0">
          <HospedeModal onRefresh={fetchHospedes} />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-grow max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <Search className="h-4 w-4 text-zinc-500" aria-hidden="true" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-xl border border-zinc-200 dark:border-[#2a2d3a] bg-white dark:bg-[#1a1d27] py-2.5 pl-10 pr-3 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 sm:text-sm transition-all"
            placeholder="Buscar por nome ou CPF..."
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white dark:bg-[#1a1d27] border border-zinc-200 dark:border-[#2a2d3a]">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-[#2a2d3a]">
          <thead className="bg-zinc-50 dark:bg-[#151821]">
            <tr>
              <th scope="col" className="py-3.5 pl-6 pr-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">Nome</th>
              <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">Telefone</th>
              <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">CPF</th>
              <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">Cadastro</th>
              <th scope="col" className="relative py-3.5 pl-3 pr-6"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-[#2a2d3a]">
            {filteredHospedes.map((hospede) => (
              <tr key={hospede.id} className="hover:bg-zinc-50 dark:hover:bg-[#151821] transition-colors">
                <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm font-medium text-zinc-900 dark:text-white">
                  {hospede.nome}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                  {hospede.telefone || '-'}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                  {hospede.cpf || '-'}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                  {new Date(hospede.created_at).toLocaleDateString('pt-BR')}
                </td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm font-medium space-x-3">
                  <HospedeModal hospede={hospede} onRefresh={fetchHospedes} />
                  <button 
                    onClick={() => handleDelete(hospede.id)}
                    className="text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            
            {!loading && filteredHospedes.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-sm text-zinc-500">
                  {searchTerm ? "Nenhum hóspede encontrado para esta busca." : "Nenhum hóspede cadastrado ainda."}
                </td>
              </tr>
            )}

            {loading && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-sm text-zinc-500">
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    Carregando hóspedes...
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
