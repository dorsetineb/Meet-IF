import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import type { Meeting, DayOfWeek, Frequency } from '../types';
import { CalendarIcon } from './icons/CalendarIcon';
import { ClockIcon } from './icons/ClockIcon';

interface ScheduleDisplayProps {
  schedule: Meeting[];
  isLoading: boolean;
  error: string | null;
  frequency: Frequency;
  activeWeek: number;
  onMeetingDrop: (dragData: { source: string; meetingId?: string }, newDate: string) => void;
  onTimeChange: (meetingId: string, newStartTime: string) => void;
  onCustomTimeChange: (meetingId: string, newStartTime: string, newEndTime: string) => void;
  onTitleChange: (meetingId: string, newTitle: string) => void;
  heldMeetings: Meeting[];
}

const CalendarMeetingCard: React.FC<{ 
    meeting: Meeting, 
    onTimeChange: (meetingId: string, newStartTime: string) => void,
    onCustomTimeChange: (meetingId: string, newStartTime: string, newEndTime: string) => void,
    onTitleChange: (meetingId: string, newTitle: string) => void 
}> = ({ meeting, onTimeChange, onCustomTimeChange, onTitleChange }) => {
    const [isEditingTime, setIsEditingTime] = useState(false);
    const [newStartTime, setNewStartTime] = useState(meeting.startTime);
    const [newEndTime, setNewEndTime] = useState(meeting.endTime);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [newTitle, setNewTitle] = useState(meeting.title);
    const timeEditContainerRef = useRef<HTMLDivElement>(null);

    const handleTimeSave = useCallback(() => {
        if (meeting.isCustom) {
            if (newStartTime !== meeting.startTime || newEndTime !== meeting.endTime) {
                if (new Date(`1970-01-01T${newEndTime}`) > new Date(`1970-01-01T${newStartTime}`)) {
                    onCustomTimeChange(meeting.id, newStartTime, newEndTime);
                } else {
                    setNewStartTime(meeting.startTime);
                    setNewEndTime(meeting.endTime);
                }
            }
        } else {
            if (newStartTime !== meeting.startTime) {
                onTimeChange(meeting.id, newStartTime);
            }
        }
        setIsEditingTime(false);
    }, [meeting, newStartTime, newEndTime, onTimeChange, onCustomTimeChange]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isEditingTime && timeEditContainerRef.current && !timeEditContainerRef.current.contains(event.target as Node)) {
                handleTimeSave();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isEditingTime, handleTimeSave]);

    const handleTitleSave = () => {
        if (newTitle.trim() && newTitle !== meeting.title) {
            onTitleChange(meeting.id, newTitle.trim());
        } else {
            setNewTitle(meeting.title);
        }
        setIsEditingTitle(false);
    };

    const handleTimeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleTimeSave();
        else if (e.key === 'Escape') {
            setNewStartTime(meeting.startTime);
            setNewEndTime(meeting.endTime);
            setIsEditingTime(false);
        }
    };

    const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleTitleSave();
        else if (e.key === 'Escape') {
            setNewTitle(meeting.title);
            setIsEditingTitle(false);
        }
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('source', 'calendar');
        e.dataTransfer.setData('meetingId', meeting.id);
    };

    return (
        <div 
            className="bg-white rounded-lg p-3 shadow border border-gray-200 flex flex-col justify-between transition-transform hover:scale-105 duration-200 cursor-grab active:cursor-grabbing"
            draggable
            onDragStart={handleDragStart}
        >
            <div>
                 {meeting.isCustom && isEditingTitle ? (
                    <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onBlur={handleTitleSave}
                        onKeyDown={handleTitleKeyDown}
                        className="font-bold text-xs text-primary-800 truncate w-full bg-primary-50 border border-primary-300 rounded px-1 py-0.5 outline-none"
                        autoFocus
                    />
                ) : (
                    <p 
                        className={`font-bold text-xs text-primary-800 truncate ${meeting.isCustom ? 'cursor-pointer hover:bg-gray-100 rounded' : ''}`}
                        onClick={() => meeting.isCustom && setIsEditingTitle(true)}
                        title={meeting.isCustom ? "Clique para editar o título" : meeting.title}
                    >
                        {meeting.title}
                    </p>
                )}
                { !meeting.isCustom && (
                    <div className="border-t pt-2 mt-2">
                        {meeting.participantsInfo && meeting.participantsInfo.length > 0 ? (
                            <ul className="space-y-2">
                                {meeting.participantsInfo.map((p, index) => (
                                <li key={index}>
                                    <p className="text-[11px] font-medium text-gray-800 truncate">{p.participantName}</p>
                                    <p className="text-[11px] text-gray-500">{p.projectsCount} {p.projectsCount > 1 ? 'projetos' : 'projeto'}</p>
                                </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-xs text-center text-gray-600 py-2">
                                {meeting.totalProjectsInMeeting} {meeting.totalProjectsInMeeting === 1 ? 'projeto' : 'projetos'} na pauta
                            </p>
                        )}
                    </div>
                )}
            </div>
            <div 
                ref={timeEditContainerRef}
                className={`mt-3 bg-gray-100 rounded-md py-1 px-2 flex items-center justify-center ${!isEditingTime ? 'cursor-pointer' : ''}`}
                onClick={() => !isEditingTime && setIsEditingTime(true)}
                title="Clique para editar o horário"
            >
                <ClockIcon className="w-3 h-3 mr-1.5 text-gray-600" />
                {isEditingTime ? (
                    meeting.isCustom ? (
                        <div className="flex items-center gap-1 w-full">
                            <input
                                type="time"
                                value={newStartTime}
                                onChange={(e) => setNewStartTime(e.target.value)}
                                onKeyDown={handleTimeKeyDown}
                                className="text-[11px] font-semibold text-gray-700 bg-transparent w-full text-center outline-none"
                                autoFocus
                            />
                            <span className="text-[11px] font-semibold text-gray-700">-</span>
                             <input
                                type="time"
                                value={newEndTime}
                                onChange={(e) => setNewEndTime(e.target.value)}
                                onKeyDown={handleTimeKeyDown}
                                className="text-[11px] font-semibold text-gray-700 bg-transparent w-full text-center outline-none"
                            />
                        </div>
                    ) : (
                        <input
                            type="time"
                            value={newStartTime}
                            onChange={(e) => setNewStartTime(e.target.value)}
                            onKeyDown={handleTimeKeyDown}
                            className="text-[11px] font-semibold text-gray-700 bg-transparent w-full text-center outline-none"
                            autoFocus
                        />
                    )
                ) : (
                    <span className="text-[11px] font-semibold text-gray-700">{meeting.startTime} - {meeting.endTime}</span>
                )}
            </div>
        </div>
    );
};

const weekDays: DayOfWeek[] = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

interface WeekViewProps {
    meetings: Meeting[];
    weekStartDate: Date | null;
    onMeetingDrop: (dragData: { source: string; meetingId?: string }, newDate: string) => void;
    onTimeChange: (meetingId: string, newStartTime: string) => void;
    onCustomTimeChange: (meetingId: string, newStartTime: string, newEndTime: string) => void;
    onTitleChange: (meetingId: string, newTitle: string) => void;
}

const WeekView: React.FC<WeekViewProps> = ({ meetings, weekStartDate, onMeetingDrop, onTimeChange, onCustomTimeChange, onTitleChange }) => {
  const meetingsByDay = useMemo(() => {
    const grouped: { [key in DayOfWeek]?: Meeting[] } = {};
    const sortedSchedule = [...meetings].sort((a, b) =>
      new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime()
    );

    for (const meeting of sortedSchedule) {
      const date = new Date(`${meeting.date}T00:00:00`);
      let dayName = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', timeZone: 'UTC' }).format(date);
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

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, day: DayOfWeek) => {
    e.preventDefault();
    if (!weekStartDate) return;
    
    const source = e.dataTransfer.getData('source');
    const meetingId = e.dataTransfer.getData('meetingId');

    const dayIndex = weekDays.indexOf(day);
    
    if (dayIndex !== -1) {
        const newDate = new Date(weekStartDate);
        newDate.setDate(weekStartDate.getDate() + dayIndex);
        const newDateString = newDate.toISOString().split('T')[0];
        onMeetingDrop({ source, meetingId }, newDateString);
    }
  };


  return (
    <div className="bg-slate-100 rounded-xl">
      <div className="grid grid-cols-1 md:grid-cols-5">
        {weekDays.map((day, index) => (
          <div 
            key={day} 
            className={`p-4 ${index < weekDays.length - 1 ? 'border-b md:border-b-0 md:border-r border-slate-200' : ''}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, day)}
          >
            <h3 className="font-bold text-center text-gray-700 pb-2 mb-4 text-sm">{day}</h3>
            <div className="space-y-3 min-h-[10rem]">
              {(meetingsByDay[day] && meetingsByDay[day]!.length > 0) ? (
                meetingsByDay[day]!.map(meeting => (
                  <CalendarMeetingCard key={meeting.id} meeting={meeting} onTimeChange={onTimeChange} onCustomTimeChange={onCustomTimeChange} onTitleChange={onTitleChange} />
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


export const ScheduleDisplay: React.FC<ScheduleDisplayProps> = ({ schedule, isLoading, error, frequency, activeWeek, onMeetingDrop, onTimeChange, onCustomTimeChange, onTitleChange, heldMeetings }) => {
  const { meetingsByWeek, weekStartDates } = useMemo(() => {
    if (!schedule || schedule.length === 0) {
      return { meetingsByWeek: {}, weekStartDates: {} };
    }

    const sortedSchedule = [...schedule].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (sortedSchedule.length === 0) {
        return { meetingsByWeek: {}, weekStartDates: {} };
    }

    const firstDate = new Date(`${sortedSchedule[0].date}T00:00:00`);

    const startOfWeek1 = new Date(firstDate);
    const dayOfWeek = startOfWeek1.getUTCDay(); // Sunday = 0, Monday = 1
    const diff = startOfWeek1.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    startOfWeek1.setUTCDate(diff);
    startOfWeek1.setUTCHours(0, 0, 0, 0);

    const grouped: { [week: number]: Meeting[] } = {};
    const weekStarts: { [week: number]: Date } = {};

    for (const meeting of schedule) {
        const meetingDate = new Date(`${meeting.date}T00:00:00`);
        const diffTime = meetingDate.getTime() - startOfWeek1.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const weekNumber = Math.floor(diffDays / 7) + 1;
        
        if (!grouped[weekNumber]) {
            grouped[weekNumber] = [];
            const weekStartDate = new Date(startOfWeek1);
            weekStartDate.setDate(startOfWeek1.getDate() + (weekNumber - 1) * 7);
            weekStarts[weekNumber] = weekStartDate;
        }
        grouped[weekNumber].push(meeting);
    }
    return { meetingsByWeek: grouped, weekStartDates: weekStarts };
  }, [schedule]);

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

  if (schedule.length === 0 && heldMeetings.length === 0) {
    return (
      <div className="text-center py-16 px-6">
        <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma agenda gerada</h3>
        <p className="mt-1 text-sm text-gray-500">Adicione equipes, configure os parâmetros e clique em "Gerar Agenda" para começar.</p>
      </div>
    );
  }

  const showTabs = frequency !== 'semanal';
  const currentWeekMeetings = meetingsByWeek[activeWeek] || [];
  const currentWeekStartDate = weekStartDates[activeWeek] || (weekStartDates[1] || null);

  return (
    <div>
        <WeekView 
            meetings={showTabs ? currentWeekMeetings : (meetingsByWeek[1] || [])} 
            weekStartDate={showTabs ? currentWeekStartDate : (weekStartDates[1] || null)}
            onMeetingDrop={onMeetingDrop}
            onTimeChange={onTimeChange}
            onCustomTimeChange={onCustomTimeChange}
            onTitleChange={onTitleChange}
        />
    </div>
  );
};