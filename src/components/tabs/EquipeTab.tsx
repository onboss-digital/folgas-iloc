'use client';

import React, { useState } from 'react';
import {
  Search,
  UserPlus,
  Edit2,
  UserX,
  UserCheck,
  ChevronDown,
  Calendar,
  X,
  Check,
} from 'lucide-react';
import { Employee, ShiftStatus, DayInfo } from '../../types';

interface EquipeTabProps {
  employees: Employee[];
  shifts: Record<string, ShiftStatus[]>;
  days: DayInfo[];
  onAddEmployee: (employee: Omit<Employee, 'id'>) => void;
  onUpdateEmployee: (employee: Employee) => void;
  onToggleEmployeeStatus: (id: string) => void;
}

export function EquipeTab({
  employees,
  shifts,
  days,
  onAddEmployee,
  onUpdateEmployee,
  onToggleEmployeeStatus,
}: EquipeTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'working' | 'off'>('all');
  const [expandedSchedules, setExpandedSchedules] = useState<Record<string, boolean>>({});

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [admissionDate, setAdmissionDate] = useState('2024-01-01');
  const [notes, setNotes] = useState('');

  const todayIndex = days.findIndex(d => d.isToday) !== -1 ? days.findIndex(d => d.isToday) : 3;

  const toggleExpand = (id: string) => {
    setExpandedSchedules(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setName('');
    setRole('');
    setAdmissionDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setName(emp.name);
    setRole(emp.role);
    setAdmissionDate(emp.admissionDate);
    setNotes(emp.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) return;

    if (editingEmployee) {
      onUpdateEmployee({
        ...editingEmployee,
        name: name.trim(),
        role: role.trim(),
        admissionDate,
        notes: notes.trim(),
      });
    } else {
      const initials = name
        .trim()
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

      const colors = ['bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-amber-600', 'bg-indigo-600'];
      const colorBg = colors[employees.length % colors.length];

      onAddEmployee({
        name: name.trim(),
        role: role.trim(),
        status: 'active',
        initials,
        colorBg,
        admissionDate,
        preferredDaysOff: [5, 6],
        notes: notes.trim(),
      });
    }

    setIsModalOpen(false);
  };

  // Filtragem
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchTerm.toLowerCase());

    const empShifts = shifts[emp.id] || Array(7).fill('T');
    const isWorkingToday = empShifts[todayIndex] === 'T';

    let matchesFilter = true;
    if (filter === 'working') matchesFilter = isWorkingToday && emp.status === 'active';
    if (filter === 'off') matchesFilter = !isWorkingToday || emp.status === 'inactive';

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Header e Botão Adicionar */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Equipe e Colaboradores
          </h1>
          <p className="text-xs text-slate-500">
            {employees.filter(e => e.status === 'active').length} colaboradores ativos
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="h-10 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Adicionar</span>
        </button>
      </div>

      {/* Busca e Filtros */}
      <div className="flex flex-col gap-2">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou cargo..."
            className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filter === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Todos ({employees.length})
          </button>
          <button
            onClick={() => setFilter('working')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filter === 'working'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Trabalhando Hoje
          </button>
          <button
            onClick={() => setFilter('off')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filter === 'off'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            De Folga Hoje
          </button>
        </div>
      </div>

      {/* Lista de Colaboradores */}
      <div className="flex flex-col gap-3">
        {filteredEmployees.map(emp => {
          const empShifts = shifts[emp.id] || Array(7).fill('T');
          const isWorkingToday = empShifts[todayIndex] === 'T';
          const isExpanded = !!expandedSchedules[emp.id];

          return (
            <div
              key={emp.id}
              className={`p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col gap-3 transition-all ${
                emp.status === 'inactive' ? 'opacity-60 bg-slate-50' : ''
              }`}
            >
              {/* Linha Principal do Card */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-full ${emp.colorBg} text-white flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-xs`}
                  >
                    {emp.initials}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {emp.name}
                      </span>
                      {emp.status === 'inactive' && (
                        <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 text-[10px] font-bold">
                          Inativo
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 truncate">
                      {emp.role}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {emp.status === 'active' && (
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        isWorkingToday
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {isWorkingToday ? 'Trabalhando' : 'De Folga'}
                    </span>
                  )}

                  <button
                    onClick={() => handleOpenEdit(emp)}
                    title="Editar colaborador"
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center active:scale-95 transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onToggleEmployeeStatus(emp.id)}
                    title={emp.status === 'active' ? 'Inativar' : 'Reativar'}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center active:scale-95 transition-all ${
                      emp.status === 'active'
                        ? 'bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {emp.status === 'active' ? (
                      <UserX className="w-3.5 h-3.5" />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Botão para Expandir Escala Semanal */}
              <button
                onClick={() => toggleExpand(emp.id)}
                className="w-full py-1.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isExpanded ? 'Ocultar escala semanal' : 'Ver escala semanal'}</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Minigrade Semanal Retrátil */}
              {isExpanded && (
                <div className="pt-1 flex flex-col gap-1.5 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Ciclo Semanal 5x2
                  </span>
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {days.map((day, idx) => {
                      const st = empShifts[idx] || 'T';
                      const isWork = st === 'T';
                      return (
                        <div
                          key={idx}
                          className={`flex flex-col items-center py-1.5 px-0.5 rounded-lg text-center ${
                            isWork
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                              : 'bg-red-50 text-red-800 border border-red-100'
                          }`}
                        >
                          <span className="text-[9px] font-semibold text-slate-500">
                            {day.name}
                          </span>
                          <span className="text-[11px] font-extrabold mt-0.5">
                            {st}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredEmployees.length === 0 && (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center flex flex-col items-center gap-2">
            <span className="text-xs font-bold text-slate-800">
              Nenhum colaborador encontrado
            </span>
            <p className="text-xs text-slate-500">
              Ajuste o termo de pesquisa ou selecione outro filtro.
            </p>
          </div>
        )}
      </div>

      {/* Modal / Diálogo de Cadastro / Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">
                {editingEmployee ? 'Editar Colaborador' : 'Novo Colaborador'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Carlos Eduardo Mendes"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">
                  Cargo / Função
                </label>
                <input
                  type="text"
                  required
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  placeholder="Ex: Operador de Loja"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">
                  Data de Admissão
                </label>
                <input
                  type="date"
                  value={admissionDate}
                  onChange={e => setAdmissionDate(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">
                  Observações de Disponibilidade (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Ex: Preferência por folgas aos finais de semana"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
