import { NextResponse } from 'next/server';
import { checkApiKeys } from '@/lib/aeo/runner-server';

export async function GET() {
  return NextResponse.json(checkApiKeys());
}
