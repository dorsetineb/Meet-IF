
import { GoogleGenAI, Type } from "@google/genai";
import { GeneralSettings, Team, Meeting } from '../types';

const buildPrompt = (settings: GeneralSettings, teams: Team[]): string => {
  const teamsDescription = teams.map(team => {
      if (team.configType === 'projectsOnly') {
          return `- Equipe: ${team.name} (Total de projetos: ${team.totalProjects || 0})`;
      }
      const totalProjects = team.participants.reduce((sum, p) => sum + p.projectsCount, 0);
      const participantsDescription = team.participants.map(p => `${p.name} (${p.projectsCount} projetos)`).join(', ');
      return `- Equipe: ${team.name} (Total de projetos: ${totalProjects}, Participantes: ${participantsDescription})`;
  }).join('\n');
  
  const lunchDescription = settings.lunchStartTime && settings.lunchEndTime
    ? `das ${settings.lunchStartTime} às ${settings.lunchEndTime}`
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

      **REGRAS DE AGENDAMENTO (SEGUIR EM ORDEM DE PRIORIDADE):**

      **PRIORIDADE 1: COBERTURA TOTAL E DIVISÃO LÓGICA DE PROJETOS (NÃO NEGOCIÁVEL)**
      1.1. **COBERTURA TOTAL:** O objetivo mais importante é agendar **TODOS** os projetos de cada equipe. A soma dos projetos em todas as reuniões de uma equipe DEVE ser exatamente igual ao seu número total de projetos. É um erro crítico se algum projeto ficar de fora.
      1.2. **CÁLCULO DE REUNIÕES:** Para cada equipe, calcule o número de reuniões necessárias dividindo o total de projetos pelo "Máximo de projetos por reunião" e arredondando para cima.
      1.3. **DIVISÃO UNIFORME:** Distribua os projetos o mais uniformemente possível entre as reuniões necessárias.
          - **EXEMPLO CRÍTICO:** Se uma equipe tem 32 projetos e precisa de 2 reuniões, a divisão **DEVE** ser 16 projetos em cada. Uma divisão como 20 e 12 é aceitável se for a única forma, mas uma divisão como 31 e 1 é um **ERRO GRAVE E INACEITÁVEL**. A lógica deve prevalecer.

      **PRIORIDADE 2: DISTRIBUIÇÃO EQUILIBRADA (NÃO NEGOCIÁVEL)**
      2.1. O objetivo é criar uma agenda "plana" e equilibrada. Evite concentrar reuniões.
      2.2. **EQUILÍBRIO ENTRE SEMANAS:** Se o período for quinzenal (2 semanas) ou mensal (4 semanas), distribua o número total de reuniões de forma equilibrada entre as semanas. É um **ERRO GRAVE** agendar 90% das reuniões na primeira semana e deixar o resto do período vazio.
      2.3. **EQUILÍBRIO ENTRE DIAS:** Dentro de cada semana, distribua as reuniões de forma equilibrada entre os dias disponíveis. É um **ERRO GRAVE** agendar 4 reuniões na Segunda-feira e deixar Terça e Quarta vazias. Utilize todos os dias permitidos.

      **PRIORIDADE 3: REGRAS DE TEMPO E ESPAÇAMENTO**
      3.1. **ESPAÇAMENTO DE EQUIPES:** Se uma equipe tem múltiplas reuniões (ex: Equipe A (1/2) e Equipe A (2/2)), essas reuniões **NÃO** devem ocorrer no mesmo dia. A única exceção é a divisão por almoço (regra 3.2). Agende-as em dias diferentes e, se possível, em semanas diferentes.
      3.2. **DIVISÃO POR ALMOÇO:** Se uma reunião longa não couber inteiramente antes ou depois do almoço, você **DEVE** dividi-la em duas partes no mesmo dia (uma terminando no início do almoço, outra começando no fim). Esta é a única exceção à regra 3.1.
      3.3. **INTERVALOS:** Respeite o intervalo mínimo entre reuniões no mesmo dia e o bloqueio total do horário de almoço. Estas regras são absolutas.

      **PRIORIDADE 4: FORMATAÇÃO E DETALHES**
      4.1. O título da reunião deve ser o nome da equipe, com sufixo numérico para reuniões múltiplas (ex: "Equipe Alpha (1/2)").
      4.2. A data deve ser no formato AAAA-MM-DD e o horário em HH:mm.
      4.3. Calcule a duração de cada reunião com base no número de projetos nela.
      4.4. O campo 'participantsInfo' deve ser preenchido para equipes com participantes definidos; caso contrário, deve ser um array vazio.
      4.5. O campo 'totalProjectsInMeeting' DEVE ser preenchido para TODAS as reuniões.

      **VERIFICAÇÃO FINAL (OBRIGATÓRIA):**
      - A soma dos projetos em 'totalProjectsInMeeting' para cada equipe corresponde ao total de projetos da equipe?
      - A agenda está visivelmente equilibrada entre dias e semanas?
      - Todas as regras de tempo e espaçamento foram seguidas?
      - O formato da saída está correto?

      O formato de saída deve ser um JSON array de objetos de reunião.
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
      totalProjectsInMeeting: {
          type: Type.NUMBER,
          description: 'O número total de projetos discutidos nesta reunião específica.'
      },
    },
    required: ['id', 'teamName', 'title', 'date', 'startTime', 'endTime', 'participantsInfo', 'totalProjectsInMeeting'],
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
    // Re-lança o erro original para que a camada de UI (App.tsx) possa
    // fazer uma análise mais detalhada e exibir a mensagem correta.
    // Isso evita a classificação incorreta de erros de autenticação como
    // sobrecarga do serviço.
    throw error;
  }
};