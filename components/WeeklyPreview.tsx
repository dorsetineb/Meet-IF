import React, { useMemo } from 'react';
import type { GeneralSettings, DayOfWeek } from '../types';

interface WeeklyPreviewProps {
    settings: Pick<GeneralSettings, 'days' | 'startTime' | 'endTime'>;
}

const ALL_DAYS: DayOfWeek[] = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
const DAY_SHORT_NAMES = {'Segunda': 'Seg', 'Terça': 'Ter', 'Quarta': 'Qua', 'Quinta': 'Qui', 'Sexta': 'Sex', 'Sábado': 'Sáb', 'Domingo': 'Dom'};


const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

export const WeeklyPreview: React.FC<WeeklyPreviewProps> = ({ settings }) => {
    const { days, startTime, endTime } = settings;

    const timeSlots = useMemo(() => {
        const slots = [];
        const startHour = Math.floor(timeToMinutes(startTime) / 60);
        const endHour = Math.ceil(timeToMinutes(endTime) / 60);
        
        for (let i = startHour; i < endHour; i++) {
            slots.push(`${String(i).padStart(2, '0')}:00`);
        }
        return slots;
    }, [startTime, endTime]);
    
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    const isSlotActive = (day: DayOfWeek, time: string): boolean => {
        if (!days.includes(day)) return false;
        
        const slotMinutes = timeToMinutes(time);
        return slotMinutes < endMinutes && (slotMinutes + 60) > startMinutes;
    };
    
    if (timeToMinutes(startTime) >= timeToMinutes(endTime) || days.length === 0) {
        return (
             <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Prévia da Disponibilidade Semanal</h2>
                <div className="text-center py-8 px-4 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-500">Selecione dias e um intervalo de horários válido nas Configurações Gerais para ver a prévia.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Prévia da Disponibilidade Semanal</h2>
            <div className="overflow-x-auto">
                <div className="grid grid-cols-6 gap-1 text-center text-sm font-medium">
                    <div className="p-2"></div> {/* Empty corner */}
                    {ALL_DAYS.map(day => (
                        <div key={day} className="p-2 text-gray-600">{DAY_SHORT_NAMES[day]}</div>
                    ))}

                    {timeSlots.map(time => (
                        <React.Fragment key={time}>
                            <div className="p-2 text-right text-gray-500 text-xs">{time}</div>
                            {ALL_DAYS.map(day => (
                                <div key={`${day}-${time}`} className={`h-8 rounded-sm ${isSlotActive(day, time) ? 'bg-primary-200' : 'bg-gray-100'}`}>
                                </div>
                            ))}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
};