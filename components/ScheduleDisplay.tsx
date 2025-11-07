
import React, { useMemo, useState } from 'react';
import type { Meeting, DayOfWeek, Frequency } from '../types';
import { CalendarIcon } from './icons/CalendarIcon';
import { ClockIcon } from './icons/ClockIcon';

interface ScheduleDisplayProps {
  schedule: Meeting[];
  isLoading: boolean;
  error: string | null;
  frequency: Frequency;
}

const CalendarMeetingCard: React.FC<{ meeting: Meeting }> = ({ meeting }) => (
  <div className="bg-white rounded-lg p-3 shadow border border-gray-200 flex flex-col justify-between transition-transform hover:scale-105 duration-200">
    <div>
      <p className="font-bold text-xs text-primary-800 truncate">{meeting.title}</p>
      <div className="border-t pt-2 mt-2">
         <ul className="space-y-2">
            {meeting.participantsInfo.map((p, index) => (
              <li key={index}>
                <p className="text-[11px] font-medium text-gray-800 truncate">{p.participantName}</p>
                <p className="text-[11px] text-gray-500">{p.topicsCount} {p.topicsCount > 1 ? 'pautas' : 'pauta'}</p>
              </li>
            ))}
          </ul>
      </div>
    </div>
    <div className="mt-3 bg-gray-100 rounded-md py-1 px-2 flex items-center justify-center">
      <ClockIcon className="w-3 h-3 mr-1.5 text-gray-600" />
      <span className="text-[11px] font-semibold text-gray-700">{meeting.startTime} - {meeting.endTime}</span>
    </div>
  </div>
);

const weekDays: DayOfWeek[] = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

const WeekView: React.FC<{ meetings: Meeting[] }> = ({ meetings }) => {
  const meetingsByDay = useMemo(() => {
    const grouped: { [key in DayOfWeek]?: Meeting[] } = {};
    const sortedSchedule = [...meetings].sort((a, b) =>
      new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime()
    );

    for (const meeting of sortedSchedule) {
      const date = new Date(`${meeting.date}T00:00:00`);
      let dayName = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(date);
      dayName = dayName.charAt(0).toUpperCase() + dayName.slice(1).replace(/-feira/g, '');

      if (weekDays.includes(dayName as DayOfWeek)) {
        if (!grouped[dayName as DayOfWeek]) {
          grouped[dayName as DayOfWeek] = [];
        }
        grouped[dayName as DayOfWeek]!.push(meeting);
      }
    }
    return grouped;
  }, [meetings]);

  return (
    <div className="bg-slate-100 rounded-xl">
      <div className="grid grid-cols-1 md:grid-cols-5">
        {weekDays.map((day, index) => (
          <div key={day} className={`p-4 ${index < weekDays.length - 1 ? 'border-b md:border-b-0 md:border-r border-slate-200' : ''}`}>
            <h3 className="font-bold text-center text-gray-700 border-b border-slate-200 pb-2 mb-4 text-sm">{day}</h3>
            <div className="space-y-3 min-h-[10rem]">
              {(meetingsByDay[day] && meetingsByDay[day]!.length > 0) ? (
                meetingsByDay[day]!.map(meeting => (
                  <CalendarMeetingCard key={meeting.id} meeting={meeting} />
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-center text-xs text-gray-400 pt-8">
                  <p>Nenhuma reunião.</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


export const ScheduleDisplay: React.FC<ScheduleDisplayProps> = ({ schedule, isLoading, error, frequency }) => {
  // RULE OF HOOKS: All hooks must be called at the top level, before any conditional returns.
  const [activeWeek, setActiveWeek] = useState(1);

  const meetingsByWeek = useMemo(() => {
    if (!schedule || schedule.length === 0) {
      return {};
    }

    const sortedSchedule = [...schedule].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // This check is crucial. If schedule is empty, accessing sortedSchedule[0] would crash.
    if (sortedSchedule.length === 0) {
        return {};
    }

    const firstDate = new Date(`${sortedSchedule[0].date}T00:00:00`);

    const startOfWeek1 = new Date(firstDate);
    const dayOfWeek = startOfWeek1.getDay(); // Sunday = 0, Monday = 1
    const diff = startOfWeek1.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    startOfWeek1.setDate(diff);
    startOfWeek1.setHours(0, 0, 0, 0);

    const grouped: { [week: number]: Meeting[] } = {};
    for (const meeting of schedule) {
        const meetingDate = new Date(`${meeting.date}T00:00:00`);
        const diffTime = meetingDate.getTime() - startOfWeek1.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const weekNumber = Math.floor(diffDays / 7) + 1;
        
        if (!grouped[weekNumber]) {
            grouped[weekNumber] = [];
        }
        grouped[weekNumber].push(meeting);
    }
    return grouped;
  }, [schedule]);

  // Conditional rendering can now happen safely after all hooks have been called.
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <svg className="animate-spin mx-auto h-12 w-12 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-base font-semibold text-gray-700">Gerando agenda, por favor aguarde...</p>
          <p className="text-sm text-gray-500">A IA está organizando as reuniões para todas as equipes.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md text-sm" role="alert">
        <p className="font-bold">Erro!</p>
        <p>{error}</p>
      </div>
    );
  }

  if (schedule.length === 0) {
    return (
      <div className="text-center py-16 px-6">
        <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma agenda gerada</h3>
        <p className="mt-1 text-sm text-gray-500">Adicione equipes, configure os parâmetros e clique em "Gerar Agenda" para começar.</p>
      </div>
    );
  }

  const numWeeks = frequency === 'mensal' ? 4 : (frequency === 'quinzenal' ? 2 : 1);
  const weekNumbers = Array.from({ length: numWeeks }, (_, i) => i + 1);
  const showTabs = frequency !== 'semanal';

  return (
    <div className="space-y-6">
      {showTabs && (
        <div>
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
        </div>
      )}

      <div>
        {showTabs ? (
            <WeekView meetings={meetingsByWeek[activeWeek] || []} />
        ) : (
            <WeekView meetings={meetingsByWeek[1] || []} />
        )}
      </div>
    </div>
  );
};
