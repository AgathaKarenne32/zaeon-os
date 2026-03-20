import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- PATCH: ACEITAR OU REJEITAR UM PEDIDO DE CONEXÃO ---
export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { requestId, status } = await req.json(); // status deve ser 'ACCEPTED' ou 'REJECTED'

        if (!requestId || !['ACCEPTED', 'REJECTED'].includes(status)) {
            return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // 1. Busca o pedido para validar a segurança
        const connectionReq = await prisma.connectionRequest.findUnique({
            where: { id: requestId }
        });

        if (!connectionReq) {
            return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
        }

        // 2. Trava de Segurança: Apenas quem RECEBEU o pedido pode aceitar ou rejeitar
        if (connectionReq.receiverId !== user.id) {
            return NextResponse.json({ error: "Privilégios insuficientes." }, { status: 403 });
        }

        // 3. Atualiza o status no banco de dados
        const updatedRequest = await prisma.connectionRequest.update({
            where: { id: requestId },
            data: { status: status }
        });

        return NextResponse.json(updatedRequest);
    } catch (error) {
        console.error("Erro na API de Network Respond (PATCH):", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}