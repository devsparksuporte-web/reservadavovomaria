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
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0c10] flex items-center justify-center p-4 transition-colors duration-500">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-[#1a1d27] p-8 md:p-10 rounded-2xl border border-zinc-200 dark:border-[#2a2d3a] shadow-2xl dark:shadow-black/20 relative z-10 animate-fade-in-up">
        {/* Logo */}
        <div className="flex flex-col items-center">
          <div className="relative w-16 h-16 mb-5 flex items-center justify-center bg-zinc-100 dark:bg-[#151821] rounded-xl overflow-hidden border border-zinc-200 dark:border-[#2a2d3a]">
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
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Vovó Maria OS</h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500 text-center">
            Sistema de Gestão de Hospitalidade<br/>e Reservas.
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-5" onSubmit={handleLogin}>
          <div className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider ml-1">
                E-mail
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="block w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-[#151821] border border-zinc-200 dark:border-[#2a2d3a] rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-xs font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider ml-1">
                Senha
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="block w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-[#151821] border border-zinc-200 dark:border-[#2a2d3a] rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>{error === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20 group"
          >
            {isPending ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
        <div className="pt-4 flex items-center justify-between">
          <div className="h-px flex-1 bg-zinc-100 dark:bg-[#2a2d3a]" />
          <span className="px-4 text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Vovó Maria</span>
          <div className="h-px flex-1 bg-zinc-100 dark:bg-[#2a2d3a]" />
        </div>

        <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
          Problemas com o acesso? <a href="#" className="text-emerald-500 font-semibold hover:underline">Fale com o suporte.</a>
        </p>
      </div>
    </div>
  );
}
