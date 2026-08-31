import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic'; // Prevent static caching

export async function GET() {
  try {
    // A simple query to wake up and verify Supabase is active
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const elapsed = Date.now() - start;

    return NextResponse.json({ 
      status: 'ok', 
      message: 'Supabase is awake',
      latency_ms: elapsed 
    });
  } catch (error: any) {
    console.error('Keep-alive ping failed:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Failed to wake Supabase',
      error: error?.message 
    }, { status: 500 });
  }
}
