import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import redis from "@/backend/src/lib/redis";
import clientPromise from "@/src/lib/db";
import mongoose from "mongoose";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const room = searchParams.get("room") || "lounge";

    try {
        // 1. TENTA BUSCAR NO CACHE (Diferenciando por sala)
        const cacheKey = `feed_cache_${room}`;
        const cachedData = await redis.get(cacheKey);

        if (cachedData) {
            console.log(`🛰️ Telemetria: Dados [${room}] recuperados do Redis`);
            return NextResponse.json(JSON.parse(cachedData));
        }

        // 2. BUSCA NO BANCO
        const posts = await prisma.post.findMany({
            where: { room },
            orderBy: { createdAt: 'desc' },
            include: {
                author: true,
                comments: { orderBy: { createdAt: 'asc' } }
            }
        });

        const formattedPosts = posts.map((post: any) => ({
            id: post.id,
            user: post.user,
            userImage: post.author?.image || post.userImage || null,
            content: post.content,
            room: post.room,
            createdAt: post.createdAt,
            likes: post.likes || [],
            comments: post.comments || []
        }));

        // 3. SALVA NO REDIS
        await redis.set(cacheKey, JSON.stringify(formattedPosts), 'EX', 3600);

        return NextResponse.json(formattedPosts);
    } catch (error) {
        console.error("Erro no GET Feed:", error);
        return NextResponse.json({ error: "Erro ao carregar" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json(
            { error: "⚠️ Transmissão interrompida: Identidade não verificada." },
            { status: 401 }
        );
    }

    try {
        const { content, room } = await req.json();

        // Conexão garantida
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(process.env.MONGODB_URI!);
        }
        const db = mongoose.connection.db;
        if (!db) throw new Error("Database offline");

        // 2. IDENTIDADE DO POST (Pegando direto do NextAuth)
        const newPost = {
            user: session.user.name,
            userImage: session.user.image,
            userEmail: session.user.email,
            content: content,
            room: room || "lounge",
            likes: [],
            createdAt: new Date(),
        };

        await db.collection("Post").insertOne(newPost);

        // 3. SINCRONIZAÇÃO REDIS
        const keys = await redis.keys('feed_cache_*');
        if (keys.length > 0) await redis.del(...keys);

        console.log(`🛰️ Transmissão confirmada para: ${session.user.name}`);

        return NextResponse.json(newPost);
    } catch (error: any) {
        console.error("❌ Erro no POST Feed:", error.message);
        return NextResponse.json({ error: "Falha na rede neural" }, { status: 500 });
    }
}