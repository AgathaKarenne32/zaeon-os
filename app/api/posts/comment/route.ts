import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- CRIAR COMENTÁRIO ---
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

        const { postId, content } = await req.json();
        if (!postId || !content) return NextResponse.json({ error: "Dados corrompidos" }, { status: 400 });

        const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!dbUser) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

        const newComment = await prisma.comment.create({
            data: {
                content: content,
                user: session.user.name || "Operative",
                postId: postId,
                userId: dbUser.id
            }
        });

        return NextResponse.json({
            id: newComment.id,
            user: newComment.user,
            userEmail: session.user.email, // Devolve o email na mesma hora para a lixeira funcionar já no primeiro segundo
            content: newComment.content,
            createdAt: newComment.createdAt.toISOString()
        });
    } catch (error) {
        return NextResponse.json({ error: "Falha de transmissão na sub-rede" }, { status: 500 });
    }
}

// --- DELETAR COMENTÁRIO (LIXEIRA) ---
export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const commentId = searchParams.get("id");

        if (!commentId) return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });

        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            include: { author: true }
        });

        if (!comment) return NextResponse.json({ error: "Comentário não encontrado" }, { status: 404 });

        // Regra de Ouro: Dono ou Admin
        // @ts-ignore
        const isSuperAdmin = session.user.isAdmin === true;
        const isOwner = comment.author?.email === session.user.email;

        if (!isSuperAdmin && !isOwner) {
            return NextResponse.json({ error: "Privilégios insuficientes" }, { status: 403 });
        }

        await prisma.comment.delete({ where: { id: commentId } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Erro ao apagar comentário:", error);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}