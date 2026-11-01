'use client';

import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  Camera,
  Trash2,
  Lock,
  Mail,
  User,
  Check,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { AuthUser, Employee } from '../../types';

interface PerfilViewProps {
  currentUser: AuthUser;
  employeeData?: Employee;
  onBack: () => void;
  onSaveProfile: (data: {
    name: string;
    email: string;
    avatarUrl?: string;
    newPassword?: string;
  }) => Promise<{ error: string | null }>;
}

export function PerfilView({
  currentUser,
  employeeData,
  onBack,
  onSaveProfile,
}: PerfilViewProps) {
  // Separa o nome em Nome e Sobrenome
  const nameParts = (currentUser.name || '').trim().split(/\s+/);
  const defaultFirstName = nameParts[0] || '';
  const defaultLastName = nameParts.slice(1).join(' ') || '';

  const [firstName, setFirstName] = useState(defaultFirstName);
  const [lastName, setLastName] = useState(defaultLastName);
  const [email, setEmail] = useState(currentUser.email || '');
  const [avatarPreview, setAvatarPreview] = useState<string>(
    currentUser.avatarUrl || employeeData?.avatarUrl || ''
  );
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Manipulador de upload de foto pelo dispositivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor, selecione um arquivo de imagem válido (JPG, PNG ou WEBP).');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setErrorMessage('A imagem deve ter no máximo 3MB.');
      return;
    }

    setErrorMessage('');
    const reader = new FileReader();
    reader.onload = event => {
      if (event.target?.result) {
        setAvatarPreview(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatarPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();

    if (!cleanFirst) {
      setErrorMessage('O campo Nome é obrigatório.');
      return;
    }

    if (!cleanLast) {
      setErrorMessage('O campo Sobrenome é obrigatório.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setErrorMessage('Por favor, informe um endereço de e-mail institucional válido.');
      return;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        setErrorMessage('A nova senha deve ter no mínimo 6 caracteres.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage('A confirmação da nova senha não confere.');
        return;
      }
    }

    setIsSaving(true);

    try {
      const fullName = `${cleanFirst} ${cleanLast}`;
      const { error } = await onSaveProfile({
        name: fullName,
        email: cleanEmail,
        avatarUrl: avatarPreview,
        newPassword: newPassword || undefined,
      });

      if (error) {
        setErrorMessage(error);
      } else {
        onBack();
      }
    } catch {
      setErrorMessage('Ocorreu um erro ao salvar as alterações do perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  // Iniciais para o avatar padrao
  const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || 'IL';

  return (
    <div className="flex flex-col gap-5 pb-8 animate-in fade-in duration-200 max-w-2xl mx-auto w-full">
      {/* Barra de Navegacao Superior com Botao Voltar */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 text-xs font-bold text-slate-700 transition-all shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
          <span>Voltar</span>
        </button>

        <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
          Meu Perfil
        </span>
      </div>

      {/* Titulo da Subpagina */}
      <div className="flex flex-col">
        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          Editar Perfil
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Atualize suas informações pessoais, foto de perfil e credenciais de acesso
        </p>
      </div>

      {/* Alerta de Erro */}
      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* SECAO: FOTO DE PERFIL */}
        <section className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col items-center gap-4 text-center">
          <div className="relative">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Prévia da foto de perfil"
                className="w-24 h-24 rounded-full object-cover shadow-sm border-2 border-white ring-4 ring-blue-100"
              />
            ) : (
              <div
                className={`w-24 h-24 rounded-full ${
                  employeeData?.colorBg || 'bg-blue-600'
                } text-white flex items-center justify-center text-2xl font-black shadow-sm border-2 border-white ring-4 ring-blue-100`}
              >
                {initials}
              </div>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Alterar foto de perfil"
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white flex items-center justify-center shadow-md border-2 border-white transition-all"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 active:scale-95 text-xs font-bold text-slate-800 transition-all shadow-2xs"
              >
                Alterar foto
              </button>

              {avatarPreview && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 active:scale-95 text-xs font-bold text-red-700 flex items-center gap-1 transition-all shadow-2xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remover</span>
                </button>
              )}
            </div>

            <span className="text-[11px] text-slate-400">
              Formatos aceitos: JPG, PNG ou WEBP (máx. 3MB)
            </span>
          </div>
        </section>

        {/* SECAO: INFORMACOES PESSOAIS */}
        <section className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col gap-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <User className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Informações Pessoais
            </h2>
          </div>

          {/* Nome e Sobrenome lado a lado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                Nome
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="Seu primeiro nome"
                className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                Sobrenome
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Seu sobrenome"
                className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* E-mail */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">
              E-mail institucional
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="exemplo@ilocmobile.com.br"
                className="w-full h-11 pl-10 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <span className="text-[10px] text-slate-400">
              Utilizado para login individual e notificações da escala
            </span>
          </div>
        </section>

        {/* SECAO: ALTERACAO DE SENHA */}
        <section className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col gap-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Lock className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Credenciais de Acesso
            </h2>
          </div>

          <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/60 text-blue-900 text-xs flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <span className="leading-snug">
              Deixe os campos abaixo em branco caso deseje manter sua senha atual inalterada.
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">
              Nova Senha
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full h-11 pl-10 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {newPassword && (
            <div className="flex flex-col gap-1.5 animate-in fade-in duration-150">
              <label className="text-xs font-bold text-slate-700">
                Confirmar Nova Senha
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full h-11 pl-10 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          )}
        </section>

        {/* BOTOES DE ACAO */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            disabled={isSaving}
            className="flex-1 h-12 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition-all active:scale-[0.99] disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <span>Salvando...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Salvar Alterações</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
