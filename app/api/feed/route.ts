import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import redis from "@/backend/src/lib/redis";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const room = searchParams.get("room") || "lounge";

    const session = await getServerSession(authOptions);
    const currentUserEmail = session?.user?.email || "";

    try {
        const cacheKey = `feed_cache_${room}`;
        const cached = await redis.get(cacheKey);

        if (cached) {
            console.log(`🛰️ REDIS: Cache HIT para [${room}]`);
            return NextResponse.json(JSON.parse(cached));
        }

        const posts = await prisma.post.findMany({
            where: { room: room },
            orderBy: { createdAt: 'desc' },
            include: {
                comments: { orderBy: { createdAt: 'asc' } },
                author: true
            }
        });

        const formattedPosts = posts.map((post: any) => ({
            id: post.id,
            user: post.user,
            userImage: post.author?.image || null,
            content: post.content,
            room: post.room,
            createdAt: post.createdAt,
            likes: post.likes || [],
            isLiked: (post.likes || []).includes(currentUserEmail),
            comments: post.comments.map((c: any) => ({
                id: c.id,
                user: c.user,
                content: c.content,
                createdAt: c.createdAt
            }))
        }));

        // Cache de 60 segundos 
        await redis.set(cacheKey, JSON.stringify(formattedPosts), 'EX', 60);

        return NextResponse.json(formattedPosts);
    } catch (error: any) {
        console.error("❌ Erro no GET Feed:", error.message);
        return NextResponse.json({ error: "Erro ao carregar feed" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    try {
        const { content, room } = await req.json();
        const activeRoom = room || "lounge";

        const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        const newPost = await prisma.post.create({
            data: {
                user: session.user.name || "Agente",
                content: content,
                userId: dbUser?.id,
                room: activeRoom,
                likes: []
            }
        });

        // ♻️ Invalida o cache específico da sala
        await redis.del(`feed_cache_${activeRoom}`);

        return NextResponse.json(newPost);
    } catch (error: any) {
        console.error("❌ Erro no POST Feed:", error.message);
        return NextResponse.json({ error: "Erro ao postar" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID necessário" }, { status: 400 });

    try {
        const post = await prisma.post.findUnique({ where: { id } });

        if (!post || post.user !== session.user?.name) {
            return NextResponse.json({ error: "Proibido" }, { status: 403 });
        }

        await prisma.post.delete({ where: { id } });

        // ♻️ Limpa o cache para o post sumir da tela de todos
        await redis.del(`feed_cache_${post.room}`);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: "Erro ao deletar" }, { status: 500 });
    }
}