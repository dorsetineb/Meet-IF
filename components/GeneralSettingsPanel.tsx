import React from 'react';
import type { GeneralSettings, DayOfWeek } from '../types';
import { DiskIcon } from './icons/DiskIcon';
import { CoffeeIcon } from './icons/CoffeeIcon';

interface GeneralSettingsPanelProps {
  settings: GeneralSettings;
  setSettings: React.Dispatch<React.SetStateAction<GeneralSettings>>;
  onLunchSettingsClick: () => void;
}

const ALL_DAYS: DayOfWeek[] = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

const InputField = ({ id, label, type, value, onChange, min, step }: { id: string, label: string, type: string, value: string | number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, min?: string, step?: string }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      type={type}
      id={id}
      name={id}
      value={value}
      onChange={onChange}
      min={min}
      step={step}
      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
    />
  </div>
);

export const GeneralSettingsPanel: React.FC<GeneralSettingsPanelProps> = ({ settings, setSettings, onLunchSettingsClick }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumber = e.target instanceof HTMLInputElement && e.target.type === 'number';
        setSettings(prev => ({ ...prev, [name]: isNumber ? parseInt(value, 10) || 0 : value }));
    };

    const handleDayToggle = (day: DayOfWeek) => {
        setSettings(prev => {
            const newDays = prev.days.includes(day)
            ? prev.days.filter(d => d !== day)
            : [...prev.days, day];
            return { ...prev, days: newDays };
        });
    };
    
    const handleSave = () => {
        alert('Configurações salvas!');
    };

    return (
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Configurações Gerais</h2>
                <button 
                    onClick={handleSave} 
                    className="p-2 text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    aria-label="Salvar configurações"
                >
                    <DiskIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
                    <div>
                        <label htmlFor="frequency" className="block text-sm font-medium text-gray-700">Frequência</label>
                        <select id="frequency" name="frequency" value={settings.frequency} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                            <option value="semanal">Semanal</option>
                            <option value="quinzenal">Quinzenal</option>
                            <option value="mensal">Mensal</option>
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 sm:mb-2">Dias da Semana</label>
                        <div className="grid grid-cols-5 gap-2">
                            {ALL_DAYS.map(day => (
                                <button type="button" key={day} onClick={() => handleDayToggle(day)} className={`px-2 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${ settings.days.includes(day) ? 'bg-primary-600 text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                                    {day.substring(0, 3)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
                    <InputField id="startTime" label="Início da Janela de Horário" type="time" value={settings.startTime} onChange={handleChange} />
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 invisible" aria-hidden="true">Almoço</label>
                        <button 
                            type="button" 
                            onClick={onLunchSettingsClick}
                            className={`mt-1 block w-full px-3 py-2 text-sm font-medium rounded-md shadow-sm border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${settings.lunchStartTime && settings.lunchEndTime ? 'bg-primary-600 text-white hover:bg-primary-700 border-primary-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border-gray-200 hover:border-gray-300'}`}
                            aria-label="Definir ou editar horário de almoço"
                        >
                            Almoço
                        </button>
                    </div>

                    <InputField id="endTime" label="Fim da Janela de Horário" type="time" value={settings.endTime} onChange={handleChange} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <InputField id="maxTopicsPerMeeting" label="Máx. Pautas por Reunião" type="number" value={settings.maxTopicsPerMeeting} onChange={handleChange} min="1" />
                    <InputField id="topicDuration" label="Duração/Pauta (min)" type="number" value={settings.topicDuration} onChange={handleChange} min="5" step="5" />
                    <InputField id="breakInterval" label="Intervalo entre reuniões (min)" type="number" value={settings.breakInterval} onChange={handleChange} min="0" step="5" />
                </div>
            </div>
        </div>
    );
};