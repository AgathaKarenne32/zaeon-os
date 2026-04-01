import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const teacher = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!teacher || (teacher.role !== 'teacher' && teacher.role !== 'professor')) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const data = await req.json();
        const { subject, room, location, hour, endHour, days } = data;

        if (!subject || !room || !location || hour == null || endHour == null || !days || days.length === 0) {
            return NextResponse.json({ error: "Todos os campos (Subject, Room, Location, Hour, EndHour, Days) são obrigatórios" }, { status: 400 });
        }

        const token = crypto.randomBytes(16).toString('hex');

        // @ts-ignore
        const classLink = await prisma.classLink.create({
            data: {
                token,
                teacherId: teacher.id,
                subject,
                room,
                location,
                hour,
                endHour,
                days
            }
        });

        // Retorna o link completo, ex: https://dominio.com/join/{token}
        const protocol = req.headers.get('x-forwarded-proto') || 'http';
        const host = req.headers.get('host') || 'localhost:3000';
        const inviteUrl = `${protocol}://${host}/join/${token}`;

        return NextResponse.json({ success: true, inviteUrl, token });
    } catch (error) {
        console.error("Erro ao gerar convite:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
