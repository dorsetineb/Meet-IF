import { GoogleGenAI, Type } from "@google/genai";
import { GeneralSettings, Team, Meeting } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const buildPrompt = (settings: GeneralSettings, teams: Team[]): string => {
  const teamsDescription = teams.map(team => {
      const totalTopics = team.participants.reduce((sum, p) => sum + p.topicsCount, 0);
      const participantsDescription = team.participants.map(p => `${p.name} (${p.topicsCount} pautas)`).join(', ');
      return `- Equipe: ${team.name} (Total de pautas: ${totalTopics}, Participantes: ${participantsDescription})`;
  }).join('\n');
  
  const lunchDescription = settings.lunchStartTime && settings.lunchEndTime
    ? `das ${settings.lunchStartTime} às ${settings.lunchEndTime} (nenhuma reunião deve ser agendada neste período)`
    : 'Não há um intervalo de almoço definido. Evite agendar reuniões entre 12:00 e 13:00, se possível.';

  return `
      Você é um assistente especialista em agendamento de reuniões para múltiplas equipes. Com base nos seguintes parâmetros gerais e na lista de equipes, gere uma agenda de reuniões a partir da data de hoje.

      Parâmetros Gerais:
      - Período de Agendamento (Frequência): ${settings.frequency}. Isso significa que todas as reuniões necessárias para cobrir as pautas de cada equipe devem ser agendadas dentro do próximo período: uma semana (semanal), duas semanas (quinzenal) ou um mês (mensal). Se uma equipe precisa de múltiplas reuniões, todas as elas devem ocorrer dentro deste único período. A agenda não deve se repetir ou se estender para além desse período.
      - Dias da semana permitidos: ${settings.days.join(', ')}
      - Horário de início da janela disponível: ${settings.startTime}
      - Horário de fim da janela disponível: ${settings.endTime}
      - Intervalo de almoço: ${lunchDescription}
      - Duração por pauta (minutos): ${settings.topicDuration}
      - Máximo de pautas por reunião: ${settings.maxTopicsPerMeeting}
      - Intervalo mínimo entre reuniões no mesmo dia (minutos): ${settings.breakInterval}

      Equipes para Agendar:
      ${teamsDescription}

      Instruções:
      1. Para cada equipe, verifique o número total de pautas.
      2. Calcule o número de reuniões necessárias para cada equipe dividindo o total de pautas pelo "Máximo de pautas por reunião" e arredondando para cima. Distribua as pautas o mais uniformemente possível entre as reuniões necessárias. Por exemplo, se uma equipe tem 10 pautas e o máximo é 8, o ideal é criar duas reuniões com 5 pautas cada.
      3. Ao atribuir pautas, priorize manter todas as pautas de um mesmo participante dentro da mesma reunião, a menos que seja impossível devido ao limite de pautas.
      4. Ao dividir reuniões, adicione um sufixo ao título para diferenciá-las (ex: "Sincronização - Equipe Alpha (1/2)" e "Sincronização - Equipe Alpha (2/2)").
      5. **REGRA DE ESPAÇAMENTO OBRIGATÓRIA (MUITO IMPORTANTE):** Se uma equipe tiver múltiplas reuniões (ex: Reunião A (1/2) e Reunião A (2/2)), essas reuniões NUNCA devem ocorrer no mesmo dia.
         - A prioridade máxima é agendá-las em dias diferentes.
         - Se o agendamento for quinzenal ou mensal, a prioridade é agendá-las em semanas diferentes.
         - Esta regra é mais importante do que tentar agrupar todas as reuniões o mais cedo possível. Distribua-as para garantir o espaçamento.
      6. Calcule a duração de cada reunião individualmente com base no número de pautas atribuídas a ela.
      7. Agende TODAS as reuniões resultantes, distribuindo-as de forma equilibrada ao longo dos dias e horários permitidos DENTRO DO PERÍODO DE AGENDAMENTO DEFINIDO PELA FREQUÊNCIA, sempre respeitando a regra crítica de espaçamento.
      8. Respeite a frequência, os dias da semana e a janela de horários para TODAS as reuniões.
      9. Assegure que haja o intervalo mínimo especificado entre reuniões e NUNCA agende nada durante o intervalo de almoço.
      10. A data deve ser no formato AAAA-MM-DD e o horário no formato HH:mm.
      11. Em vez de gerar uma lista de pautas genéricas, o campo 'participantsInfo' deve ser um array de objetos, onde cada objeto contém 'participantName' e 'topicsCount', indicando quantos tópicos aquele participante apresentará naquela reunião específica.
      12. O formato de saída deve ser um JSON array de objetos de reunião. Certifique-se de que a propriedade 'teamName' em cada objeto de reunião corresponde ao nome da equipe correta.
  `;
};

const meetingSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: 'Um ID único para a reunião' },
      teamName: { type: Type.STRING, description: 'Nome da equipe' },
      title: { type: Type.STRING, description: 'Título da reunião' },
      date: { type: Type.STRING, description: 'Data da reunião no formato AAAA-MM-DD' },
      startTime: { type: Type.STRING, description: 'Horário de início no formato HH:mm' },
      endTime: { type: Type.STRING, description: 'Horário de término no formato HH:mm' },
      participantsInfo: {
        type: Type.ARRAY,
        items: { 
            type: Type.OBJECT,
            properties: {
                participantName: { type: Type.STRING },
                topicsCount: { type: Type.NUMBER }
            },
            required: ['participantName', 'topicsCount']
        },
        description: 'Lista de participantes e quantas pautas cada um tem na reunião'
      },
    },
    required: ['id', 'teamName', 'title', 'date', 'startTime', 'endTime', 'participantsInfo'],
  },
};

export const generateSchedule = async (settings: GeneralSettings, teams: Team[]): Promise<Meeting[]> => {
  try {
    const prompt = buildPrompt(settings, teams);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: meetingSchema,
      },
    });

    const jsonText = response.text.trim();
    if (!jsonText) {
      throw new Error("A API retornou uma resposta vazia.");
    }
    const schedule = JSON.parse(jsonText);
    return schedule;
  } catch (error) {
    console.error("Erro ao gerar agenda com Gemini:", error);
    if (error instanceof Error) {
        throw new Error(`Falha ao gerar a agenda: ${error.message}`);
    }
    throw new Error("Ocorreu um erro desconhecido ao se comunicar com a IA.");
  }
};