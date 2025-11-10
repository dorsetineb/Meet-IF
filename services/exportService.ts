import type { Meeting, GeneralSettings, DayOfWeek } from '../types';

const weekDays: DayOfWeek[] = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

const generateMeetingCardHTML = (meeting: Meeting): string => `
  <div class="bg-white rounded-lg p-3 shadow border border-gray-200 flex flex-col justify-between break-inside-avoid">
    <div>
      <p class="font-bold text-xs text-primary-800">${meeting.title}</p>
      <div class="border-t pt-2 mt-2">
         <ul class="space-y-2">
            ${meeting.participantsInfo.map(p => `
              <li>
                <p class="text-[11px] font-medium text-gray-800">${p.participantName}</p>
                <p class="text-[11px] text-gray-500">${p.projectsCount} ${p.projectsCount > 1 ? 'projetos' : 'projeto'}</p>
              </li>
            `).join('')}
          </ul>
      </div>
    </div>
    <div class="mt-3 bg-gray-100 rounded-md py-1 px-2 flex items-center justify-center">
      <svg class="w-3 h-3 mr-1.5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      <span class="text-[11px] font-semibold text-gray-700">${meeting.startTime} - ${meeting.endTime}</span>
    </div>
  </div>
`;

const generateWeekViewHTML = (meetings: Meeting[], weekNumber: number, showWeekTitle: boolean): string => {
  const grouped: { [key in DayOfWeek]?: Meeting[] } = {};
  const sortedMeetings = [...meetings].sort((a, b) =>
    new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime()
  );

  for (const meeting of sortedMeetings) {
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

  const weekContent = weekDays.map((day, index) => `
    <div class="p-4 ${index < weekDays.length - 1 ? 'md:border-r border-b md:border-b-0 border-slate-200' : 'border-b md:border-b-0 border-slate-200'}">
      <h3 class="font-bold text-center text-gray-700 pb-2 mb-4 text-sm border-b border-slate-200">${day}</h3>
      <div class="space-y-3 min-h-[10rem]">
        ${(grouped[day] && grouped[day]!.length > 0) ? (
          grouped[day]!.map(meeting => generateMeetingCardHTML(meeting)).join('')
        ) : `
          <div class="flex items-center justify-center h-full text-center text-xs text-gray-400 pt-8">
            <p>Nenhuma reunião.</p>
          </div>
        `}
      </div>
    </div>
  `).join('');

  return `
    ${showWeekTitle ? `<h2 class="text-2xl font-bold text-gray-800 mb-4 mt-6">Semana ${weekNumber}</h2>` : ''}
    <div class="bg-slate-100 rounded-xl">
      <div class="grid grid-cols-1 md:grid-cols-5">
        ${weekContent}
      </div>
    </div>
  `;
};

export const generateScheduleHTML = (schedule: Meeting[], settings: GeneralSettings): string => {
  if (!schedule || schedule.length === 0) {
    return '<html><body><h1>Nenhuma agenda para exportar.</h1></body></html>';
  }

  const sortedSchedule = [...schedule].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const firstDate = new Date(`${sortedSchedule[0].date}T00:00:00`);
  const startOfWeek1 = new Date(firstDate);
  const dayOfWeek = startOfWeek1.getDay();
  const diff = startOfWeek1.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  startOfWeek1.setDate(diff);
  startOfWeek1.setHours(0, 0, 0, 0);

  const meetingsByWeek: { [week: number]: Meeting[] } = {};
  for (const meeting of schedule) {
    const meetingDate = new Date(`${meeting.date}T00:00:00`);
    const diffTime = meetingDate.getTime() - startOfWeek1.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(diffDays / 7) + 1;
    
    if (!meetingsByWeek[weekNumber]) {
      meetingsByWeek[weekNumber] = [];
    }
    meetingsByWeek[weekNumber].push(meeting);
  }

  const weekNumbers = Object.keys(meetingsByWeek).map(Number).sort((a, b) => a - b);
  const showWeekTitles = settings.frequency !== 'semanal';

  const scheduleContent = weekNumbers.map(weekNum => 
    generateWeekViewHTML(meetingsByWeek[weekNum], weekNum, showWeekTitles)
  ).join('');

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Agenda de Reuniões</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <script>
        tailwind.config = {
          theme: {
            extend: {
              colors: {
                primary: {
                  '50': '#f0f9ff', '100': '#e0f2fe', '200': '#bae6fd', '300': '#7dd3fc',
                  '400': '#38bdf8', '500': '#0ea5e9', '600': '#0284c7', '700': '#0369a1',
                  '800': '#075985', '900': '#0c4a6e', '950': '#082f49',
                },
              }
            }
          }
        }
      </script>
      <style>
        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none; }
            .break-inside-avoid { page-break-inside: avoid; }
        }
        body { font-family: sans-serif; }
      </style>
    </head>
    <body class="bg-slate-200">
      <div class="max-w-[90rem] mx-auto p-4 sm:p-6 lg:p-8">
        <div class="flex justify-between items-center mb-6 no-print">
            <h1 class="text-3xl font-bold text-gray-800">Agenda de Reuniões</h1>
            <button onclick="window.print()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700">Imprimir</button>
        </div>
        ${scheduleContent}
      </div>
    </body>
    </html>
  `;
};
