
import React, { useState, useEffect } from 'react';
import { XIcon } from './icons/XIcon';
import { TrashIcon } from './icons/TrashIcon';

interface LunchBreakModalProps {
  startTime: string | null;
  endTime: string | null;
  onSave: (start: string | null, end: string | null) => void;
  onClose: () => void;
}

export const LunchBreakModal: React.FC<LunchBreakModalProps> = ({ startTime, endTime, onSave, onClose }) => {
  const [localStartTime, setLocalStartTime] = useState('12:00');
  const [localEndTime, setLocalEndTime] = useState('13:00');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (startTime && endTime) {
      setLocalStartTime(startTime);
      setLocalEndTime(endTime);
    }
  }, [startTime, endTime]);

  const handleSave = () => {
    setError(null);
    if (new Date(`1970-01-01T${localEndTime}`) <= new Date(`1970-01-01T${localStartTime}`)) {
      setError("O horário de término do almoço deve ser posterior ao horário de início.");
      return;
    }
    onSave(localStartTime, localEndTime);
  };
  
  const handleRemove = () => {
      onSave(null, null);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-5 border-b">
            <h2 className="text-lg font-bold text-gray-800">Definir Horário de Almoço</h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                <XIcon className="w-6 h-6" />
            </button>
        </div>
        
        <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="lunchStartTime" className="block text-xs font-medium text-gray-700">Início do Almoço</label>
                    <input
                        type="time"
                        id="lunchStartTime"
                        value={localStartTime}
                        onChange={(e) => setLocalStartTime(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                    />
                </div>
                 <div>
                    <label htmlFor="lunchEndTime" className="block text-xs font-medium text-gray-700">Fim do Almoço</label>
                    <input
                        type="time"
                        id="lunchEndTime"
                        value={localEndTime}
                        onChange={(e) => setLocalEndTime(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                    />
                </div>
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <div className="flex justify-between items-center p-5 border-t bg-gray-50 rounded-b-xl">
            <button onClick={handleRemove} className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50">
                <TrashIcon className="w-4 h-4" />
                Remover Almoço
            </button>
            <div>
                <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 mr-3">
                    Cancelar
                </button>
                <button onClick={handleSave} className="px-6 py-2 text-xs font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700">
                    Salvar
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
