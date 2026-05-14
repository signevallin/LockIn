import Anthropic from '@anthropic-ai/sdk';
import { adminAuth } from '@/lib/firebase/admin';
import type { CoachContext, CoachMessage } from '@/lib/types';

const client = new Anthropic();

function buildSystemPrompt(ctx: CoachContext): string {
  const goalsList = ctx.goals.length
    ? ctx.goals.map(g => `  - ${g.title}: ${g.progress}% klar, deadline ${new Date(g.deadline).toLocaleDateString('sv-SE')}`).join('\n')
    : '  Inga aktiva mål';

  const promisesList = ctx.promises.length
    ? ctx.promises.map(p => `  - ${p.title}: ${p.daysLeft} dagar kvar, insats ${p.stakeAmount} kr → ${p.charityOrg}`).join('\n')
    : '  Inga aktiva löften';

  const checkInText = ctx.lastCheckIn
    ? `Humör: ${ctx.lastCheckIn.mood}/5. Reflektion: "${ctx.lastCheckIn.reflection || 'ingen reflektion'}"`
    : 'Ingen incheckning idag';

  return `Du är en personlig AI-coach i LockIn-appen. Du är direkt, empatisk men ställer jobbiga följdfrågor. Du håller användaren accountable — ger inte bara beröm. Svarar alltid på svenska. Håll svaren koncisa (max 3-4 meningar).

ANVÄNDARDATA:
- Streak: ${ctx.streak} dagar i rad 🔥
- Totalt XP: ${ctx.totalXp}

AKTIVA MÅL:
${goalsList}

AKTIVA LÖFTEN:
${promisesList}

SENASTE INCHECKNING:
${checkInText}

Ställ konkreta, utmanande följdfrågor. Acceptera inte vaga svar. Om användaren undviker en fråga — ställ den igen.`;
}

export async function POST(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    await adminAuth.verifyIdToken(authHeader.split('Bearer ')[1]);
  } catch {
    return new Response('Invalid token', { status: 401 });
  }

  const { messages, context }: { messages: CoachMessage[]; context: CoachContext } = await req.json();
  const systemPrompt = buildSystemPrompt(context);

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  });

  return new Response(stream.toReadableStream());
}
