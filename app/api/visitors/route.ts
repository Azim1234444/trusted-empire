import { env } from 'cloudflare:workers';
import { handleVisitor, type VisitorEnv } from '@/lib/visitors';

export async function POST(request: Request) {
  return handleVisitor(request, env as unknown as VisitorEnv);
}

export async function OPTIONS(request: Request) {
  return handleVisitor(request, env as unknown as VisitorEnv);
}
