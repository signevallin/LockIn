export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export interface ParsedFood {
  name: string;
  kcalPer100g: number;
  proteinPer100gG: number;
  fatPer100gG: number;
  carbsPer100gG: number;
}

const client = new Anthropic();

export async function POST(req: Request) {
  let body: { description?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { description } = body;
  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    return NextResponse.json({ error: 'Missing description' }, { status: 400 });
  }

  let text: string;
  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `Estimera näringsvärden per 100g för följande måltid som en sammanslagen enhet. Svara ENBART med giltig JSON, inga förklaringar.

Måltid: "${description.trim()}"

Svara med:
{
  "name": "Måltidsnamn på svenska",
  "kcalPer100g": <number>,
  "proteinPer100gG": <number>,
  "fatPer100gG": <number>,
  "carbsPer100gG": <number>
}`,
        },
      ],
    });
    text = message.content[0].type === 'text' ? message.content[0].text.trim() : '';
  } catch {
    return NextResponse.json({ error: 'AI request failed' }, { status: 502 });
  }

  let parsed: ParsedFood;
  try {
    parsed = JSON.parse(text) as ParsedFood;
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
  }

  if (
    typeof parsed.name !== 'string' ||
    typeof parsed.kcalPer100g !== 'number' ||
    typeof parsed.proteinPer100gG !== 'number' ||
    typeof parsed.fatPer100gG !== 'number' ||
    typeof parsed.carbsPer100gG !== 'number'
  ) {
    return NextResponse.json({ error: 'Invalid AI response shape' }, { status: 500 });
  }

  return NextResponse.json(parsed);
}
