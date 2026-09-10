import { env } from 'cloudflare:workers';
import { notifyOrder, type NotificationEnv } from '@/lib/notifications';
export async function POST(request: Request) {
  return notifyOrder(request, env as unknown as NotificationEnv);
}
