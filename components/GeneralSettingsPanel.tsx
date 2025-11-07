
import React, { useState, useMemo } from 'react';
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
    const [savedSettings, setSavedSettings] = useState<GeneralSettings>(settings);

    const isDirty = useMemo(() => {
        return JSON.stringify(settings) !== JSON.stringify(savedSettings);
    }, [settings, savedSettings]);

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
        if (!isDirty) return;
        setSavedSettings(settings);
        alert('Configurações salvas!');
    };

    return (
        <div className="bg-white p-6 md:p-8 rounded-xl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Configurações Gerais</h2>
                <button 
                    onClick={handleSave}
                    disabled={!isDirty}
                    className={`p-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                        isDirty 
                        ? 'text-white bg-primary-600 hover:bg-primary-700' 
                        : 'text-gray-500 bg-gray-300 cursor-not-allowed'
                    }`}
                    aria-label="Salvar configurações"
                >
                    <DiskIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
                    <div>
                        <label htmlFor="frequency" className="block text-sm font-medium text-gray-700">Frequência de reuniões por equipe</label>
                        <select id="frequency" name="frequency" value={settings.frequency} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                            <option value="semanal">Semanal</option>
                            <option value="quinzenal">Quinzenal</option>
                            <option value="mensal">Mensal</option>
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 sm:mb-2">Dias da semana</label>
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
                    <InputField id="startTime" label="Início da janela de reuniões" type="time" value={settings.startTime} onChange={handleChange} />
                    
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

                    <InputField id="endTime" label="Fim da janela de reuniões" type="time" value={settings.endTime} onChange={handleChange} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                        <label htmlFor="maxTopicsPerMeeting" className="block text-sm font-medium text-gray-700">Máximo de pautas por reunião</label>
                        <input
                            type="number"
                            id="maxTopicsPerMeeting"
                            name="maxTopicsPerMeeting"
                            value={settings.maxTopicsPerMeeting}
                            onChange={handleChange}
                            min="1"
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                    </div>
                    <div>
                        <label htmlFor="topicDuration" className="block text-sm font-medium text-gray-700">Duração média das pautas</label>
                        <div className="mt-1 flex items-baseline gap-2">
                             <input
                                type="number"
                                id="topicDuration"
                                name="topicDuration"
                                value={settings.topicDuration}
                                onChange={handleChange}
                                min="5"
                                step="5"
                                className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="text-sm text-gray-600">minutos</span>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="breakInterval" className="block text-sm font-medium text-gray-700">Intervalo entre reuniões</label>
                         <div className="mt-1 flex items-baseline gap-2">
                            <input
                                type="number"
                                id="breakInterval"
                                name="breakInterval"
                                value={settings.breakInterval}
                                onChange={handleChange}
                                min="0"
                                step="5"
                                className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="text-sm text-gray-600">minutos</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
