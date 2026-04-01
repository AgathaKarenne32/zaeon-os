import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');

        if (!token) return NextResponse.json({ error: 'Token missing' }, { status: 400 });

        // @ts-ignore
        const link = await prisma.classLink.findUnique({
            where: { token },
            include: { teacher: true }
        });

        if (!link) {
            return NextResponse.json({ error: 'Invalid or inactive link' }, { status: 404 });
        }

        return NextResponse.json({
            teacherName: link.teacher.name,
            subject: link.subject,
            room: link.room,
            location: link.location,
            days: link.days,
            hour: link.hour,
            endHour: link.endHour
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

