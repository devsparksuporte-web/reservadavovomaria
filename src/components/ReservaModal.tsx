"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { X, Printer, CheckCircle2, Pencil, Plus, MessageCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { format, isBefore, parseISO } from "date-fns"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"

const reservaSchema = z.object({
  nomeHospede: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  telefone: z.string().optional(),
  cpf: z.string().optional(),
  dataCheckin: z.string().min(1, "Data de check-in é obrigatória"),
  dataCheckout: z.string().min(1, "Data de check-out é obrigatória"),
  quartoId: z.string().min(1, "Selecione um quarto"),
  numeroPessoas: z.number().min(1, "Mínimo de 1 pessoa"),
  valorTotal: z.number().min(0, "Valor não pode ser negativo"),
  formaPagamento: z.string().min(1, "Forma de pagamento é obrigatória"),
  pagamentoStatus: z.string().min(1, "Status do pagamento é obrigatório"),
}).refine((data) => {
  if (data.dataCheckin && data.dataCheckout) {
    return !isBefore(parseISO(data.dataCheckout), parseISO(data.dataCheckin))
  }
  return true
}, {
  message: "Check-out não pode ser antes do Check-in",
  path: ["dataCheckout"],
})

type ReservaFormData = z.infer<typeof reservaSchema>

interface ReservaModalProps {
  reserva?: any // Se passado, modo edição
  initialData?: {
    data_checkin?: string
    quarto_id?: string
  }
  onRefresh?: () => void | Promise<void>
  children?: React.ReactNode // Gatilho customizado
}

