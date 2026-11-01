'use client';

import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { AuthUser } from '../../types';
import { authenticateUser } from '../../lib/supabase';

interface LoginViewProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Por favor, informe seu e-mail.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Por favor, informe um e-mail válido.');
      return;
    }

    if (!password) {
      setErrorMessage('Por favor, informe sua senha de acesso.');
      return;
    }

    setIsLoading(true);

    try {
      const { user, error } = await authenticateUser(cleanEmail, password);
      if (error || !user) {
        setErrorMessage(error || 'E-mail ou senha incorretos. Verifique suas credenciais.');
      } else {
        onLoginSuccess(user);
      }
    } catch {
      setErrorMessage('Não foi possível conectar. Tente novamente em instantes.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm flex flex-col gap-5">
        {/* Marca e Topo */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-sm">
            iLoc
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Folgas iLoc
          </h1>
          <p className="text-xs text-slate-500">
            Acesse sua conta para visualizar e gerenciar escalas
          </p>
        </div>

        {/* Formulário de Login */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col gap-4">
          <div className="pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">
              Entrar
            </h2>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
            {/* Campo E-mail */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                E-mail
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu.email@empresa.com.br"
                  className="w-full h-11 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                Senha
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full h-11 pl-9 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Botão Entrar */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all mt-1 disabled:opacity-50"
            >
              <span>{isLoading ? 'Entrando...' : 'Entrar na Plataforma'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Rodapé Simples */}
        <div className="text-center">
          <p className="text-[11px] text-slate-400">
            Sistema seguro de escalas da equipe
          </p>
        </div>
      </div>
    </div>
  );
}