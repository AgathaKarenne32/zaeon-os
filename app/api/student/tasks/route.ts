import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const student = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const { searchParams } = new URL(req.url);
        const subject = searchParams.get('subject');

        if (!subject) return NextResponse.json({ error: "Subject required" }, { status: 400 });

        // Retrieve published documents matching the given subject
        const documents = await prisma.teacherDocument.findMany({
            where: {
                subject: subject,
                status: 'published',
                assignedTo: { has: student.id }
            },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                type: true,
                createdAt: true,
                context: true,
            }
        });

        // O Frontend em ClassesView.tsx mapeia task.content
        // Nosso modelo usa context como snippet/description.
        const mapped = documents.map(d => ({
            id: d.id,
            title: d.title,
            type: d.type,
            createdAt: d.createdAt,
            content: d.context || "Documento da disciplina" 
        }));

        return NextResponse.json(mapped);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
