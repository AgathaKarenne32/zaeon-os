import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import { redis } from '@/src/lib/redis';

export const dynamic = 'force-dynamic';

const getRoomKey = (id1: string, id2: string) => {
    const sortedIds = [id1, id2].sort();
    return `chat_${sortedIds[0]}_${sortedIds[1]}`;
};

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const { searchParams } = new URL(req.url);
        const targetId = searchParams.get('targetId');
        if (!targetId) return NextResponse.json({ error: "Target missing" }, { status: 400 });

        const roomKey = getRoomKey(user.id, targetId);

        // 🔥 CORREÇÃO DO ERRO 500: Try/Catch para proteger o JSON.parse 🔥
        try {
            const cachedMessages = await redis.get(roomKey);
            if (cachedMessages) {
                const parsed = typeof cachedMessages === 'string' ? JSON.parse(cachedMessages) : cachedMessages;
                if (Array.isArray(parsed)) return NextResponse.json(parsed);
            }
        } catch (cacheError) {
            console.log("Cache Redis vazio ou inválido. Buscando do banco de dados...");
        }

        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: user.id, receiverId: targetId },
                    { senderId: targetId, receiverId: user.id }
                ]
            },
            orderBy: { createdAt: 'asc' },
            take: 100
        });

        await redis.set(roomKey, JSON.stringify(messages), { ex: 15 });

        return NextResponse.json(messages);
    } catch (error) {
        console.error("Erro interno:", error);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { targetId, text } = await req.json();
        if (!targetId || !text) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const newMessage = await prisma.message.create({
            data: {
                senderId: user.id,
                receiverId: targetId,
                text: text
            }
        });

        const roomKey = getRoomKey(user.id, targetId);
        await redis.del(roomKey);

        return NextResponse.json(newMessage);
    } catch (error) {
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}