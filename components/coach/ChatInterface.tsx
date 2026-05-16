'use client';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import type { CoachMessage, CoachContext } from '@/lib/types';

interface Props {
  context: CoachContext;
  getIdToken: () => Promise<string>;
}

export function ChatInterface({ context, getIdToken }: Props) {
  const [messages, setMessages] = useState<CoachMessage[]>([
    {
      role: 'assistant',
      content: `Hej! Jag är din personliga coach. Du har ${context.streak} dagars streak 🔥 och ${context.goals.length} aktiva mål. ${context.goals.length > 0 ? `Hur går det med "${context.goals[0].title}"?` : 'Vad jobbar du mot just nu?'}`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg: CoachMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const token = await getIdToken();
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: newMessages, context }),
      });

      if (!res.ok || !res.body) { return; }

      const assistantMsg: CoachMessage = { role: 'assistant', content: '' };
      setMessages(prev => [...prev, assistantMsg]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'content_block_delta' && data.delta?.text) {
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: updated[updated.length - 1].content + data.delta.text,
                };
                return updated;
              });
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-earth text-cream rounded-br-sm' : 'bg-sky text-earth shadow-sm rounded-bl-sm'}`}>
              {msg.content || <span className="animate-pulse">...</span>}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 pt-3 border-t border-cream-dark">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Skriv ett meddelande..."
          disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-xl border border-sage bg-white text-earth text-sm focus:outline-none focus:border-earth disabled:opacity-50"
        />
        <Button onClick={sendMessage} disabled={loading || !input.trim()} size="sm">
          Skicka
        </Button>
      </div>
    </div>
  );
}
