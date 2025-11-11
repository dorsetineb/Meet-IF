
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { TeamsPanel } from './components/TeamsPanel';
import { GeneralSettingsPanel } from './components/GeneralSettingsPanel';
import { ScheduleDisplay } from './components/ScheduleDisplay';
import { TeamModal } from './components/TeamModal';
import { LunchBreakModal } from './components/LunchBreakModal';
import { generateSchedule } from './services/geminiService';
import { generateScheduleHTML } from './services/exportService';
import type { GeneralSettings, Meeting, Team } from './types';
import { ExportIcon } from './components/icons/ExportIcon';

const defaultSettings: GeneralSettings = {
    frequency: 'semanal',
    days: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'],
    startTime: '09:00',
    endTime: '18:00',
    lunchStartTime: '12:00',
    lunchEndTime: '13:00',
    projectDuration: 15,
    breakInterval: 10,
    maxProjectsPerMeeting: 8,
};

const App: React.FC = () => {
    const [settings, setSettings] = useState<GeneralSettings>(() => {
        const saved = localStorage.getItem('meet-if-settings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return { ...defaultSettings, ...parsed };
            } catch (e) {
                console.error("Could not parse settings from localStorage", e);
            }
        }
        return defaultSettings;
    });

    const [teams, setTeams] = useState<Team[]>(() => {
        const saved = localStorage.getItem('meet-if-teams');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Could not parse teams from localStorage", e);
            }
        }
        return [];
    });

    const [schedule, setSchedule] = useState<Meeting[]>(() => {
        const saved = localStorage.getItem('meet-if-schedule');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Could not parse schedule from localStorage", e);
            }
        }
        return [];
    });
    
    useEffect(() => {
        localStorage.setItem('meet-if-settings', JSON.stringify(settings));
    }, [settings]);

    useEffect(() => {
        localStorage.setItem('meet-if-teams', JSON.stringify(teams));
    }, [teams]);

    useEffect(() => {
        localStorage.setItem('meet-if-schedule', JSON.stringify(schedule));
    }, [schedule]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isLunchModalOpen, setIsLunchModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const [activeWeek, setActiveWeek] = useState(1);

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
    setActiveWeek(1);

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
        if (
            e.message.includes("API key not valid") ||
            e.message.includes("API_KEY_INVALID") ||
            e.message.includes("API_KEY environment variable not set")
        ) {
            setError("Falha na autenticação: A chave da API é inválida ou não foi configurada. Verifique as variáveis de ambiente na sua plataforma de hospedagem (ex: Vercel) e faça o deploy novamente.");
        } else if (e.message.startsWith("GEMINI_OVERLOADED:")) {
            setError("Ocorreu um erro ao comunicar com a IA, que parece estar sobrecarregada. Por favor, tente novamente em alguns instantes.");
        } else {
            setError(e.message);
        }
      } else {
        setError('Ocorreu um erro inesperado.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [settings, teams]);

  const handleExport = () => {
    try {
        const htmlContent = generateScheduleHTML(schedule, settings);
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'agenda-reunioes.html';
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error("Oops, something went wrong during export!", err);
        setError("Falha ao exportar a agenda como arquivo HTML.");
    }
  };

  const numWeeks = settings.frequency === 'mensal' ? 4 : (settings.frequency === 'quinzenal' ? 2 : 1);
  const weekNumbers = Array.from({ length: numWeeks }, (_, i) => i + 1);
  const showTabs = settings.frequency !== 'semanal';

  return (
    <div className="min-h-screen font-sans text-gray-800">
      <main className="py-10">
        <div className="grid grid-cols-12 gap-8 max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="col-span-12 lg:col-span-3">
                 <TeamsPanel
                    teams={teams}
                    onAddNewTeam={handleAddNewTeam}
                    onEditTeam={handleEditTeam}
                    onDeleteTeam={handleDeleteTeam}
                />
            </div>
            <div className="col-span-12 lg:col-span-9">
                <GeneralSettingsPanel
                    settings={settings}
                    setSettings={setSettings}
                    onLunchSettingsClick={handleOpenLunchModal}
                />
                <div className="mt-8">
                    <button
                        type="button"
                        onClick={handleGenerateSchedule}
                        disabled={isLoading || teams.length === 0}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-slate-400 disabled:cursor-not-allowed"
                        >
                        {isLoading ? (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : 'Gerar Agenda'}
                    </button>
                </div>
                
                <div className="mt-10 bg-white p-6 md:p-8 rounded-xl">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                           {schedule.length > 0 && !isLoading && showTabs && (
                                <nav className="flex space-x-2" aria-label="Tabs">
                                    {weekNumbers.map(weekNum => (
                                        <button
                                            key={weekNum}
                                            onClick={() => setActiveWeek(weekNum)}
                                            className={`${
                                                activeWeek === weekNum
                                                ? 'bg-primary-600 text-white shadow'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            } whitespace-nowrap py-2 px-4 rounded-md font-medium text-xs transition-colors duration-200`}
                                        >
                                            Semana {weekNum}
                                        </button>
                                    ))}
                                </nav>
                           )}
                        </div>
                        {schedule.length > 0 && !isLoading && (
                            <button
                                onClick={handleExport}
                                className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-primary-600 bg-primary-100 border border-transparent rounded-md hover:bg-primary-200"
                                aria-label="Exportar agenda"
                            >
                                <ExportIcon className="w-4 h-4" />
                                Exportar
                            </button>
                        )}
                    </div>
                    <ScheduleDisplay 
                        schedule={schedule} 
                        isLoading={isLoading} 
                        error={error} 
                        frequency={settings.frequency}
                        activeWeek={activeWeek}
                    />
                </div>
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
