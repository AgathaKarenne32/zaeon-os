import { NextResponse } from 'next/server';
import { VertexAI } from '@google-cloud/vertexai';
import type { FunctionDeclaration } from '@google-cloud/vertexai';
import Groq from 'groq-sdk';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// --- 1. SCHEDULE TOOL DEFINITION (Function Calling - Gemini) ---
const updateScheduleTool: FunctionDeclaration = {
    name: "update_schedule",
    description: "Adiciona, remove ou atualiza uma aula na agenda acadêmica do aluno.",
    parameters: {
        type: "OBJECT" as any,
        properties: {
            action: { type: "STRING" as any, description: "Ação: 'add', 'remove', ou 'update'." },
            day: { type: "INTEGER" as any, description: "Dia da semana. 1 = Segunda, 2 = Terça, 3 = Quarta, 4 = Quinta, 5 = Sexta." },
            hour: { type: "INTEGER" as any, description: "Hora de início da aula. Formato 24h (ex: 8, 10, 14)." },
            name: { type: "STRING" as any, description: "Nome da disciplina." },
            teacher: { type: "STRING" as any, description: "Nome do professor." },
            room: { type: "STRING" as any, description: "Local ou sala." },
            duration: { type: "INTEGER" as any, description: "Duração da aula em horas. Padrão 2." }
        },
        required: ["action", "day", "hour"]
    }
};

// --- 2. AGENT PERSONAS ---
const AGENT_PERSONAS: Record<string, string> = {
    zenita: `Você é a Sara, assistente acadêmica da Zaeon. Se o usuário pedir para adicionar, apagar ou editar aulas, USE A FERRAMENTA 'update_schedule'. Nunca responda com longos textos para tarefas de agenda.`,

    // UPDATED: Aura is now the Global Orchestrator and PDF Analyst
    aura: `Você é a Aura, a IA Principal e Orquestradora de Pesquisa. Seu papel varia conforme o contexto:
1. Se o usuário estiver perguntando sobre um PDF recém-carregado, responda de forma técnica, clara e direta baseada ESTRITAMENTE no documento.
2. Se você receber um [CONTEXTO GLOBAL DA PESQUISA] nas instruções, atue como uma orientadora. Leia o que foi produzido por outros agentes (Scribe, Examiner, Citações) e use isso para dialogar de forma inteligente. NÃO repita os logs como um robô ("Notei que o Scribe disse..."), mas aja como se você já soubesse de tudo e ofereça novas pautas, conexões de ideias e pontos cegos que o usuário precisa cobrir. Seja propositiva e estratégica.`,

    // UPDATED: Strict ABNT focus, removed APA
    scholar: `Você é o Agente Scholar, Especialista em Citações Acadêmicas. Seu único objetivo é extrair trechos vitais (parágrafos inteiros verbatim) do documento fornecido e gerar as referências ESTRITAMENTE nas normas da ABNT (Associação Brasileira de Normas Técnicas). Formate as saídas exatamente como solicitado pelo usuário, sem introduções longas ou conversas paralelas. Mantenha um tom acadêmico e robótico.`,

    // UPDATED: Better context alignment for Scribe
    scribe: `Você é o Scribe, um Escritor e Revisor Acadêmico Sênior. Sua função é receber os rascunhos ou ideias do usuário e reescrevê-los com precisão, vocabulário formal, tom impessoal e estrutura acadêmica impecável (padrão de artigo científico ou TCC). Se houver um [ACTIVE PROJECT] no contexto, alinhe a escrita aos objetivos desse projeto. Entregue sempre o texto pronto para uso.`,

    // UPDATED: Examiner focused strictly on PDF context
    examiner: `Você é o Examiner, o Inquisidor Acadêmico. Seu papel é testar o conhecimento do usuário. Com base no documento PDF fornecido no contexto, crie perguntas desafiadoras (múltipla escolha ou discursivas curtas). Faça uma pergunta por vez. Quando o usuário responder, avalie criticamente, corrija se necessário e ofereça a próxima pergunta. Seja rigoroso, porém construtivo.`,

    zaeon: `Você é a Zenita, Especialista em criação de documentos. Auxilie na leitura de PDFs e estruture informações para o Fabricator.`
};

export async function POST(req: Request) {
    try {
        const { prompt, agent, systemContext, fileData } = await req.json();
        const agentKey = agent?.toLowerCase() || "aura";
        const persona = AGENT_PERSONAS[agentKey] || AGENT_PERSONAS.aura;

        // =================================================================
        // GROQ ROUTE (HIDDEN / BYPASSED)
        // =================================================================
        if (agentKey === "groq_bypassed") {
            const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

            // Ensures context is passed to Groq as well if it's ever activated
            const groqSystemMessage = persona + (systemContext ? `\n\n[SYSTEM CONTEXT]:\n${systemContext}` : "");

            const completion = await groq.chat.completions.create({
                messages: [{ role: "system", content: groqSystemMessage }, { role: "user", content: prompt }],
                model: "llama-3.3-70b-versatile",
                temperature: 0.6,
            });
            return NextResponse.json({ text: completion.choices[0]?.message?.content });
        }

        // =================================================================
        // GEMINI ROUTE (VERTEX AI) - ACTIVE AND MULTIMODAL
        // =================================================================
        const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS || "{}");
        const vertexAI = new VertexAI({
            project: credentials.project_id || process.env.GOOGLE_PROJECT_ID,
            location: process.env.GOOGLE_LOCATION || 'us-central1',
            googleAuthOptions: { credentials: { client_email: credentials.client_email, private_key: credentials.private_key } }
        });

        // Model Configurations
        const tools = agentKey === "zenita" ? [{ functionDeclarations: [updateScheduleTool] }] : undefined;
        const generativeModel = vertexAI.getGenerativeModel({
            model: 'gemini-2.0-flash-001',
            generationConfig: { temperature: 0.4 },
            tools: tools
        });

        // Assembling content (Text + Base64 PDF if exists)
        const parts: any[] = [];
        if (fileData) {
            parts.push({
                inlineData: { data: fileData, mimeType: "application/pdf" }
            });
        }
        parts.push({ text: prompt });

        // System Instructions (Persona + Global Context)
        let finalSystemInstruction = persona;
        if (systemContext) {
            finalSystemInstruction += `\n\n=== CONTEXTO ADICIONAL FORNECIDO PELO SISTEMA ===\n${systemContext}`;
        }

        const chat = generativeModel.startChat({
            systemInstruction: { role: 'system', parts: [{ text: finalSystemInstruction }] }
        });

        const result = await chat.sendMessage(parts);
        const response = result.response;

        // Check if Gemini triggered the Schedule tool (Zenita)
        const functionCall = response.candidates?.[0]?.content?.parts?.[0]?.functionCall;
        if (functionCall) {
            return NextResponse.json({
                toolCall: { name: functionCall.name, args: functionCall.args },
                text: "Ação de agenda interceptada e processada via UI."
            });
        }

        // Return standard text response
        const textResponse = response.candidates?.[0]?.content?.parts?.[0]?.text || "Sem resposta do núcleo.";
        return NextResponse.json({ text: textResponse });

    } catch (error: any) {
        console.error("Erro na API Neural:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}