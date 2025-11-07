
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
      <p className="font-bold text-sm text-primary-800 truncate">{meeting.title}</p>
      <div className="border-t pt-2 mt-2">
         <ul className="text-xs text-gray-600 space-y-1">
            {meeting.participantsInfo.map((p, index) => (
              <li key={index} className="truncate">{p.participantName} ({p.topicsCount} {p.topicsCount > 1 ? 'pautas' : 'pauta'})</li>
            ))}
          </ul>
      </div>
    </div>
    <div className="mt-3 bg-gray-100 rounded-md py-1 px-2 flex items-center justify-center">
      <ClockIcon className="w-3 h-3 mr-1.5 text-gray-600" />
      <span className="text-xs font-semibold text-gray-700">{meeting.startTime} - {meeting.endTime}</span>
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
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
      {weekDays.map(day => (
        <div key={day} className="bg-slate-100 rounded-xl p-4 space-y-4 min-h-[10rem]">
          <h3 className="font-bold text-center text-gray-700 border-b pb-2">{day}</h3>
          <div className="space-y-3">
            {(meetingsByDay[day] && meetingsByDay[day]!.length > 0) ? (
              meetingsByDay[day]!.map(meeting => (
                <CalendarMeetingCard key={meeting.id} meeting={meeting} />
              ))
            ) : (
              <div className="text-center text-sm text-gray-400 pt-8">
                <p>Nenhuma reunião.</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};


export const ScheduleDisplay: React.FC<ScheduleDisplayProps> = ({ schedule, isLoading, error, frequency }) => {
  const [activeWeek, setActiveWeek] = useState(1);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <svg className="animate-spin mx-auto h-12 w-12 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-lg font-semibold text-gray-700">Gerando agenda, por favor aguarde...</p>
          <p className="text-gray-500">A IA está organizando as reuniões para todas as equipes.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
        <p className="font-bold">Erro!</p>
        <p>{error}</p>
      </div>
    );
  }

  const meetingsByWeek = useMemo(() => {
    if (!schedule || schedule.length === 0) return {};

    const sortedSchedule = [...schedule].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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

  if (schedule.length === 0) {
    return (
      <div className="text-center py-16 px-6 bg-white rounded-xl">
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
        <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                {weekNumbers.map(weekNum => (
                     <button
                        key={weekNum}
                        onClick={() => setActiveWeek(weekNum)}
                        className={`${
                            activeWeek === weekNum
                            ? 'border-primary-500 text-primary-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
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
