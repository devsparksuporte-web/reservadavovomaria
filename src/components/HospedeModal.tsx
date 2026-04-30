"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { X, Save, User, Phone, CreditCard, Plus, Pencil } from "lucide-react"

interface HospedeModalProps {
  hospede?: any
  onRefresh?: () => void
}

export function HospedeModal({ hospede, onRefresh }: HospedeModalProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form states
  const [nome, setNome] = useState("")
  const [telefone, setTelefone] = useState("")
  const [cpf, setCpf] = useState("")

  useEffect(() => {
    if (isOpen && hospede) {
      setNome(hospede.nome || "")
      setTelefone(hospede.telefone || "")
      setCpf(hospede.cpf || "")
    } else if (isOpen && !hospede) {
      setNome("")
      setTelefone("")
      setCpf("")
    }
  }, [isOpen, hospede])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const payload = {
        nome,
        telefone,
        cpf: cpf || null
      }

      if (hospede) {
        const { error } = await supabase
          .from('hospedes')
          .update(payload)
          .eq('id', hospede.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('hospedes')
          .insert([payload])
        
        if (error) throw error
      }

      setIsOpen(false)
      if (onRefresh) {
        onRefresh()
      } else {
        router.refresh()
      }
    } catch (err: any) {
      alert("Erro ao salvar hóspede: " + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={hospede 
          ? "text-zinc-500 hover:text-emerald-400 transition-colors"
          : "inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-colors"
        }
      >
        {hospede ? <Pencil className="h-4 w-4" /> : <><Plus className="mr-2 h-4 w-4" /> Novo Hóspede</>}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-hidden">
          <div className="w-full max-w-md flex flex-col rounded-2xl bg-white dark:bg-[#1a1d27] shadow-2xl max-h-[95vh] border border-zinc-200 dark:border-[#2a2d3a]">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-[#2a2d3a] p-5 shrink-0 rounded-t-2xl">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                {hospede ? "Editar Hóspede" : "Novo Hóspede"}
              </h3>
              <button type="button" onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-zinc-300 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar min-h-0">
              <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                    <User className="h-4 w-4 text-zinc-400" /> Nome Completo
                  </label>
                  <input
                    required
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-zinc-200 dark:border-[#2a2d3a] bg-zinc-50 dark:bg-[#151821] px-3 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Nome do cliente"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                    <Phone className="h-4 w-4 text-zinc-400" /> Telefone
                  </label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-zinc-200 dark:border-[#2a2d3a] bg-zinc-50 dark:bg-[#151821] px-3 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-zinc-400" /> CPF
                  </label>
                  <input
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-zinc-200 dark:border-[#2a2d3a] bg-zinc-50 dark:bg-[#151821] px-3 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="000.000.000-00"
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
                  className="inline-flex items-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-600/20"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {hospede ? "Salvar Alterações" : "Cadastrar Hóspede"}
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
