
import React from 'react';
import type { Team } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { UsersIcon } from './icons/UsersIcon';

interface TeamsPanelProps {
  teams: Team[];
  onAddNewTeam: () => void;
  onEditTeam: (team: Team) => void;
  onDeleteTeam: (teamId: string) => void;
}

const TeamCard: React.FC<{team: Team, onEdit: (team: Team) => void, onDelete: (id: string) => void}> = ({ team, onEdit, onDelete }) => {
    const totalTopics = team.participants.reduce((sum, p) => isNaN(p.topicsCount) ? sum : sum + p.topicsCount, 0);
    
    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(team.id);
    };

    return (
        <div 
            onClick={() => onEdit(team)} 
            className="group relative bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary-300"
        >
            <div>
                <p className="font-bold text-primary-800">{team.name}</p>
                <p className="text-sm text-gray-500">{totalTopics} pautas</p>
            </div>
            <div className="absolute top-0 right-0 h-full flex items-center pr-2">
                 <button 
                    onClick={handleDelete} 
                    className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-100 transition-all duration-300 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
                    aria-label={`Deletar equipe ${team.name}`}
                 >
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export const TeamsPanel: React.FC<TeamsPanelProps> = ({ teams, onAddNewTeam, onEditTeam, onDeleteTeam }) => {
    return (
        <div className="bg-white p-6 md:p-8 rounded-xl h-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Equipes</h2>
                <button 
                    onClick={onAddNewTeam} 
                    className="p-2 text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    aria-label="Adicionar nova equipe"
                >
                    <PlusIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="space-y-4">
                {teams.length > 0 ? (
                     teams.map(team => <TeamCard key={team.id} team={team} onEdit={onEditTeam} onDelete={onDeleteTeam} />)
                ) : (
                    <div className="text-center py-8 px-4 border-2 border-dashed border-gray-300 rounded-lg">
                        <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma equipe adicionada</h3>
                        <p className="mt-1 text-sm text-gray-500">Comece adicionando uma equipe para agendar reuniões.</p>
                    </div>
                )}
            </div>
        </div>
    );
};