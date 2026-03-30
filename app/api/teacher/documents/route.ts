import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';

export const dynamic = 'force-dynamic';

// GET: Lista documentos do professor (filtrado por tipo)
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const teacher = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!teacher || (teacher.role !== 'teacher' && teacher.role !== 'professor')) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type'); // 'tarefa' | 'prova'

        const documents = await prisma.teacherDocument.findMany({
            where: {
                teacherId: teacher.id,
                ...(type ? { type } : {}),
            },
            orderBy: { updatedAt: 'desc' },
            select: {
                id: true,
                title: true,
                type: true,
                subject: true,
                status: true,
                questions: true,
                headerImage: true,
                assignedTo: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        return NextResponse.json(documents);
    } catch (error) {
        console.error("Error listing documents:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Cria um novo documento
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const teacher = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!teacher || (teacher.role !== 'teacher' && teacher.role !== 'professor')) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { title, type, subject, questions, headerImage, context } = await req.json();

        if (!title || !type || !questions) {
            return NextResponse.json({ error: "title, type, and questions are required" }, { status: 400 });
        }

        const doc = await prisma.teacherDocument.create({
            data: {
                teacherId: teacher.id,
                title,
                type,
                subject: subject || null,
                questions,
                headerImage: headerImage || null,
                context: context || null,
            }
        });

        return NextResponse.json({ success: true, document: doc });
    } catch (error) {
        console.error("Error creating document:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// PATCH: Atualiza um documento existente (questões, título, header, assign, status)
export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const teacher = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!teacher || (teacher.role !== 'teacher' && teacher.role !== 'professor')) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { documentId, title, questions, headerImage, status, assignedTo } = await req.json();

        if (!documentId) {
            return NextResponse.json({ error: "documentId is required" }, { status: 400 });
        }

        // Verify ownership
        const existing = await prisma.teacherDocument.findFirst({
            where: { id: documentId, teacherId: teacher.id }
        });

        if (!existing) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (questions !== undefined) updateData.questions = questions;
        if (headerImage !== undefined) updateData.headerImage = headerImage;
        if (status !== undefined) updateData.status = status;
        if (assignedTo !== undefined) updateData.assignedTo = assignedTo;

        const updated = await prisma.teacherDocument.update({
            where: { id: documentId },
            data: updateData,
        });

        return NextResponse.json({ success: true, document: updated });
    } catch (error) {
        console.error("Error updating document:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE: Remove um documento
export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const teacher = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!teacher || (teacher.role !== 'teacher' && teacher.role !== 'professor')) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const documentId = searchParams.get('id');

        if (!documentId) {
            return NextResponse.json({ error: "id is required" }, { status: 400 });
        }

        // Verify ownership
        const existing = await prisma.teacherDocument.findFirst({
            where: { id: documentId, teacherId: teacher.id }
        });

        if (!existing) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        await prisma.teacherDocument.delete({ where: { id: documentId } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting document:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
