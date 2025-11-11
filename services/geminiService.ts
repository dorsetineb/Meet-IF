
import { GoogleGenAI, Type } from "@google/genai";
import { GeneralSettings, Team, Meeting } from '../types';

const buildPrompt = (settings: GeneralSettings, teams: Team[]): string => {
  const teamsDescription = teams.map(team => {
      const totalProjects = team.participants.reduce((sum, p) => sum + p.projectsCount, 0);
      const participantsDescription = team.participants.map(p => `${p.name} (${p.projectsCount} projetos)`).join(', ');
      return `- Equipe: ${team.name} (Total de projetos: ${totalProjects}, Participantes: ${participantsDescription})`;
  }).join('\n');
  
  const lunchDescription = settings.lunchStartTime && settings.lunchEndTime
    ? `das ${settings.lunchStartTime} às ${settings.lunchEndTime}. Este período DEVE ser tratado como um bloco indisponível dentro da janela de horários. É terminantemente PROIBIDO agendar qualquer reunião que se sobreponha a este horário, mesmo que parcialmente.`
    : 'Não há um intervalo de almoço definido. Evite agendar reuniões entre 12:00 e 13:00, se possível.';

  return `
      Você é um assistente especialista em agendamento de reuniões para múltiplas equipes. Com base nos seguintes parâmetros gerais e na lista de equipes, gere uma agenda de reuniões a partir da data de hoje.

      Parâmetros Gerais:
      - Período de Agendamento (Frequência): ${settings.frequency}. Isso significa que todas as reuniões necessárias para cobrir os projetos de cada equipe devem ser agendadas dentro do próximo período: uma semana (semanal), duas semanas (quinzenal) ou um mês (mensal). Se uma equipe precisa de múltiplas reuniões, todas as elas devem ocorrer dentro deste único período. A agenda não deve se repetir ou se estender para além desse período.
      - Dias da semana permitidos: ${settings.days.join(', ')}
      - Horário de início da janela disponível: ${settings.startTime}
      - Horário de fim da janela disponível: ${settings.endTime}
      - Intervalo de almoço: ${lunchDescription}
      - Duração por projeto (minutos): ${settings.projectDuration}
      - Máximo de projetos por reunião: ${settings.maxProjectsPerMeeting}
      - Intervalo mínimo entre reuniões no mesmo dia (minutos): ${settings.breakInterval}

      Equipes para Agendar:
      ${teamsDescription}

      Instruções:
      1. Para cada equipe, verifique o número total de projetos.
      2. Calcule o número de reuniões necessárias para cada equipe dividindo o total de projetos pelo "Máximo de projetos por reunião" e arredondando para cima. Distribua os projetos o mais uniformemente possível entre as reuniões necessárias. Por exemplo, se uma equipe tem 10 projetos e o máximo é 8, o ideal é criar duas reuniões com 5 projetos cada.
      3. Ao atribuir projetos, priorize manter todos os projetos de um mesmo participante dentro da mesma reunião, a menos que seja impossível devido ao limite de projetos.
      4. O título da reunião deve ser o nome da equipe. Se uma equipe precisar de múltiplas reuniões, adicione um sufixo numérico para diferenciá-las (ex: "Equipe Alpha (1/2)" e "Equipe Alpha (2/2)"). Não adicione prefixos como "Sincronização".
      5. **REGRA DE ESPAÇAMENTO OBRIGATÓRIA (MUITO IMPORTANTE):** Se uma equipe tiver múltiplas reuniões (ex: Reunião A (1/2) e Reunião A (2/2)), essas reuniões NUNCA devem ocorrer no mesmo dia.
         - A prioridade máxima é agendá-las em dias diferentes.
         - Se o agendamento for quinzenal ou mensal, a prioridade é agendá-las em semanas diferentes.
         - Esta regra é mais importante do que tentar agrupar todas as reuniões o mais cedo possível. Distribua-as para garantir o espaçamento.
      6. Calcule a duração de cada reunião individualmente com base no número de projetos atribuídos a ela.
      7. **DISTRIBUIÇÃO EQUILIBRADA (REGRA CRÍTICA E OBRIGATÓRIA):** A distribuição das reuniões deve ser o mais equilibrada possível em todos os níveis. Esta é a prioridade máxima do agendamento.
         - **Entre Semanas:** Calcule o número total de reuniões a serem agendadas. Divida esse total pelo número de semanas no período (1 para semanal, 2 para quinzenal, 4 para mensal). O resultado é a meta de reuniões por semana. Por exemplo, 11 reuniões em um período quinzenal devem resultar em 5 ou 6 reuniões na Semana 1 e 5 ou 6 na Semana 2. É INACEITÁVEL agendar 9 reuniões na primeira semana e 2 na segunda.
         - **Entre Dias da Semana:** Dentro de cada semana, distribua as reuniões de forma equilibrada entre os dias disponíveis. Evite concentrar todas as reuniões no início da semana (ex: Segunda e Terça). Utilize todos os dias permitidos.
         - **Dentro do Dia:** Para os dias que tiverem mais de uma reunião, tente agendar uma pela manhã e outra à tarde, se possível, para não sobrecarregar um período do dia.
      8. Respeite a frequência, os dias da semana e a janela de horários para TODAS as reuniões.
      9. **REGRAS DE INTERVALO E ALMOÇO (CRÍTICAS E OBRIGATÓRIAS):** O cumprimento das regras a seguir é mais importante do que qualquer outra otimização de agenda (como agrupar reuniões). Se for necessário para cumprir estas regras, mova as reuniões para outros dias ou semanas.
         - **Intervalo Entre Reuniões:** Deve haver um intervalo mínimo de ${settings.breakInterval} minutos entre o fim de uma reunião e o início da próxima no mesmo dia. Esta regra é ABSOLUTA.
         - **Intervalo de Almoço:** A regra do intervalo de almoço é ainda mais rígida e ABSOLUTA. O período definido para o almoço é um bloco indisponível. Nenhuma reunião pode ser agendada dentro deste período, nem mesmo parcialmente.
      10. A data deve ser no formato AAAA-MM-DD e o horário no formato HH:mm.
      11. Em vez de gerar uma lista de projetos genéricos, o campo 'participantsInfo' deve ser um array de objetos, onde cada objeto contém 'participantName' e 'projectsCount', indicando quantos projetos aquele participante apresentará naquela reunião específica.
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
                projectsCount: { type: Type.NUMBER }
            },
            required: ['participantName', 'projectsCount']
        },
        description: 'Lista de participantes e quantos projetos cada um tem na reunião'
      },
    },
    required: ['id', 'teamName', 'title', 'date', 'startTime', 'endTime', 'participantsInfo'],
  },
};

export const generateSchedule = async (settings: GeneralSettings, teams: Team[]): Promise<Meeting[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

    if (!Array.isArray(schedule)) {
        console.error("A resposta da IA não é um array:", schedule);
        throw new Error("A IA retornou um formato de dados inesperado.");
    }

    const timeRegex = /^\d{2}:\d{2}$/;

    const validatedSchedule = schedule.filter(meeting => {
        if (!meeting || typeof meeting.date !== 'string') {
            console.warn('Filtrando reunião com data ausente ou inválida:', meeting);
            return false;
        }

        const d = new Date(meeting.date);
        if (isNaN(d.getTime())) {
            console.warn('Filtrando reunião com data que não pode ser parseada:', meeting);
            return false;
        }
        
        if (typeof meeting.startTime !== 'string' || !timeRegex.test(meeting.startTime)) {
            console.warn('Filtrando reunião com startTime ausente ou inválido:', meeting);
            return false;
        }
        
        if (typeof meeting.endTime !== 'string' || !timeRegex.test(meeting.endTime)) {
            console.warn('Filtrando reunião com endTime ausente ou inválido:', meeting);
            return false;
        }
        
        const startDateTime = new Date(`${meeting.date}T${meeting.startTime}`);
        if (isNaN(startDateTime.getTime())) {
            console.warn('Filtrando reunião com combinação de data/hora de início inválida:', meeting);
            return false;
        }

        return true;
    });


    return validatedSchedule;
  } catch (error) {
    console.error("Erro ao gerar agenda com Gemini:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes("503") || errorMessage.includes("overloaded") || errorMessage.includes("UNAVAILABLE")) {
      throw new Error(`GEMINI_OVERLOADED: ${errorMessage}`);
    }
    
    throw new Error(`Falha ao gerar a agenda: ${errorMessage}`);
  }
};
