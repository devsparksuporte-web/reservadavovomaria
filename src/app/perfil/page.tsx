'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { UserCircle, PenSquare, Plus, Mail, Phone, FileText, BedDouble, Wallet, Star, Tag, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        setFullName(session.user.user_metadata?.full_name || '');
        setEmail(session.user.email || '');
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        email: email,
        password: password || undefined,
        data: { full_name: fullName }
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      setPassword(''); // Limpa a senha após atualizar
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 animate-fade-in-up">
      {/* Top Profile Header */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-2xl bg-[#151821] border border-[#2a2d3a] overflow-hidden flex items-center justify-center">
             <UserCircle className="w-16 h-16 text-zinc-600" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-emerald-400 text-[#0f1117] p-1.5 rounded-lg border border-[#0a0c10]">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-emerald-400 tracking-[0.2em] uppercase">Guest Profile</span>
          <h2 className="text-xl font-bold text-white">{fullName || 'Administrador'}</h2>
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs mt-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            São Paulo, Brasil
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button className="flex items-center justify-center gap-2 bg-transparent border border-purple-400/30 text-purple-200 hover:bg-purple-400/10 py-3.5 rounded-xl text-xs font-bold transition-colors">
          <PenSquare className="w-4 h-4 text-purple-400" />
          Editar Cadastro
        </button>
        <button className="flex items-center justify-center gap-2 bg-emerald-400 hover:bg-emerald-500 text-[#0f1117] py-3.5 rounded-xl text-xs font-bold transition-colors">
          <Plus className="w-4 h-4" />
          Nova Reserva
        </button>
      </div>

      {/* Contact Info Card */}
      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#0a0c10] p-2 rounded-lg text-emerald-400">
            <FileText className="w-4 h-4" />
          </div>
          <h3 className="text-white font-bold text-sm">Informações de Contato</h3>
        </div>

        <div>
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Email</p>
          <p className="text-zinc-300 text-sm">{email || 'nao.informado@email.com'}</p>
        </div>
        <div>
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Telefone</p>
          <p className="text-zinc-300 text-sm">+55 11 98877-6655</p>
        </div>
        <div>
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Documento (CPF)</p>
          <p className="text-zinc-300 text-sm">123.456.789-00</p>
        </div>
      </div>

      {/* 4 Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-4">
          <BedDouble className="w-5 h-5 text-emerald-400 mb-3" />
          <p className="text-emerald-400 font-bold text-lg leading-none">12</p>
          <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest mt-1">Diárias Totais</p>
        </div>
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-4">
          <Wallet className="w-5 h-5 text-purple-400 mb-3" />
          <p className="text-white font-bold text-lg leading-none">R$ 4.2k</p>
          <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest mt-1">Total Gasto</p>
        </div>
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-4">
          <Star className="w-5 h-5 text-rose-400 mb-3" />
          <p className="text-rose-400 font-bold text-lg leading-none">4.8</p>
          <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest mt-1">Avaliação Média</p>
        </div>
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-4">
          <Tag className="w-5 h-5 text-emerald-400 mb-3" />
          <p className="text-emerald-400 font-bold text-lg leading-none">VIP</p>
          <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest mt-1">Categoria</p>
        </div>
      </div>

      {/* Reservation History */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-white">Histórico de Reservas</h3>
          <button className="text-xs text-emerald-400 font-medium">Ver Todas</button>
        </div>

        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider border-b border-[#2a2d3a]">
              <tr>
                <th className="px-4 py-3 font-medium">Quarto</th>
                <th className="px-4 py-3 font-medium">Check-in</th>
                <th className="px-4 py-3 font-medium">Check-out</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2d3a]">
              <tr>
                <td className="px-4 py-4 flex items-center gap-3">
                  <div className="bg-emerald-400/10 text-emerald-400 px-2 py-1 rounded font-bold">102</div>
                  <div className="flex flex-col">
                    <span className="text-white font-medium">Suíte</span>
                    <span className="text-zinc-400 text-[10px]">Master</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-zinc-300">
                  <div className="flex flex-col">
                    <span>12 Out</span>
                    <span className="text-zinc-500 text-[10px]">2023</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-zinc-300">
                  <div className="flex flex-col">
                    <span>15 Out</span>
                    <span className="text-zinc-500 text-[10px]">2023</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-4 flex items-center gap-3">
                  <div className="bg-purple-400/10 text-purple-400 px-2 py-1 rounded font-bold">204</div>
                  <div className="flex flex-col">
                    <span className="text-white font-medium">Quarto</span>
                    <span className="text-zinc-400 text-[10px]">Standard</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-zinc-300">
                  <div className="flex flex-col">
                    <span>22 Ago</span>
                    <span className="text-zinc-500 text-[10px]">2023</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-zinc-300">
                  <div className="flex flex-col">
                    <span>25 Ago</span>
                    <span className="text-zinc-500 text-[10px]">2023</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-4 flex items-center gap-3">
                  <div className="bg-rose-400/10 text-rose-400 px-2 py-1 rounded font-bold">105</div>
                  <div className="flex flex-col">
                    <span className="text-white font-medium">Suíte</span>
                    <span className="text-zinc-400 text-[10px]">Garden</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-zinc-300">
                  <div className="flex flex-col">
                    <span>05 Jun</span>
                    <span className="text-zinc-500 text-[10px]">2023</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-zinc-300">
                  <div className="flex flex-col">
                    <span>10 Jun</span>
                    <span className="text-zinc-500 text-[10px]">2023</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes Card */}
      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-5 mt-4">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#0a0c10] p-2 rounded-lg text-purple-400">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="text-white font-bold text-sm leading-tight">Observações de<br/>Atendimento</h3>
          </div>
          <button className="text-purple-400 text-xs font-medium hover:text-purple-300">+ Adicionar Nota</button>
        </div>

        <div className="space-y-4">
          <div className="bg-[#0a0c10] rounded-xl p-4 border border-[#2a2d3a]">
            <span className="text-[10px] text-zinc-500 tracking-wider font-bold">15 OUT 2023</span>
            <p className="text-zinc-300 text-xs italic mt-2">"Hóspede prefere travesseiros extras e água com gás no frigobar. Excelente trato com a equipe."</p>
          </div>
          <div className="bg-[#0a0c10] rounded-xl p-4 border border-[#2a2d3a]">
            <span className="text-[10px] text-zinc-500 tracking-wider font-bold">25 AGO 2023</span>
            <p className="text-zinc-300 text-xs italic mt-2">"Solicitou checkout tardio. Foi concedido cortesia devido à recorrência."</p>
          </div>
        </div>
      </div>
    </div>
  );
}
