"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { X, Pencil, Plus } from "lucide-react"

interface QuartoModalProps {
  quarto?: any // Se passado, entra no modo edição
  onRefresh?: () => void | Promise<void>
}

export function QuartoModal({ quarto, onRefresh }: QuartoModalProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form states
  const [numero, setNumero] = useState("")
  const [tipo, setTipo] = useState("Suite")
  const [capacidade, setCapacidade] = useState(2)
  const [precoBase, setPrecoBase] = useState("")

  useEffect(() => {
    if (quarto) {
      setNumero(quarto.numero)
      setTipo(quarto.tipo)
      setCapacidade(quarto.capacidade)
      setPrecoBase(quarto.preco_base?.toString())
    }
  }, [quarto])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const payload = {
      numero,
      tipo,
      capacidade: Number(capacidade),
      preco_base: parseFloat(precoBase),
      status: quarto?.status || 'Disponível'
    }

    let error;
    if (quarto) {
      // Edição
      const { error: editError } = await supabase
        .from('quartos')
        .update(payload)
        .eq('id', quarto.id)
      error = editError
    } else {
      // Criação
      const { error: insertError } = await supabase
        .from('quartos')
        .insert([payload])
      error = insertError
    }

    if (error) {
      alert("Erro ao salvar quarto: " + error.message)
      setIsSubmitting(false)
      return
    }

    setIsOpen(false)
    setIsSubmitting(false)
    
    if (!quarto) {
      setNumero("")
      setPrecoBase("")
    }
    
    if (onRefresh) onRefresh()
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={quarto 
          ? "p-2 text-zinc-500 hover:text-emerald-400 transition-colors rounded-lg hover:bg-[#151821]"
          : "inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-colors"
        }
      >
        {quarto ? <Pencil className="h-4 w-4" /> : <><Plus className="mr-2 h-4 w-4" /> Adicionar Quarto</>}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/70 p-4 sm:p-6 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md m-auto flex flex-col rounded-2xl bg-white dark:bg-[#1a1d27] shadow-2xl border border-zinc-200 dark:border-[#2a2d3a] animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-[#2a2d3a] p-5 shrink-0 rounded-t-2xl">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                {quarto ? `Editar Quarto ${quarto.numero}` : 'Novo Quarto'}
              </h3>
              <button type="button" onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-zinc-300 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-5 custom-scrollbar">
              <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">Número / Nome do Quarto</label>
                <input
                  required
                  type="text"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-zinc-200 dark:border-[#2a2d3a] bg-zinc-50 dark:bg-[#151821] px-3 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-500/20"
                  placeholder="Ex: 101 ou Chalé 1"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">Tipo</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-zinc-200 dark:border-[#2a2d3a] bg-zinc-50 dark:bg-[#151821] px-3 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-500/20"
                >
                  <option value="Suite">Suite</option>
                  <option value="Solteiro">Solteiro</option>
                  <option value="Casal Standard">Casal Standard</option>
                  <option value="Dormitório">Dormitório</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">Capacidade</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={capacidade}
                    onChange={(e) => setCapacidade(Number(e.target.value))}
                    className="mt-1 block w-full rounded-md border border-zinc-200 dark:border-[#2a2d3a] bg-zinc-50 dark:bg-[#151821] px-3 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">Preço Base (R$)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={precoBase}
                    onChange={(e) => setPrecoBase(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-zinc-200 dark:border-[#2a2d3a] bg-zinc-50 dark:bg-[#151821] px-3 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-500/20"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-zinc-100 dark:border-[#2a2d3a]">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl border border-zinc-200 dark:border-[#2a2d3a] bg-white dark:bg-[#151821] px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#252836] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-600/20"
                >
                  {isSubmitting ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
