
import React, { useMemo } from 'react';
import type { Meeting, DayOfWeek } from '../types';
import { CalendarIcon } from './icons/CalendarIcon';
import { ClockIcon } from './icons/ClockIcon';

interface ScheduleDisplayProps {
  schedule: Meeting[];
  isLoading: boolean;
  error: string | null;
}

const CalendarMeetingCard: React.FC<{ meeting: Meeting }> = ({ meeting }) => (
  <div className="bg-white rounded-lg p-3 shadow border border-gray-200 space-y-2 transition-transform hover:scale-105 duration-200">
    <p className="font-bold text-sm text-primary-800">{meeting.title}</p>
    <p className="text-xs font-medium text-gray-500">{meeting.teamName}</p>
    <div className="flex items-center text-xs text-gray-600">
      <ClockIcon className="w-3 h-3 mr-1.5" />
      <span>{meeting.startTime} - {meeting.endTime}</span>
    </div>
    <div className="border-t pt-2 mt-2">
       <ul className="text-xs text-gray-600 space-y-1">
          {meeting.participantsInfo.map((p, index) => (
            <li key={index} className="truncate">{p.participantName} ({p.topicsCount} {p.topicsCount > 1 ? 'pautas' : 'pauta'})</li>
          ))}
        </ul>
    </div>
  </div>
);


export const ScheduleDisplay: React.FC<ScheduleDisplayProps> = ({ schedule, isLoading, error }) => {
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

  if (schedule.length === 0) {
    return (
      <div className="text-center py-16 px-6 bg-white rounded-xl">
        <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma agenda gerada</h3>
        <p className="mt-1 text-sm text-gray-500">Adicione equipes, configure os parâmetros e clique em "Gerar Agenda" para começar.</p>
      </div>
    );
  }

  const weekDays: DayOfWeek[] = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

  const meetingsByDay = useMemo(() => {
    const grouped: { [key in DayOfWeek]?: Meeting[] } = {};
    
    const sortedSchedule = [...schedule].sort((a,b) => 
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
  }, [schedule]);


  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-800 text-center">Agenda Proposta</h2>
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
    </div>
  );
};