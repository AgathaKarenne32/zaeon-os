import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

// --- FUNÇÃO AUXILIAR PARA FORMATAR A DATA ---
// Transforma o createdAt do banco em "18 Mar 2026" para o Front-end
const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
    }).replace(' de ', ' ').replace('.', '');
};

// 1. LER AS FOTOS (GET)
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const visitedUserId = searchParams.get("userId");

        let targetUserId;

        // Se passamos um userId na URL, buscamos as fotos dele. Senão, buscamos as nossas.
        if (visitedUserId) {
            targetUserId = visitedUserId;
        } else {
            const user = await prisma.user.findUnique({ where: { email: session.user.email } });
            if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
            targetUserId = user.id;
        }

        const photos = await prisma.personalPhoto.findMany({
            where: { userId: targetUserId },
            orderBy: { createdAt: "desc" },
        });

        const formattedPhotos = photos.map(photo => ({
            id: photo.id,
            title: photo.title,
            subtitle: photo.subtitle,
            image: photo.image,
            date: formatDate(photo.createdAt)
        }));

        return NextResponse.json(formattedPhotos);
    } catch (error) {
        console.error("Erro no GET:", error);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}

// 2. ADICIONAR NOVA FOTO (POST)
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const { title, subtitle, image } = await req.json();
        
        if (!title || !image) {
            return NextResponse.json({ error: "title and image are required" }, { status: 400 });
        }

        const photo = await prisma.personalPhoto.create({
            data: {
                userId: user.id,
                title,
                subtitle: subtitle ?? "",
                image,
            },
        });

        // Devolve a foto criada já com a data formatada para a "UI Otimista" não bugar
        return NextResponse.json({
            id: photo.id,
            title: photo.title,
            subtitle: photo.subtitle,
            image: photo.image,
            date: formatDate(photo.createdAt)
        });
    } catch (error) {
        console.error("Erro no POST:", error);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}

// 3. EDITAR FOTO EXISTENTE (PATCH)
export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id, title, subtitle } = await req.json();

        if (!id || !title) {
            return NextResponse.json({ error: "ID e Título são obrigatórios" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        const photo = await prisma.personalPhoto.findUnique({ where: { id } });

        // Trava de Segurança: Só o dono da foto pode editá-la
        if (!photo || photo.userId !== user?.id) {
            return NextResponse.json({ error: "Foto não encontrada ou sem permissão" }, { status: 403 });
        }

        const updatedPhoto = await prisma.personalPhoto.update({
            where: { id },
            data: { title, subtitle }
        });

        return NextResponse.json(updatedPhoto);
    } catch (error) {
        console.error("Erro ao atualizar foto:", error);
        return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
    }
}

// 4. APAGAR FOTO (DELETE)
export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // CORREÇÃO: Pega o ID da URL (?id=...) e não do req.json()
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID da foto não fornecido" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        const photo = await prisma.personalPhoto.findUnique({ where: { id } });

        // Trava de Segurança: Só o dono da foto pode apagá-la
        if (!photo || photo.userId !== user?.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await prisma.personalPhoto.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Erro no DELETE:", error);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}