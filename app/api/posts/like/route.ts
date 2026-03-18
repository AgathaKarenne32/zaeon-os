import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(req: Request) {
    try {
        // 1. Verifica quem está tentando curtir
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        const { postId } = await req.json();
        if (!postId) return NextResponse.json({ error: "ID do sinal obrigatório" }, { status: 400 });

        // 2. Busca o post no banco de dados
        const post = await prisma.post.findUnique({ 
            where: { id: postId } 
        });

        if (!post) return NextResponse.json({ error: "Sinal não encontrado na rede" }, { status: 404 });

        const userEmail = session.user.email;
        const hasLiked = post.likes.includes(userEmail);

        // 3. Lógica do Toggle (Adiciona ou Remove)
        const updatedLikes = hasLiked
            ? post.likes.filter(email => email !== userEmail) // Remove (Unlike)
            : [...post.likes, userEmail]; // Adiciona (Like)

        // 4. Salva a nova lista de corações no MongoDB
        await prisma.post.update({
            where: { id: postId },
            data: { likes: updatedLikes }
        });

        return NextResponse.json({ success: true, likes: updatedLikes });
    } catch (error) {
        console.error("Erro ao processar interação:", error);
        return NextResponse.json({ error: "Falha na Matrix ao registrar interação" }, { status: 500 });
    }
}