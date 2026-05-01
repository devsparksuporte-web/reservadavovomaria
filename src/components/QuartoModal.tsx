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
      if (error.code === '42501') {
        alert("Erro de RLS: Você não tem permissão para gerenciar quartos. Apenas administradores podem fazer isso.")
      } else {
        alert("Erro ao salvar quarto: " + error.message)
      }
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
          ? "text-[#707070] hover:text-[#3ecf8e] transition-colors"
          : "inline-flex items-center rounded-lg bg-[#3ecf8e] px-4 py-2.5 text-[13px] font-semibold text-[#111111] hover:bg-[#24b47e] transition-colors"
        }
      >
        {quarto ? <Pencil className="h-4 w-4" /> : <><Plus className="mr-2 h-4 w-4" /> Adicionar Quarto</>}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/40 p-4 sm:p-6 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg m-auto flex flex-col rounded-lg bg-[#1c1c1c] border border-[#2e2e2e] animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-[#2e2e2e] p-5 shrink-0">
              <h3 className="text-base font-semibold text-[#ededed]">
                {quarto ? `Editar Quarto ${quarto.numero}` : 'Novo Quarto'}
              </h3>
              <button type="button" onClick={() => setIsOpen(false)} className="text-[#555555] hover:text-[#ededed] p-1 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-5 custom-scrollbar min-h-0">
              <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-[#707070] uppercase tracking-wider">Número / Nome do Quarto</label>
                <input
                  required
                  type="text"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="mt-1.5 block w-full rounded-md border border-[#2e2e2e] bg-[#232323] px-3 py-2.5 text-[13px] text-[#ededed] focus:border-[#3ecf8e]/40 focus:outline-none focus:ring-1 focus:ring-[#3ecf8e]/40 transition-all"
                  placeholder="Ex: 101 ou Chalé 1"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#707070] uppercase tracking-wider">Tipo</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="mt-1.5 block w-full rounded-md border border-[#2e2e2e] bg-[#232323] px-3 py-2.5 text-[13px] text-[#ededed] focus:border-[#3ecf8e]/40 focus:outline-none focus:ring-1 focus:ring-[#3ecf8e]/40 transition-all"
                >
                  <option value="Suite">Suite</option>
                  <option value="Solteiro">Solteiro</option>
                  <option value="Casal Standard">Casal Standard</option>
                  <option value="Dormitório">Dormitório</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-[#707070] uppercase tracking-wider">Capacidade</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={capacidade}
                    onChange={(e) => setCapacidade(Number(e.target.value))}
                    className="mt-1.5 block w-full rounded-md border border-[#2e2e2e] bg-[#232323] px-3 py-2.5 text-[13px] text-[#ededed] focus:border-[#3ecf8e]/40 focus:outline-none focus:ring-1 focus:ring-[#3ecf8e]/40 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#707070] uppercase tracking-wider">Preço Base (R$)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={precoBase}
                    onChange={(e) => setPrecoBase(e.target.value)}
                    className="mt-1.5 block w-full rounded-md border border-[#2e2e2e] bg-[#232323] px-3 py-2.5 text-[13px] text-[#ededed] focus:border-[#3ecf8e]/40 focus:outline-none focus:ring-1 focus:ring-[#3ecf8e]/40 transition-all"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-[#2e2e2e]">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-md border border-[#2e2e2e] bg-[#232323] px-4 py-2.5 text-[13px] font-medium text-[#ededed] hover:bg-[#2e2e2e] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md bg-[#3ecf8e] px-5 py-2.5 text-[13px] font-semibold text-[#111111] hover:bg-[#24b47e] disabled:opacity-50 transition-colors"
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
