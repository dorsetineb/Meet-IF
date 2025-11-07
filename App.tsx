import React, { useState, useCallback } from 'react';
import { TeamsPanel } from './components/TeamsPanel';
import { GeneralSettingsPanel } from './components/GeneralSettingsPanel';
import { ScheduleDisplay } from './components/ScheduleDisplay';
import { TeamModal } from './components/TeamModal';
import { LunchBreakModal } from './components/LunchBreakModal';
import { generateSchedule } from './services/geminiService';
import type { GeneralSettings, Meeting, Team } from './types';

const App: React.FC = () => {
  const [settings, setSettings] = useState<GeneralSettings>({
    frequency: 'semanal',
    days: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'],
    startTime: '09:00',
    endTime: '18:00',
    lunchStartTime: '12:00',
    lunchEndTime: '13:00',
    topicDuration: 15,
    breakInterval: 10,
    maxTopicsPerMeeting: 8,
  });
  const [teams, setTeams] = useState<Team[]>([]);
  const [schedule, setSchedule] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isLunchModalOpen, setIsLunchModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const handleAddNewTeam = () => {
    setEditingTeam(null);
    setIsTeamModalOpen(true);
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setIsTeamModalOpen(true);
  };

  const handleCloseTeamModal = () => {
    setIsTeamModalOpen(false);
    setEditingTeam(null);
  };

  const handleSaveTeam = (team: Team) => {
    setTeams(prevTeams => {
      const existing = prevTeams.find(t => t.id === team.id);
      if (existing) {
        return prevTeams.map(t => t.id === team.id ? team : t);
      }
      return [...prevTeams, team];
    });
    handleCloseTeamModal();
  };
  
  const handleDeleteTeam = (teamId: string) => {
    setTeams(prevTeams => prevTeams.filter(t => t.id !== teamId));
  };

  const handleOpenLunchModal = () => setIsLunchModalOpen(true);
  const handleCloseLunchModal = () => setIsLunchModalOpen(false);
  const handleSaveLunchBreak = (start: string | null, end: string | null) => {
    setSettings(prev => ({ ...prev, lunchStartTime: start, lunchEndTime: end }));
    handleCloseLunchModal();
  };

  const handleGenerateSchedule = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSchedule([]);

    try {
        if (teams.length === 0) {
            throw new Error("Por favor, adicione pelo menos uma equipe para gerar la agenda.");
        }
        if (settings.days.length === 0) {
            throw new Error("Por favor, selecione pelo menos um dia da semana nas configurações gerais.");
        }
        if (new Date(`1970-01-01T${settings.endTime}`) <= new Date(`1970-01-01T${settings.startTime}`)) {
            throw new Error("O horário de término deve ser posterior ao horário de início.");
        }
        if (
            settings.lunchStartTime &&
            settings.lunchEndTime &&
            (new Date(`1970-01-01T${settings.lunchEndTime}`) <= new Date(`1970-01-01T${settings.lunchStartTime}`))
        ) {
            throw new Error("O horário de término do almoço deve ser posterior ao horário de início.");
        }
      const newSchedule = await generateSchedule(settings, teams);
      setSchedule(newSchedule);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('Ocorreu um erro inesperado.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [settings, teams]);

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-gray-800">
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                <div className="lg:col-span-3">
                    <GeneralSettingsPanel
                        settings={settings}
                        setSettings={setSettings}
                        onLunchSettingsClick={handleOpenLunchModal}
                    />
                </div>
                <div className="lg:col-span-1">
                    <TeamsPanel
                        teams={teams}
                        onAddNewTeam={handleAddNewTeam}
                        onEditTeam={handleEditTeam}
                        onDeleteTeam={handleDeleteTeam}
                    />
                </div>
            </div>

            <div className="mt-8">
                <button
                    type="button"
                    onClick={handleGenerateSchedule}
                    disabled={isLoading || teams.length === 0}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300 disabled:cursor-not-allowed"
                    >
                    {isLoading ? (
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : 'Gerar Agenda'}
                </button>
            </div>
            
            <div className="mt-10">
                <ScheduleDisplay 
                schedule={schedule} 
                isLoading={isLoading} 
                error={error} 
                />
            </div>
        </div>
      </main>
      {isTeamModalOpen && (
        <TeamModal 
            team={editingTeam}
            onSave={handleSaveTeam}
            onClose={handleCloseTeamModal}
        />
      )}
      {isLunchModalOpen && (
        <LunchBreakModal
            startTime={settings.lunchStartTime}
            endTime={settings.lunchEndTime}
            onSave={handleSaveLunchBreak}
            onClose={handleCloseLunchModal}
        />
      )}
    </div>
  );
};

export default App;