export type Frequency = 'semanal' | 'quinzenal' | 'mensal';
export type DayOfWeek = 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta' | 'Sábado' | 'Domingo';
export type TeamConfigType = 'participants' | 'projectsOnly';

export interface Participant {
  id: string;
  name: string;
  projectsCount: number;
}

export interface Team {
  id:string;
  name: string;
  configType: TeamConfigType;
  participants: Participant[];
  totalProjects?: number;
}

export interface GeneralSettings {
  frequency: Frequency;
  days: DayOfWeek[];
  startTime: string;
  endTime: string;
  lunchStartTime: string | null;
  lunchEndTime: string | null;
  projectDuration: number;
  breakInterval: number;
  maxProjectsPerMeeting: number;
}

export interface Meeting {
  id: string;
  teamName: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  participantsInfo: {
    participantName: string;
    projectsCount: number;
  }[];
  totalProjectsInMeeting: number;
}