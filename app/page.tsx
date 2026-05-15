import Link from 'next/link';

const FEATURES = [
  { icon: '🎯', title: 'Sätt mål', desc: 'Bryt ner dina drömmar till konkreta steg.' },
  { icon: '🔒', title: 'Håll löften', desc: 'Lägg pengar på spel. Hedersbaserat.' },
  { icon: '⏱', title: 'Fokusera', desc: 'Minimera distraktioner och maximera din tid.' },
  { icon: '🤖', title: 'AI-coach', desc: 'En coach som ställer de jobbiga frågorna.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-md mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img
              src="/lockin-logo-on-bay.svg"
              alt="LockIn"
              className="w-64 h-auto rounded-2xl shadow-md"
            />
          </div>
          <p className="text-earth-light text-sm max-w-xs mx-auto">
            Den ultimata appen för att sätta mål, bygga vanor och hålla dig accountable — varje dag.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-10">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-white rounded-2xl p-4 shadow-sm">
              <span className="text-2xl mb-2 block">{f.icon}</span>
              <h3 className="font-semibold text-earth text-sm mb-1">{f.title}</h3>
              <p className="text-earth-light text-xs">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <Link
            href="/login"
            className="block w-full bg-earth text-cream text-center py-3.5 rounded-2xl font-semibold text-base hover:opacity-90 transition-opacity"
          >
            Kom igång gratis
          </Link>
          <p className="text-center text-xs text-earth-light">
            Discipline today, freedom tomorrow.
          </p>
        </div>

        <div className="mt-12 p-4 bg-bay rounded-2xl text-center">
          <p className="text-earth text-sm italic">&quot;Discipline is choosing between what you want now and what you want most.&quot;</p>
        </div>
      </div>
    </div>
  );
}
