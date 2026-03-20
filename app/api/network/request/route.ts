import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';

// --- GET: BUSCAR STATUS DA CONEXÃO OU PEDIDOS PENDENTES ---
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const { searchParams } = new URL(req.url);
        const targetId = searchParams.get('targetId');

        if (targetId) {
            // CENÁRIO A: Você está visitando o perfil de alguém e quer saber o status da conexão
            const reqStatus = await prisma.connectionRequest.findFirst({
                where: {
                    OR: [
                        { senderId: user.id, receiverId: targetId },
                        { senderId: targetId, receiverId: user.id } // Checa se ele já te mandou também
                    ]
                },
                orderBy: { createdAt: 'desc' }
            });

            // Retorna o status encontrado ou 'NONE' se nunca conversaram
            return NextResponse.json(reqStatus || { status: 'NONE' });

        } else {
            // CENÁRIO B: O Widget do Chat (Polling) buscando convites que enviaram para você
            const pendingRequests = await prisma.connectionRequest.findMany({
                where: {
                    receiverId: user.id,
                    status: 'PENDING'
                },
                include: {
                    sender: { select: { name: true, image: true } }
                },
                orderBy: { createdAt: 'asc' } // Os mais antigos primeiro
            });

            return NextResponse.json(pendingRequests);
        }
    } catch (error) {
        console.error("Erro na API de Network (GET):", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// --- POST: ENVIAR UM NOVO PEDIDO DE CONEXÃO ---
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { targetId, message } = await req.json();

        if (!targetId || !message) {
            return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Proteção contra Spam: Checa se já existe um pedido pendente ou aceito
        const existingRequest = await prisma.connectionRequest.findFirst({
            where: {
                OR: [
                    { senderId: user.id, receiverId: targetId },
                    { senderId: targetId, receiverId: user.id }
                ],
                status: { in: ['PENDING', 'ACCEPTED'] }
            }
        });

        if (existingRequest) {
            return NextResponse.json({ error: "Já existe uma conexão ou pedido ativo." }, { status: 400 });
        }

        // Cria o novo pedido no banco
        const newReq = await prisma.connectionRequest.create({
            data: {
                senderId: user.id,
                receiverId: targetId,
                message: message,
                status: 'PENDING'
            }
        });

        return NextResponse.json(newReq);
    } catch (error) {
        console.error("Erro na API de Network (POST):", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}