export function ReservaModal({ reserva, initialData, onRefresh, children }: ReservaModalProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [createdReserva, setCreatedReserva] = useState<any>(null)
  const [quartos, setQuartos] = useState<any[]>([])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ReservaFormData>({
    resolver: zodResolver(reservaSchema),
    defaultValues: {
      numeroPessoas: 1,
      valorTotal: 0,
      formaPagamento: "Dinheiro",
      pagamentoStatus: "Pendente",
    }
  })

  useEffect(() => {
    if (isOpen) {
      setServerError(null)
      carregarQuartos()
      if (reserva) {
        reset({
          nomeHospede: reserva.hospedes?.nome || "",
          telefone: reserva.hospedes?.telefone || "",
          cpf: reserva.hospedes?.cpf || "",
          dataCheckin: reserva.data_checkin,
          dataCheckout: reserva.data_checkout,
          quartoId: reserva.quarto_id || "",
          numeroPessoas: reserva.numero_pessoas,
          valorTotal: reserva.valor_total,
          formaPagamento: reserva.pagamentos?.[0]?.forma_pagamento || "Dinheiro",
          pagamentoStatus: reserva.pagamentos?.[0]?.status || "Pendente",
        })
      } else if (initialData) {
        if (initialData.data_checkin) setValue("dataCheckin", initialData.data_checkin)
        if (initialData.quarto_id) setValue("quartoId", initialData.quarto_id)
      } else {
        reset({
          numeroPessoas: 1,
          formaPagamento: "Dinheiro",
          pagamentoStatus: "Pendente",
        })
      }
    }
  }, [isOpen, reserva, initialData, reset, setValue])

  const carregarQuartos = async () => {
    const { data } = await supabase.from('quartos').select('*').order('numero')
    if (data) {
      setQuartos(data)
      if (data.length > 0 && !watch("quartoId") && !reserva) {
        setValue("quartoId", data[0].id)
      }
    }
  }

  const onSubmit = async (data: ReservaFormData) => {
    setIsSubmitting(true)
    setServerError(null)

    try {
      // 0. Verificar conflitos de datas (Overbooking)
      let conflictQuery = supabase
        .from('reservas')
        .select('id')
        .eq('quarto_id', data.quartoId)
        .in('status', ['Reservado', 'Confirmado', 'Checked-in'])
        .or(`and(data_checkin.lt.${data.dataCheckout},data_checkout.gt.${data.dataCheckin})`)

      if (reserva) {
        conflictQuery = conflictQuery.neq('id', reserva.id)
      }

      const { data: conflitos, error: conflitosError } = await conflictQuery
      
      if (conflitosError) throw conflitosError
      if (conflitos && conflitos.length > 0) {
        setServerError("Atenção: Este quarto já possui uma reserva ativa que entra em conflito com este período.")
        setIsSubmitting(false)
        return
      }

      // 1. Criar ou buscar hóspede
      let hospedeId = reserva?.hospede_id || null
      
      if (!reserva) {
        let existingHospedes = null;
        
        if (data.cpf) {
          const { data: cpfData } = await supabase.from('hospedes').select('id').eq('cpf', data.cpf).limit(1)
          existingHospedes = cpfData
        } else if (data.telefone) {
          const { data: telData } = await supabase.from('hospedes').select('id').eq('telefone', data.telefone).limit(1)
          existingHospedes = telData
        } else {
          const { data: nomeData } = await supabase.from('hospedes').select('id').eq('nome', data.nomeHospede).limit(1)
          existingHospedes = nomeData
        }

        if (existingHospedes && existingHospedes.length > 0) {
          hospedeId = existingHospedes[0].id
          await supabase.from('hospedes').update({ 
            nome: data.nomeHospede, 
            telefone: data.telefone, 
            cpf: data.cpf || null 
          }).eq('id', hospedeId)
        } else {
          const { data: newHospede, error: hospedeError } = await supabase
            .from('hospedes')
            .insert([{ nome: data.nomeHospede, telefone: data.telefone, cpf: data.cpf || null }])
            .select()
          
          if (hospedeError) throw hospedeError
          hospedeId = newHospede[0].id
        }
      } else {
        // Atualizar hóspede se necessário
        await supabase.from('hospedes').update({ 
          telefone: data.telefone, 
          cpf: data.cpf || null 
        }).eq('id', hospedeId)
      }

      const payload: any = {
        hospede_id: hospedeId,
        quarto_id: data.quartoId,
        data_checkin: data.dataCheckin,
        data_checkout: data.dataCheckout,
        numero_pessoas: data.numeroPessoas,
        valor_total: data.valorTotal,
        status: reserva?.status || 'Reservado',
      }

      if (!reserva) {
        payload.codigo = Math.random().toString(36).substring(2, 10).toUpperCase();
      }

      let error;
      let dataReserva;

      if (reserva) {
        const { error: editError, data: updatedData } = await supabase
          .from('reservas')
          .update(payload)
          .eq('id', reserva.id)
          .select(`*, hospedes(nome), quartos(*)`)
        error = editError
        dataReserva = updatedData
      } else {
        const { error: insertError, data: newData } = await supabase
          .from('reservas')
          .insert([payload])
          .select(`*, hospedes(nome)`)
        error = insertError
        dataReserva = newData
      }

      if (error) throw error
      if (!dataReserva || dataReserva.length === 0) throw new Error("Erro ao salvar reserva: Nenhum dado retornado")
      const reserva_id = dataReserva[0].id

      // Criar registro de pagamento inicial
      if (!reserva) {
        await supabase.from('pagamentos').insert([{
          reserva_id,
          valor: data.valorTotal,
          forma_pagamento: data.formaPagamento,
          status: data.pagamentoStatus,
          data_pagamento: new Date().toISOString()
        }])
      }

      toast.success(reserva ? "Reserva atualizada com sucesso!" : "Reserva criada com sucesso!")

      if (!reserva) {
        const { data: completeReserva } = await supabase
          .from('reservas')
          .select(`*, hospedes(nome), quartos(*)`)
          .eq('id', reserva_id)
          .single()
        
        setCreatedReserva(completeReserva)
        setShowReceipt(true)
        if (onRefresh) onRefresh()
      } else {
        setIsOpen(false)
        if (onRefresh) onRefresh()
        router.refresh()
      }
    } catch (err: any) {
      setServerError("Erro ao processar reserva: " + err.message)
      toast.error("Ocorreu um erro ao salvar a reserva")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleWhatsApp = (targetPhone?: string) => {
    if (!createdReserva) return

    const quartoNumero = createdReserva.quartos?.numero || reserva?.quartos?.numero || 'N/A';
    const quartoTipo = createdReserva.quartos?.tipo || reserva?.quartos?.tipo || '';

    const message = `*COMPROVANTE DE HOSPEDAGEM* 🏢%0A` +
      `*Pousada Vovó Maria*%0A%0A` +
      `📌 *Código da Reserva:* ${createdReserva.codigo || '#' + createdReserva.id.slice(0, 8).toUpperCase()}%0A` +
      `👤 *Hóspede:* ${createdReserva.hospedes?.nome || reserva?.hospedes?.nome}%0A` +
      `🏠 *Quarto:* ${quartoNumero} ${quartoTipo ? `(${quartoTipo})` : ''}%0A` +
      `📅 *Check-in:* ${new Date(createdReserva.data_checkin).toLocaleDateString('pt-BR')}%0A` +
      `📅 *Check-out:* ${new Date(createdReserva.data_checkout).toLocaleDateString('pt-BR')}%0A` +
      `💰 *Total:* R$ ${createdReserva.valor_total?.toFixed(2)}%0A%0A` +
      `_Confirmação oficial de reserva na Pousada Vovó Maria. Apresente este código no check-in._`;

    let finalPhone = targetPhone;
    
    if (!finalPhone) {
      const rawPhone = createdReserva.hospedes?.telefone || "";
      finalPhone = rawPhone.replace(/\D/g, "");
    }
    
    const whatsappUrl = finalPhone && finalPhone.length >= 10 
      ? `https://wa.me/${finalPhone.startsWith('55') ? finalPhone : '55' + finalPhone}?text=${message}`
      : `https://wa.me/?text=${message}`;

    window.open(whatsappUrl, '_blank');
  }

  const handlePrint = () => {
    window.print()
  }

  if (showReceipt && createdReserva) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4 backdrop-blur-md">
        <div id="receipt-print-area" className="w-full max-w-md flex flex-col rounded-lg bg-[#1c1c1c] shadow-2xl shadow-black/50 max-h-[95vh] overflow-hidden border border-[#2e2e2e] print:rounded-none">
          <div className="bg-[#3ecf8e] shrink-0 p-6 text-center text-[#111111] print:bg-transparent print:text-black print:border-b print-border-black print:p-2">
            <CheckCircle2 className="mx-auto h-12 w-12 mb-2 print:hidden" />
            <h3 className="text-xl font-bold print-black print:text-lg">Reserva Confirmada!</h3>
            <p className="text-[#111111]/70 print-black print:text-xs">Comprovante de Hospedagem</p>
          </div>
          
          <div className="flex-1 overflow-y-auto min-h-0 p-8 space-y-6 print:p-2 print:space-y-4 bg-[#1c1c1c] print-no-bg">
            <div className="flex justify-between items-start border-b border-dashed border-[#2e2e2e] print-border-black pb-4 print:pb-2">
              <div>
                <p className="text-[10px] text-[#707070] uppercase font-semibold tracking-wider print-black">Código da Reserva</p>
                <p className="text-lg font-mono font-bold text-[#ededed] print-black print:text-sm">
                  {createdReserva.codigo || '#' + createdReserva.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-[#707070] uppercase font-semibold tracking-wider print-black">Quarto</p>
                <p className="text-lg font-bold text-[#3ecf8e] print-black print:text-sm">
                   {createdReserva.quartos?.numero || reserva?.quartos?.numero || 'N/A'}
                </p>
                <p className="text-[10px] text-[#707070] uppercase print-black">
                  {createdReserva.quartos?.tipo || reserva?.quartos?.tipo || ''}
                </p>
              </div>
            </div>

            <div className="space-y-4 print:space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-[#707070] print-black print:text-xs">Hóspede:</span>
                <span className="text-sm font-semibold text-[#ededed] print-black print:text-xs">{createdReserva.hospedes?.nome || reserva?.hospedes?.nome}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 print:gap-2">
                <div>
                  <span className="text-[10px] text-[#707070] block uppercase tracking-wider print-black">Check-in:</span>
                  <span className="text-sm font-semibold text-[#ededed] print-black print:text-xs">{new Date(createdReserva.data_checkin).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#707070] block uppercase tracking-wider print-black">Check-out:</span>
                  <span className="text-sm font-semibold text-[#ededed] print-black print:text-xs">{new Date(createdReserva.data_checkout).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
              <div className="flex justify-between border-t border-[#2e2e2e] print-border-black pt-3 print:pt-2">
                <span className="text-base font-bold text-[#ededed] print-black print:text-sm">Total:</span>
                <span className="text-base font-bold text-[#3ecf8e] print-black print:text-sm">R$ {createdReserva.valor_total?.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-[#232323] print-no-bg p-3 print:p-0 rounded-md print:rounded-none text-[10px] text-[#707070] print-black leading-tight border border-[#2e2e2e] print:border-none print:mt-4 print:text-center">
              <p>Confirmação oficial de reserva na Pousada Vovó Maria. Apresente este código no check-in.</p>
            </div>
          </div>

          <div className="p-4 bg-[#232323] flex gap-2 border-t border-[#2e2e2e] print:hidden">
            <button onClick={handlePrint} className="flex-1 inline-flex justify-center items-center rounded-md bg-[#1c1c1c] border border-[#2e2e2e] px-3 py-2.5 text-xs font-semibold text-[#ededed] hover:bg-[#2e2e2e] transition-all">
              <Printer className="mr-2 h-4 w-4" /> Imprimir
            </button>
            <button onClick={() => handleWhatsApp()} className="flex-1 inline-flex justify-center items-center rounded-md bg-[#3ecf8e] hover:bg-[#24b47e] px-3 py-2.5 text-xs font-semibold text-[#111111] transition-all" title="Enviar para o Hóspede">
              <MessageCircle className="mr-1.5 h-3.5 w-3.5" /> Hóspede
            </button>
            <button onClick={() => handleWhatsApp('5522997633952')} className="flex-1 inline-flex justify-center items-center rounded-md bg-[#24b47e] hover:bg-[#1a9b6c] px-3 py-2.5 text-xs font-semibold text-[#111111] transition-all" title="Enviar para Vovó Maria">
              <MessageCircle className="mr-1.5 h-3.5 w-3.5" /> Vovó Maria
            </button>
            <button onClick={() => { setShowReceipt(false); setIsOpen(false); router.refresh(); }} className="flex-1 inline-flex justify-center items-center rounded-md bg-[#2e2e2e] hover:bg-[#444444] px-3 py-2.5 text-xs font-semibold text-[#ededed] transition-all">
              OK
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {children ? (
          children
        ) : (
          <div className="flex items-center gap-2">
            {reserva && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setCreatedReserva(reserva)
                  setShowReceipt(true)
                }}
                className="text-[#555555] hover:text-[#3ecf8e] transition-colors p-1"
                title="Ver Comprovante"
              >
                <Printer className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsOpen(true)
              }}
              className={reserva
                ? "text-[#707070] hover:text-[#3ecf8e] transition-colors p-1"
                : "inline-flex items-center rounded-lg bg-[#3ecf8e] px-4 py-2.5 text-[13px] font-semibold text-[#111111] shadow-md shadow-[#3ecf8e]/15 hover:bg-[#24b47e] transition-colors"
              }
              title={reserva ? "Editar Reserva" : "Nova Reserva"}
            >
              {reserva ? <Pencil className="h-4 w-4" /> : <><Plus className="mr-2 h-4 w-4" /> Nova Reserva</>}
            </button>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/30 p-4 sm:p-6 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-lg m-auto flex flex-col rounded-lg bg-[#1c1c1c] shadow-2xl shadow-black/50 border border-[#2e2e2e] animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-[#2e2e2e] p-5 shrink-0">
              <h3 className="text-base font-semibold text-[#ededed]">
                {reserva ? "Editar Reserva" : "Nova Reserva"}
              </h3>
              <button type="button" onClick={() => setIsOpen(false)} className="text-[#555555] hover:text-[#ededed] p-1 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar min-h-0">
              {(serverError || Object.keys(errors).length > 0) && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium animate-shake flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    {serverError && <p>{serverError}</p>}
                    {Object.values(errors).map((error, index) => (
                      <p key={index}>{error.message}</p>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              
              <div className="space-y-4 border-b border-[#2e2e2e] pb-4">
                <h4 className="text-[13px] font-semibold text-[#ededed]">Dados do Hóspede</h4>
                <div>
                  <label className="block text-[11px] font-medium text-[#707070] uppercase tracking-wider mb-1">Nome Completo</label>
                  <input 
                    {...register("nomeHospede")}
                    disabled={!!reserva}
                    className={cn(
                      "block w-full rounded-md border bg-[#232323] px-3 py-2.5 text-[13px] text-[#ededed] focus:outline-none focus:ring-1 disabled:opacity-50 transition-all",
                      errors.nomeHospede ? "border-rose-500/50 focus:ring-rose-500/20" : "border-[#2e2e2e] focus:border-[#3ecf8e]/40 focus:ring-[#3ecf8e]/40"
                    )}
                    placeholder="Nome do hóspede" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-medium text-[#707070] uppercase tracking-wider mb-1">Telefone</label>
                    <input 
                      {...register("telefone")}
                      className="block w-full rounded-md border border-[#2e2e2e] bg-[#232323] px-3 py-2.5 text-[13px] text-[#ededed] focus:border-[#3ecf8e]/40 focus:outline-none focus:ring-1 focus:ring-[#3ecf8e]/40 transition-all"
                      placeholder="(11) 99999-9999" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#707070] uppercase tracking-wider mb-1">CPF</label>
                    <input 
                      {...register("cpf")}
                      className="block w-full rounded-md border border-[#2e2e2e] bg-[#232323] px-3 py-2.5 text-[13px] text-[#ededed] focus:border-[#3ecf8e]/40 focus:outline-none focus:ring-1 focus:ring-[#3ecf8e]/40 transition-all"
                      placeholder="000.000.000-00" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[13px] font-semibold text-[#ededed]">Detalhes da Estadia</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-medium text-[#707070] uppercase tracking-wider mb-1">Check-in</label>
                    <input 
                      type="date" 
                      {...register("dataCheckin")}
                      className={cn(
                        "block w-full rounded-md border bg-[#232323] px-3 py-2.5 text-[13px] text-[#ededed] focus:outline-none focus:ring-1 transition-all",
                        errors.dataCheckin ? "border-rose-500/50 focus:ring-rose-500/20" : "border-[#2e2e2e] focus:border-[#3ecf8e]/40 focus:ring-[#3ecf8e]/40"
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#707070] uppercase tracking-wider mb-1">Check-out</label>
                    <input 
                      type="date" 
                      {...register("dataCheckout")}
                      className={cn(
                        "block w-full rounded-md border bg-[#232323] px-3 py-2.5 text-[13px] text-[#ededed] focus:outline-none focus:ring-1 transition-all",
                        errors.dataCheckout ? "border-rose-500/50 focus:ring-rose-500/20" : "border-[#2e2e2e] focus:border-[#3ecf8e]/40 focus:ring-[#3ecf8e]/40"
                      )}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-medium text-[#707070] uppercase tracking-wider mb-1">Quarto</label>
                    <select 
                      {...register("quartoId")}
                      className="block w-full rounded-md border border-[#2e2e2e] bg-[#232323] px-3 py-2.5 text-[13px] text-[#ededed] focus:border-[#3ecf8e]/40 focus:outline-none focus:ring-1 focus:ring-[#3ecf8e]/40 transition-all"
                    >
                      {quartos.length === 0 && <option value="">Carregando quartos...</option>}
                      {quartos.map(q => (
                        <option key={q.id} value={q.id}>Quarto {q.numero} ({q.tipo})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#707070] uppercase tracking-wider mb-1">Nº de Pessoas</label>
                    <input 
                      type="number" 
                      {...register("numeroPessoas", { valueAsNumber: true })}
                      className="block w-full rounded-md border border-[#2e2e2e] bg-[#232323] px-3 py-2.5 text-[13px] text-[#ededed] focus:border-[#3ecf8e]/40 focus:outline-none focus:ring-1 focus:ring-[#3ecf8e]/40 transition-all" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-medium text-[#707070] uppercase tracking-wider mb-1">Valor Total (R$)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      {...register("valorTotal", { valueAsNumber: true })}
                      className={cn(
                        "block w-full rounded-md border bg-[#232323] px-3 py-2.5 text-[13px] text-[#ededed] focus:outline-none focus:ring-1 transition-all",
                        errors.valorTotal ? "border-rose-500/50 focus:ring-rose-500/20" : "border-[#2e2e2e] focus:border-[#3ecf8e]/40 focus:ring-[#3ecf8e]/40"
                      )}
                      placeholder="Ex: 500.00" 
                    />
                  </div>
                  {!reserva && (
                    <div>
                      <label className="block text-[11px] font-medium text-[#707070] uppercase tracking-wider mb-1">Status Pgto</label>
                      <select 
                        {...register("pagamentoStatus")}
                        className="block w-full rounded-md border border-[#2e2e2e] bg-[#232323] px-3 py-2.5 text-[13px] text-[#ededed] focus:border-[#3ecf8e]/40 focus:outline-none focus:ring-1 focus:ring-[#3ecf8e]/40 transition-all"
                      >
                        <option value="Pendente">Pendente</option>
                        <option value="Pago">Pago (Total)</option>
                      </select>
                    </div>
                  )}
                </div>

                {!reserva && (
                  <div>
                    <label className="block text-[11px] font-medium text-[#707070] uppercase tracking-wider mb-1">Forma de Pagamento</label>
                    <select 
                      {...register("formaPagamento")}
                      className="block w-full rounded-md border border-[#2e2e2e] bg-[#232323] px-3 py-2.5 text-[13px] text-[#ededed] focus:border-[#3ecf8e]/40 focus:outline-none focus:ring-1 focus:ring-[#3ecf8e]/40 transition-all"
                    >
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="PIX">PIX</option>
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                      <option value="Cartão de Débito">Cartão de Débito</option>
                      <option value="Transferência">Transferência</option>
                    </select>
                  </div>
                )}
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
                  disabled={isSubmitting || quartos.length === 0}
                  className="rounded-md bg-[#3ecf8e] px-5 py-2.5 text-[13px] font-semibold text-[#111111] hover:bg-[#24b47e] disabled:opacity-50 transition-colors shadow-md shadow-[#3ecf8e]/15"
                >
                  {isSubmitting ? "Processando..." : (reserva ? "Salvar Alterações" : "Confirmar Reserva")}
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

