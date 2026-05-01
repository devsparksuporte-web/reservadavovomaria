"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { X, Printer, CheckCircle2, Pencil, Plus, MessageCircle } from "lucide-react"

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
  const [error, setError] = useState<string | null>(null)
  const [createdReserva, setCreatedReserva] = useState<any>(null)
  const [quartos, setQuartos] = useState<any[]>([])

  // Form states
  const [nomeHospede, setNomeHospede] = useState("")
  const [telefone, setTelefone] = useState("")
  const [cpf, setCpf] = useState("")
  const [dataCheckin, setDataCheckin] = useState("")
  const [dataCheckout, setDataCheckout] = useState("")
  const [quartoId, setQuartoId] = useState("")
  const [numeroPessoas, setNumeroPessoas] = useState(1)
  const [valorTotal, setValorTotal] = useState("")
  const [formaPagamento, setFormaPagamento] = useState("Dinheiro")
  const [pagamentoStatus, setPagamentoStatus] = useState("Pendente")

  useEffect(() => {
    if (isOpen) {
      setError(null)
      carregarQuartos()
      if (reserva) {
        setNomeHospede(reserva.hospedes?.nome || "")
        setTelefone(reserva.hospedes?.telefone || "")
        setCpf(reserva.hospedes?.cpf || "")
        setDataCheckin(reserva.data_checkin)
        setDataCheckout(reserva.data_checkout)
        setQuartoId(reserva.quarto_id || "")
        setNumeroPessoas(reserva.numero_pessoas)
        setValorTotal(reserva.valor_total?.toString())
      } else if (initialData) {
        if (initialData.data_checkin) setDataCheckin(initialData.data_checkin)
        if (initialData.quarto_id) setQuartoId(initialData.quarto_id)
      }
    }
  }, [isOpen, reserva, initialData])

  const carregarQuartos = async () => {
    const { data } = await supabase.from('quartos').select('*').order('numero')
    if (data) {
      setQuartos(data)
      if (data.length > 0 && !quartoId && !reserva) {
        setQuartoId(data[0].id)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // 0. Verificar conflitos de datas (Overbooking)
      let conflictQuery = supabase
        .from('reservas')
        .select('id')
        .eq('quarto_id', quartoId)
        .in('status', ['Reservado', 'Confirmado', 'Checked-in'])
        .or(`and(data_checkin.lt.${dataCheckout},data_checkout.gt.${dataCheckin})`)

      if (reserva) {
        conflictQuery = conflictQuery.neq('id', reserva.id)
      }

      const { data: conflitos, error: conflitosError } = await conflictQuery
      
      if (conflitosError) throw conflitosError
      if (conflitos && conflitos.length > 0) {
        setError("Atenção: Este quarto já possui uma reserva ativa que entra em conflito com este período.")
        setIsSubmitting(false)
        return
      }

      // 1. Criar ou buscar hóspede
      let hospedeId = reserva?.hospede_id || null
      
      if (!reserva) {
        let existingHospedes = null;
        
        if (cpf) {
          const { data } = await supabase.from('hospedes').select('id').eq('cpf', cpf).limit(1)
          existingHospedes = data
        } else if (telefone) {
          const { data } = await supabase.from('hospedes').select('id').eq('telefone', telefone).limit(1)
          existingHospedes = data
        } else {
          const { data } = await supabase.from('hospedes').select('id').eq('nome', nomeHospede).limit(1)
          existingHospedes = data
        }

        if (existingHospedes && existingHospedes.length > 0) {
          hospedeId = existingHospedes[0].id
          await supabase.from('hospedes').update({ nome: nomeHospede, telefone, cpf: cpf || null }).eq('id', hospedeId)
        } else {
          const { data: newHospede, error: hospedeError } = await supabase
            .from('hospedes')
            .insert([{ nome: nomeHospede, telefone, cpf: cpf || null }])
            .select()
          
          if (hospedeError) throw hospedeError
          hospedeId = newHospede[0].id
        }
      } else {
        // Atualizar hóspede se necessário
        await supabase.from('hospedes').update({ telefone, cpf: cpf || null }).eq('id', hospedeId)
      }

      const payload: any = {
        hospede_id: hospedeId,
        quarto_id: quartoId, // Agora salvo diretamente na reserva
        data_checkin: dataCheckin,
        data_checkout: dataCheckout,
        numero_pessoas: Number(numeroPessoas),
        valor_total: parseFloat(valorTotal),
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
          valor: parseFloat(valorTotal),
          forma_pagamento: formaPagamento,
          status: pagamentoStatus,
          data_pagamento: pagamentoStatus === 'Pago' ? new Date().toISOString() : new Date().toISOString()
        }])
      }

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
      setError("Erro ao processar reserva: " + err.message)
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

    // Se um número específico foi passado, usa ele. Caso contrário, tenta o do hóspede.
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
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
        <div id="receipt-print-area" className="w-full max-w-md flex flex-col rounded-2xl bg-white dark:bg-[#1a1d27] shadow-2xl max-h-[95vh] overflow-hidden border border-zinc-200 dark:border-[#2a2d3a] print:rounded-none">
          <div className="bg-emerald-600 shrink-0 p-6 text-center text-white print:bg-transparent print:text-black print:border-b print-border-black print:p-2">
            <CheckCircle2 className="mx-auto h-12 w-12 mb-2 print:hidden" />
            <h3 className="text-xl font-bold print-black print:text-lg">Reserva Confirmada!</h3>
            <p className="text-emerald-100 print-black print:text-xs">Comprovante de Hospedagem</p>
          </div>
          
          <div className="flex-1 overflow-y-auto min-h-0 p-8 space-y-6 print:p-2 print:space-y-4 bg-white dark:bg-zinc-900 print-no-bg">
            <div className="flex justify-between items-start border-b border-dashed border-gray-200 dark:border-zinc-800 print-border-black pb-4 print:pb-2">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider print-black">Código da Reserva</p>
                <p className="text-lg font-mono font-bold text-zinc-900 dark:text-white print-black print:text-sm">
                  {createdReserva.codigo || '#' + createdReserva.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider print-black">Quarto</p>
                <p className="text-lg font-bold text-emerald-500 print-black print:text-sm">
                   {createdReserva.quartos?.numero || reserva?.quartos?.numero || 'N/A'}
                </p>
                <p className="text-[10px] text-zinc-500 uppercase print-black">
                  {createdReserva.quartos?.tipo || reserva?.quartos?.tipo || ''}
                </p>
              </div>
            </div>

            <div className="space-y-4 print:space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500 print-black print:text-xs">Hóspede:</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-white print-black print:text-xs">{createdReserva.hospedes?.nome || reserva?.hospedes?.nome}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 print:gap-2">
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase tracking-wider print-black">Check-in:</span>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-white print-black print:text-xs">{new Date(createdReserva.data_checkin).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 block uppercase tracking-wider print-black">Check-out:</span>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-white print-black print:text-xs">{new Date(createdReserva.data_checkout).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
              <div className="flex justify-between border-t border-zinc-100 dark:border-[#2a2d3a] print-border-black pt-3 print:pt-2">
                <span className="text-base font-bold text-zinc-900 dark:text-white print-black print:text-sm">Total:</span>
                <span className="text-base font-bold text-emerald-500 print-black print:text-sm">R$ {createdReserva.valor_total?.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-zinc-50 dark:bg-[#151821] print-no-bg p-3 print:p-0 rounded-xl print:rounded-none text-[10px] text-zinc-500 print-black leading-tight border border-zinc-100 dark:border-[#2a2d3a] print:border-none print:mt-4 print:text-center">
              <p>Confirmação oficial de reserva na Pousada Vovó Maria. Apresente este código no check-in.</p>
            </div>
          </div>

          <div className="p-4 bg-zinc-50 dark:bg-[#151821] flex gap-2 border-t border-zinc-100 dark:border-[#2a2d3a] print:hidden">
            <button onClick={handlePrint} className="flex-1 inline-flex justify-center items-center rounded-xl bg-white dark:bg-[#1a1d27] border border-zinc-200 dark:border-[#2a2d3a] px-3 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#252836] transition-all">
              <Printer className="mr-2 h-4 w-4" /> Imprimir
            </button>
            <button onClick={() => handleWhatsApp()} className="flex-1 inline-flex justify-center items-center rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-2.5 text-xs font-semibold text-white transition-all" title="Enviar para o Hóspede">
              <MessageCircle className="mr-1.5 h-3.5 w-3.5" /> Hóspede
            </button>
            <button onClick={() => handleWhatsApp('5522997633952')} className="flex-1 inline-flex justify-center items-center rounded-xl bg-emerald-700 hover:bg-emerald-800 px-3 py-2.5 text-xs font-semibold text-white transition-all" title="Enviar para Vovó Maria">
              <MessageCircle className="mr-1.5 h-3.5 w-3.5" /> Vovó Maria
            </button>
            <button onClick={() => { setShowReceipt(false); setIsOpen(false); router.refresh(); }} className="flex-1 inline-flex justify-center items-center rounded-xl bg-zinc-800 hover:bg-zinc-700 px-3 py-2.5 text-xs font-semibold text-white transition-all">
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
                className="text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors p-1"
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
                ? "text-zinc-500 hover:text-emerald-400 transition-colors p-1"
                : "inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-colors"
              }
              title={reserva ? "Editar Reserva" : "Nova Reserva"}
            >
              {reserva ? <Pencil className="h-4 w-4" /> : <><Plus className="mr-2 h-4 w-4" /> Nova Reserva</>}
            </button>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-hidden">
          <div className="w-full max-w-lg flex flex-col rounded-2xl bg-white dark:bg-[#1a1d27] shadow-2xl max-h-[95vh] border border-zinc-200 dark:border-[#2a2d3a]">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-[#2a2d3a] p-5 shrink-0 rounded-t-2xl">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                {reserva ? "Editar Reserva" : "Nova Reserva"}
              </h3>
              <button type="button" onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-zinc-300 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar min-h-0">
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium animate-shake">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="space-y-4 border-b border-zinc-100 dark:border-[#2a2d3a] pb-4">
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">Dados do Hóspede</h4>
                <div>
                  <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-wider text-xs font-semibold">Nome Completo</label>
                  <input required type="text" value={nomeHospede} onChange={(e) => setNomeHospede(e.target.value)}
                    disabled={!!reserva}
                    className="mt-1 block w-full rounded-md border border-zinc-200 dark:border-[#2a2d3a] bg-zinc-50 dark:bg-[#151821] px-3 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
                    placeholder="Nome do hóspede" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-wider text-xs font-semibold">Telefone</label>
                    <input type="text" value={telefone} onChange={(e) => setTelefone(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-zinc-200 dark:border-[#2a2d3a] bg-zinc-50 dark:bg-[#151821] px-3 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="(11) 99999-9999" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-wider text-xs font-semibold">CPF</label>
                    <input type="text" value={cpf} onChange={(e) => setCpf(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-zinc-200 dark:border-[#2a2d3a] bg-zinc-50 dark:bg-[#151821] px-3 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="000.000.000-00" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">Detalhes da Estadia</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-wider text-xs font-semibold">Check-in</label>
                    <input required type="date" value={dataCheckin} onChange={(e) => setDataCheckin(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-zinc-200 dark:border-[#2a2d3a] bg-zinc-50 dark:bg-[#151821] px-3 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-wider text-xs font-semibold">Check-out</label>
                    <input required type="date" value={dataCheckout} onChange={(e) => setDataCheckout(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-zinc-200 dark:border-[#2a2d3a] bg-zinc-50 dark:bg-[#151821] px-3 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-wider text-xs font-semibold">Quarto</label>
                    <select required value={quartoId} onChange={(e) => setQuartoId(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-zinc-200 dark:border-[#2a2d3a] bg-zinc-50 dark:bg-[#151821] px-3 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      {quartos.length === 0 && <option value="">Carregando quartos...</option>}
                      {quartos.map(q => (
                        <option key={q.id} value={q.id}>Quarto {q.numero} ({q.tipo})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-wider text-xs font-semibold">Nº de Pessoas</label>
                    <input required type="number" min="1" value={numeroPessoas} onChange={(e) => setNumeroPessoas(Number(e.target.value))}
                      className="mt-1 block w-full rounded-md border border-zinc-200 dark:border-[#2a2d3a] bg-zinc-50 dark:bg-[#151821] px-3 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-wider text-xs font-semibold">Valor Total (R$)</label>
                    <input required type="number" step="0.01" min="0" value={valorTotal} onChange={(e) => setValorTotal(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-zinc-200 dark:border-[#2a2d3a] bg-zinc-50 dark:bg-[#151821] px-3 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="Ex: 500.00" />
                  </div>
                  {!reserva && (
                    <div>
                      <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-wider text-xs font-semibold">Status Pgto</label>
                      <select value={pagamentoStatus} onChange={(e) => setPagamentoStatus(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-zinc-200 dark:border-[#2a2d3a] bg-zinc-50 dark:bg-[#151821] px-3 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      >
                        <option value="Pendente">Pendente</option>
                        <option value="Pago">Pago (Total)</option>
                      </select>
                    </div>
                  )}
                </div>

                {!reserva && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-wider text-xs font-semibold">Forma de Pagamento</label>
                    <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-zinc-200 dark:border-[#2a2d3a] bg-zinc-50 dark:bg-[#151821] px-3 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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

              <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-zinc-100 dark:border-[#2a2d3a]">
                <button type="button" onClick={() => setIsOpen(false)}
                  className="rounded-xl border border-zinc-200 dark:border-[#2a2d3a] bg-white dark:bg-[#151821] px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#252836] transition-colors"
                >
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting || quartos.length === 0}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-600/20"
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
