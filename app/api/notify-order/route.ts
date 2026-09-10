import { env } from 'cloudflare:workers';
import { handleNotification, type NotificationEnv } from '@/lib/notifications';
export async function POST(request: Request) {
  return handleNotification(request, env as unknown as NotificationEnv);
}
export async function OPTIONS(request: Request) {
  return handleNotification(request, env as unknown as NotificationEnv);
}
