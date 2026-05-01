'use client';

import { useState, useTransition } from 'react';
import { login } from '@/app/actions/auth';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      
      const result = await login(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#3ecf8e]/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-[380px] w-full space-y-7 bg-[#1c1c1c] p-8 rounded-lg border border-[#2e2e2e] shadow-2xl shadow-black/50 relative z-10 animate-fade-in-up">
        {/* Logo */}
        <div className="flex flex-col items-center">
          <div className="relative w-12 h-12 mb-4 flex items-center justify-center bg-[#232323] rounded-lg overflow-hidden border border-[#2e2e2e]">
             <img 
                src="/logo.png" 
                alt="Pousada Vovó Maria" 
                className="max-w-[70%] max-h-[70%] object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Vovo+Maria';
                  (e.target as HTMLImageElement).style.opacity = '0.5';
                }}
             />
          </div>
          <h2 className="text-lg font-semibold text-[#ededed] tracking-tight">Vovó Maria OS</h2>
          <p className="mt-1.5 text-[13px] text-[#555555] text-center leading-relaxed">
            Sistema de Gestão de Hospitalidade<br/>e Reservas.
          </p>
        </div>

        {/* Form */}
        <form className="space-y-4" onSubmit={handleLogin}>
          <div className="space-y-3.5">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-[11px] font-medium text-[#707070] uppercase tracking-wider ml-0.5">
                E-mail
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-[#555555] group-focus-within:text-[#3ecf8e] transition-colors" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="block w-full pl-10 pr-4 py-2.5 bg-[#232323] border border-[#2e2e2e] rounded-md text-[#ededed] placeholder-[#555555] focus:outline-none focus:ring-1 focus:ring-[#3ecf8e]/40 focus:border-[#3ecf8e]/40 transition-all text-[13px]"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-[11px] font-medium text-[#707070] uppercase tracking-wider ml-0.5">
                Senha
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-[#555555] group-focus-within:text-[#3ecf8e] transition-colors" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="block w-full pl-10 pr-4 py-2.5 bg-[#232323] border border-[#2e2e2e] rounded-md text-[#ededed] placeholder-[#555555] focus:outline-none focus:ring-1 focus:ring-[#3ecf8e]/40 focus:border-[#3ecf8e]/40 transition-all text-[13px]"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-[13px] font-semibold text-[#111111] bg-[#3ecf8e] hover:bg-[#24b47e] focus:outline-none focus:ring-2 focus:ring-[#3ecf8e]/40 focus:ring-offset-2 focus:ring-offset-[#1c1c1c] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#3ecf8e]/15 group"
          >
            {isPending ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-[#111111]/30 border-t-[#111111] rounded-full animate-spin" />
                <span>Entrando...</span>
              </div>
            ) : (
              <>
                Entrar no Painel
                <LogIn className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="pt-3 flex items-center justify-between">
          <div className="h-px flex-1 bg-[#2e2e2e]" />
          <span className="px-3 text-[9px] uppercase tracking-widest text-[#555555] font-semibold">Vovó Maria</span>
          <div className="h-px flex-1 bg-[#2e2e2e]" />
        </div>

        <p className="text-center text-[11px] text-[#555555]">
          Problemas com o acesso? <a href="#" className="text-[#3ecf8e] font-medium hover:underline">Fale com o suporte.</a>
        </p>
      </div>
    </div>
  );
}
