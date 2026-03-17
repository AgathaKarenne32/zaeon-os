import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        const { image } = await req.json();

        if (!image) {
            return NextResponse.json({ error: "Imagem não fornecida" }, { status: 400 });
        }

        // Salva a nova imagem diretamente no perfil do usuário no MongoDB
        await prisma.user.update({
            where: { email: session.user.email },
            data: { image: image }
        });

        return NextResponse.json({ success: true, message: "Avatar atualizado no Cérebro Central." });
    } catch (error) {
        console.error("Erro ao atualizar avatar:", error);
        return NextResponse.json({ error: "Falha ao sincronizar avatar." }, { status: 500 });
    }
}