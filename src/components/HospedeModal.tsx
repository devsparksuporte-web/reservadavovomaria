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
          : "inline-flex items-center rounded-lg bg-[#3ecf8e] px-4 py-2.5 text-[13px] font-semibold text-[#111111] hover:bg-[#24b47e] transition-colors"
        }
      >
        {hospede ? <Pencil className="h-4 w-4" /> : <><Plus className="mr-2 h-4 w-4" /> Novo Hóspede</>}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/40 p-4 sm:p-6 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg m-auto flex flex-col rounded-lg bg-[#1c1c1c] border border-[#2e2e2e] animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-[#2e2e2e] p-5 shrink-0">
              <h3 className="text-base font-semibold text-[#ededed]">
                {hospede ? "Editar Hóspede" : "Novo Hóspede"}
              </h3>
              <button type="button" onClick={() => setIsOpen(false)} className="text-[#555555] hover:text-[#ededed] p-1 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar min-h-0">
              <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-medium text-[#707070] uppercase tracking-wider flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-[#555555]" /> Nome Completo
                  </label>
                  <input
                    required
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="mt-1.5 block w-full rounded-md border border-[#2e2e2e] bg-[#232323] px-3 py-2.5 text-[13px] text-[#ededed] focus:border-[#3ecf8e]/40 focus:outline-none focus:ring-1 focus:ring-[#3ecf8e]/40 transition-all"
                    placeholder="Nome do cliente"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#707070] uppercase tracking-wider flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-[#555555]" /> Telefone
                  </label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className="mt-1.5 block w-full rounded-md border border-[#2e2e2e] bg-[#232323] px-3 py-2.5 text-[13px] text-[#ededed] focus:border-[#3ecf8e]/40 focus:outline-none focus:ring-1 focus:ring-[#3ecf8e]/40 transition-all"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#707070] uppercase tracking-wider flex items-center gap-2">
                    <CreditCard className="h-3.5 w-3.5 text-[#555555]" /> CPF
                  </label>
                  <input
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    className="mt-1.5 block w-full rounded-md border border-[#2e2e2e] bg-[#232323] px-3 py-2.5 text-[13px] text-[#ededed] focus:border-[#3ecf8e]/40 focus:outline-none focus:ring-1 focus:ring-[#3ecf8e]/40 transition-all"
                    placeholder="000.000.000-00"
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
                  className="inline-flex items-center rounded-md bg-[#3ecf8e] px-5 py-2.5 text-[13px] font-semibold text-[#111111] hover:bg-[#24b47e] disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-[#111111]/30 border-t-[#111111] rounded-full animate-spin mr-2"></div>
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
