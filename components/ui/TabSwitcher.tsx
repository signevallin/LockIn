'use client';
import { motion } from 'framer-motion';

interface Tab<T extends string> {
  key: T;
  label: string;
}

interface Props<T extends string> {
  tabs: Tab<T>[];
  active: T;
  onChange: (key: T) => void;
}

export function TabSwitcher<T extends string>({ tabs, active, onChange }: Props<T>) {
  return (
    <div
      className="flex p-1 rounded-2xl"
      style={{ gap: 2, border: '1.5px solid #c4a882' }}
    >
      {tabs.map(tab => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className="relative flex-1 py-2 text-sm font-medium rounded-xl transition-colors duration-150 z-10"
            style={{
              color: isActive ? '#FCE6B7' : '#7a5c54',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {isActive && (
              <motion.span
                layoutId="tab-pill"
                className="absolute inset-0 rounded-xl"
                style={{ background: '#513229' }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
