
import React, { useState, useEffect } from 'react';
import type { Team, Participant, TeamConfigType } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { XIcon } from './icons/XIcon';

interface TeamModalProps {
  team: Team | null;
  onSave: (team: Team) => void;
  onClose: () => void;
}

const emptyParticipant = (): Participant => ({
  id: crypto.randomUUID(),
  name: '',
  projectsCount: 1,
});

export const TeamModal: React.FC<TeamModalProps> = ({ team, onSave, onClose }) => {
  const [name, setName] = useState('');
  const [configType, setConfigType] = useState<TeamConfigType>('participants');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [totalProjects, setTotalProjects] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (team) {
      setName(team.name);
      setConfigType(team.configType || 'participants');
      setParticipants(team.participants || [emptyParticipant()]);
      setTotalProjects(team.totalProjects || 1);
    } else {
      setName('');
      setConfigType('participants');
      setParticipants([emptyParticipant()]);
      setTotalProjects(1);
    }
  }, [team]);
  
  const handleParticipantChange = (index: number, field: 'name' | 'projectsCount', value: string | number) => {
    const newParticipants = [...participants];
    if (field === 'projectsCount' && typeof value === 'string') {
        newParticipants[index][field] = parseInt(value, 10);
    } else {
        newParticipants[index][field] = value as never;
    }
    setParticipants(newParticipants);
  };

  const addParticipant = () => {
    setParticipants([...participants, emptyParticipant()]);
  };

  const removeParticipant = (index: number) => {
    if (participants.length > 1) {
        setParticipants(participants.filter((_, i) => i !== index));
    }
  };

  const handleSave = () => {
    setError(null);
    if (!name.trim()) {
        setError("O nome da equipe é obrigatório.");
        return;
    }

    if (configType === 'participants' && participants.some(p => !p.name.trim() || isNaN(p.projectsCount) || p.projectsCount <= 0)) {
        setError("Todos os participantes devem ter um nome e pelo menos um projeto.");
        return;
    }

    if (configType === 'projectsOnly' && (isNaN(totalProjects) || totalProjects <= 0)) {
        setError("A quantidade total de projetos deve ser de pelo menos 1.");
        return;
    }

    onSave({
      id: team?.id || crypto.randomUUID(),
      name,
      configType,
      participants: configType === 'participants' ? participants : [],
      totalProjects: configType === 'projectsOnly' ? totalProjects : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-5 border-b">
            <h2 className="text-lg font-bold text-gray-800">{team ? 'Editar Equipe' : 'Adicionar Nova Equipe'}</h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                <XIcon className="w-6 h-6" />
            </button>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto">
            <div>
                <label htmlFor="teamName" className="block text-xs font-medium text-gray-700">Nome da Equipe</label>
                <input
                    type="text"
                    id="teamName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                    placeholder="Ex: Equipe de Marketing"
                />
            </div>

            <div>
                 <label htmlFor="configType" className="block text-xs font-medium text-gray-700">Tipo de Configuração</label>
                 <select
                    id="configType"
                    value={configType}
                    onChange={(e) => setConfigType(e.target.value as TeamConfigType)}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                >
                    <option value="participants">Participantes e projetos</option>
                    <option value="projectsOnly">Apenas projetos</option>
                </select>
            </div>
            
            {configType === 'participants' ? (
                <div>
                    <h3 className="text-xs font-medium text-gray-700 mb-2">Participantes e Projetos</h3>
                    <div className="space-y-3">
                        {participants.map((p, index) => (
                            <div key={p.id} className="grid grid-cols-12 gap-2 items-center">
                                <input
                                    type="text"
                                    placeholder={`Participante ${index + 1}`}
                                    value={p.name}
                                    onChange={(e) => handleParticipantChange(index, 'name', e.target.value)}
                                    className="col-span-7 mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-xs"
                                />
                                <input
                                    type="number"
                                    aria-label="Número de projetos"
                                    value={isNaN(p.projectsCount) ? '' : p.projectsCount}
                                    min="1"
                                    onChange={(e) => handleParticipantChange(index, 'projectsCount', e.target.value)}
                                    className="col-span-3 mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-xs"
                                />
                                <div className="col-span-2 flex justify-end">
                                    <button
                                        onClick={() => removeParticipant(index)}
                                        disabled={participants.length <= 1}
                                        className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button onClick={addParticipant} className="mt-4 flex items-center gap-2 text-xs font-medium text-primary-600 hover:text-primary-800">
                        <PlusIcon className="w-5 h-5" />
                        Adicionar Participante
                    </button>
                </div>
            ) : (
                <div>
                    <label htmlFor="totalProjects" className="block text-xs font-medium text-gray-700">Quantidade de Projetos</label>
                    <input
                        type="number"
                        id="totalProjects"
                        value={isNaN(totalProjects) ? '' : totalProjects}
                        min="1"
                        onChange={(e) => setTotalProjects(parseInt(e.target.value, 10))}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                    />
                </div>
            )}

            {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
        </div>

        <div className="flex justify-end items-center p-5 border-t bg-gray-50 rounded-b-xl">
            <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 mr-3">
                Cancelar
            </button>
            <button onClick={handleSave} className="px-6 py-2 text-xs font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700">
                Salvar
            </button>
        </div>
      </div>
    </div>
  );
};