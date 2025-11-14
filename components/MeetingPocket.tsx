
import React from 'react';
import type { Meeting } from '../types';
import { ClockIcon } from './icons/ClockIcon';
import { PlusIcon } from './icons/PlusIcon';

interface MeetingPocketProps {
    heldMeetings: Meeting[];
    onDropOnPocket: (dragData: { source: string; meetingId?: string }) => void;
}

const HeldMeetingCard: React.FC<{ meeting: Meeting }> = ({ meeting }) => {
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('source', 'pocket');
        e.dataTransfer.setData('meetingId', meeting.id);
    };

    return (
         <div 
            className="bg-white rounded-lg p-3 shadow border border-gray-200 flex flex-col justify-between transition-transform hover:scale-105 duration-200 cursor-grab active:cursor-grabbing h-full w-44"
            draggable
            onDragStart={handleDragStart}
        >
            <div>
                <p className="font-bold text-xs text-primary-800 truncate">{meeting.title}</p>
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
            </div>
            <div className="mt-3 bg-gray-100 rounded-md py-1 px-2 flex items-center justify-center">
                <ClockIcon className="w-3 h-3 mr-1.5 text-gray-600" />
                <span className="text-[11px] font-semibold text-gray-700">{meeting.startTime} - {meeting.endTime}</span>
            </div>
        </div>
    );
};

const FreeMeetingCard: React.FC = () => {
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('source', 'pocket-free-meeting');
    };

    return (
        <div 
            className="bg-blue-50 rounded-lg p-3 shadow border border-blue-200 flex flex-col items-center justify-center text-center transition-transform hover:scale-105 duration-200 cursor-grab active:cursor-grabbing w-44 h-full"
            draggable
            onDragStart={handleDragStart}
        >
            <div className="bg-blue-100 rounded-full p-2 mb-2">
                <PlusIcon className="w-5 h-5 text-blue-600" />
            </div>
            <p className="font-bold text-xs text-blue-800">Reunião Livre</p>
            <p className="text-[11px] text-blue-600 mt-1">Arraste para a agenda para criar uma nova reunião</p>
        </div>
    );
};


export const MeetingPocket: React.FC<MeetingPocketProps> = ({ heldMeetings, onDropOnPocket }) => {

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const source = e.dataTransfer.getData('source');
        const meetingId = e.dataTransfer.getData('meetingId');
        onDropOnPocket({ source, meetingId });
    };

    return (
        <div className="mt-6">
            <h3 className="text-sm font-bold text-gray-600 mb-2">Reuniões em espera</h3>
            <div 
                className="bg-slate-100 rounded-xl p-4 border-2 border-dashed border-slate-300 transition-all duration-300 min-h-[10rem]"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <div className="flex justify-between items-start w-full gap-4">
                    <div className="flex-grow flex items-start flex-wrap gap-4">
                        {heldMeetings.length > 0 ? (
                            heldMeetings.map(meeting => <HeldMeetingCard key={meeting.id} meeting={meeting} />)
                        ) : (
                            <div className="flex-grow flex items-center justify-center text-center text-xs text-gray-400 self-stretch min-h-[8rem]">
                                <p>Arraste uma reunião da agenda aqui para guardá-la temporariamente (máx. 3).</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex-shrink-0">
                        <FreeMeetingCard />
                    </div>
                </div>
            </div>
        </div>
    );
};