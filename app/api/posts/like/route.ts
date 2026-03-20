import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { PrismaClient } from '@prisma/client';
import { redis } from '@/src/lib/redis'; // 🔥 IMPORT DO REDIS ADICIONADO

const prisma = new PrismaClient();

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        const { postId } = await req.json();
        if (!postId) return NextResponse.json({ error: "ID do sinal obrigatório" }, { status: 400 });

        // A busca do post já existia, e ela traz o campo 'room' naturalmente!
        const post = await prisma.post.findUnique({
            where: { id: postId }
        });

        if (!post) return NextResponse.json({ error: "Sinal não encontrado na rede" }, { status: 404 });

        const userEmail = session.user.email;
        const hasLiked = post.likes.includes(userEmail);

        const updatedLikes = hasLiked
            ? post.likes.filter(email => email !== userEmail) // Remove (Unlike)
            : [...post.likes, userEmail]; // Adiciona (Like)

        await prisma.post.update({
            where: { id: postId },
            data: { likes: updatedLikes }
        });

        // 🔥 MODIFICAÇÃO: Limpa o cache da sala após atualizar os likes
        await redis.del(`feed_posts_${post.room}`);

        return NextResponse.json({ success: true, likes: updatedLikes });
    } catch (error) {
        console.error("Erro ao processar interação:", error);
        return NextResponse.json({ error: "Falha na Matrix ao registrar interação" }, { status: 500 });
    }
}