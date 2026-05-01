'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { UserCircle, PenSquare, Plus, Mail, Phone, FileText, BedDouble, Wallet, Star, Tag, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

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
          <span className="text-[10px] font-bold text-emerald-400 tracking-[0.2em] uppercase">Perfil do Usuário</span>
          <h2 className="text-xl font-bold text-white">{fullName || 'Administrador'}</h2>
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs mt-1">
            <Mail className="w-3 h-3 text-emerald-500" />
            {email}
          </div>
        </div>
      </div>

      {message && (
        <div className={cn(
          "p-4 rounded-xl text-sm font-medium border",
          message.type === 'success' 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
            : "bg-rose-500/10 border-rose-500/20 text-rose-400"
        )}>
          {message.text}
        </div>
      )}

      {/* Profile Form */}
      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#0a0c10] p-2 rounded-lg text-emerald-400">
            <PenSquare className="w-4 h-4" />
          </div>
          <h3 className="text-white font-bold text-sm">Editar Cadastro</h3>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1.5">Nome Completo</label>
            <input 
              type="text" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-[#0a0c10] border border-[#2a2d3a] rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 outline-none transition-all"
              placeholder="Seu nome"
            />
          </div>

          <div>
            <label className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1.5">Email de Acesso</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0a0c10] border border-[#2a2d3a] rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 outline-none transition-all"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1.5">Nova Senha (opcional)</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0a0c10] border border-[#2a2d3a] rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 outline-none transition-all"
              placeholder="••••••••"
            />
            <p className="text-[10px] text-zinc-600 mt-1.5 ml-1 italic">Deixe em branco para manter a senha atual.</p>
          </div>

          <div className="pt-2">
            <button 
              type="submit"
              disabled={saving}
              className="w-full bg-emerald-400 hover:bg-emerald-500 disabled:opacity-50 text-[#0f1117] py-3.5 rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
            >
              {saving ? 'SALVANDO ALTERAÇÕES...' : 'ATUALIZAR PERFIL'}
            </button>
          </div>
        </form>
      </div>

      {/* Admin Info Card */}
      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#0a0c10] p-2 rounded-lg text-purple-400">
            <FileText className="w-4 h-4" />
          </div>
          <h3 className="text-white font-bold text-sm">Informações do Sistema</h3>
        </div>

        <div>
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">ID do Usuário</p>
          <p className="text-zinc-400 text-[10px] font-mono truncate">{user?.id}</p>
        </div>
        <div>
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Nível de Acesso</p>
          <div className="flex items-center gap-2">
            <span className="bg-purple-500/10 text-purple-400 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Administrador Full</span>
          </div>
        </div>
        <div>
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Último Acesso</p>
          <p className="text-zinc-300 text-sm">
            {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('pt-BR') : 'Não disponível'}
          </p>
        </div>
      </div>
    </div>
  );
}
