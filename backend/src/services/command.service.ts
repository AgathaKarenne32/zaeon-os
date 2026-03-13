import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class CommandService {
    // comandos para refletir a utilidade acadêmica
    private readonly availableCommands = [
        'post', 'find', 'agenda', 'bib', 'stats',
        'whoami', 'rooms', 'help', 'clear'
    ];

    async execute(input: string, userId: string) {
        if (!input.startsWith('/')) {
            return { error: "Comandos devem começar com /" };
        }

        const parts = input.slice(1).split(' ');
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);

        switch (command) {
            case 'whoami':
                try {
                    const user = await prisma.user.findUnique({
                        where: { id: userId.length === 24 ? userId : undefined }
                    });

                    if (!user) {
                        return {
                            message: "⚠️ Perfil não encontrado no banco.",
                            dica: "Certifique-se de que você está logado ou use um ID válido."
                        };
                    }

                    return {
                        message: "📋 Registro Acadêmico",
                        nome: user.name,
                        status: "Estudante Ativo"
                    };
                } catch (e) {
                    return { error: "Erro ao consultar banco de dados." };
                }

            case 'find':
                const query = args.join(' ');
                if (!query) return { error: "O que deseja buscar? Ex: /find Anatomia" };

                // Busca em salas e posts simultaneamente
                const [matchedRooms, matchedPosts] = await Promise.all([
                    prisma.room.findMany({
                        where: { name: { contains: query, mode: 'insensitive' } },
                        take: 3
                    }),
                    prisma.post.findMany({
                        where: { content: { contains: query, mode: 'insensitive' } },
                        take: 3
                    })
                ]);

                return {
                    message: `🔍 Resultados para: ${query}`,
                    salas: matchedRooms.map(r => r.name),
                    mencao_em_posts: matchedPosts.length
                };

            case 'agenda':
                // Mock de agenda - em breve vindo do banco/integração
                return {
                    message: "📅 Cronograma de Hoje",
                    eventos: [
                        "08:30 - Aula Magna (Auditório Central)",
                        "14:00 - Grupo de Estudo Interdisciplinar",
                        "Sem provas marcadas para hoje."
                    ]
                };

            case 'bib':
            case 'biblioteca':
                return {
                    message: "📚 Portal da Biblioteca",
                    servicos: ["Consultar Acervo", "Renovar Livro", "Espaços de Estudo"],
                    status: "Acesse: library.zaeon.edu"
                };

            case 'post':
                const content = args.join(' ');
                if (!content) return { error: "Uso: /post <mensagem>" };

                try {
                    // 1. Validar se o ID do usuário é um formato válido
                    const isValidObjectId = userId.length === 24 && /^[0-9a-fA-F]+$/.test(userId);
                    if (!isValidObjectId) {
                        return { error: "ID de usuário inválido para postagem autenticada." };
                    }

                    // 2. Buscar o usuário e a sala geral simultaneamente
                    const [userData, targetRoom] = await Promise.all([
                        prisma.user.findUnique({ where: { id: userId } }),
                        prisma.room.findUnique({ where: { slug: "geral" } })
                    ]);

                    if (!userData) return { error: "Usuário não encontrado. Você precisa estar logado." };
                    if (!targetRoom) return { error: "Sala 'geral' não configurada no sistema." };

                    // 3. Criar o post 
                    const newPost = await prisma.post.create({
                        data: {
                            content: content,
                            user: userData.name || "Membro", 
                            userImage: userData.image,       
                            // Relacionamentos Obrigatórios 
                            author: { connect: { id: userId } },
                            room: { connect: { id: targetRoom.id } }
                        }
                    });

                    return {
                        status: "success",
                        message: "Postagem realizada no feed global!",
                        id: newPost.id
                    };

                } catch (e) {
                    console.error("ERRO CRÍTICO NO POST:", e);
                    return { error: "Falha interna ao salvar postagem no banco." };
                }

            case 'stats':
                const [uCount, pCount, rCount] = await Promise.all([
                    prisma.user.count(),
                    prisma.post.count(),
                    prisma.room.count()
                ]);
                return {
                    message: "📊 Estatísticas do Campus Digital",
                    usuarios_ativos: uCount,
                    total_interacoes: pCount,
                    comunidades: rCount,
                    status: "Sistema Estável"
                };

            case 'rooms':
                const rooms = await prisma.room.findMany({ select: { name: true, slug: true }, take: 10 });
                return { message: "🏫 Salas e Comunidades:", list: rooms.map(r => r.name) };

            case 'help':
                return {
                    message: "Zaeon CLI - Comandos Acadêmicos",
                    commands: this.availableCommands.map(c => `/${c}`)
                };

            case 'clear':
                return { action: "clear_terminal" };

            case 'echo':
                return { message: args.join(' ') };

            default:
                const suggestion = this.availableCommands.find(c => c.startsWith(command.slice(0, 2)));
                return {
                    error: `Comando '/${command}' não reconhecido.`,
                    suggestion: suggestion ? `Você quis dizer /${suggestion}?` : "Digite /help para ver as opções."
                };
        }
    }
}

export const commandService = new CommandService();