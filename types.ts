export type Frequency = 'semanal' | 'quinzenal' | 'mensal';
export type DayOfWeek = 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta' | 'Sábado' | 'Domingo';

export interface Participant {
  id: string;
  name: string;
  topicsCount: number;
}

export interface Team {
  id:string;
  name: string;
  participants: Participant[];
}

export interface GeneralSettings {
  frequency: Frequency;
  days: DayOfWeek[];
  startTime: string;
  endTime: string;
  lunchStartTime: string;
  lunchEndTime: string;
  topicDuration: number;
  breakInterval: number;
  maxTopicsPerMeeting: number;
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
    topicsCount: number;
  }[];
}