'use client';

import { Eye, Trophy, XCircle, AlertCircle } from 'lucide-react';

interface KPICardsProps {
  stats: {
    total_watching: number;
    won: number;
    lost: number;
    outbid: number;
  };
}

export function KPICards({ stats }: KPICardsProps) {
  const cards = [
    {
      label: 'Watching',
      value: stats.total_watching,
      icon: Eye,
      color: 'text-blue-500',
    },
    {
      label: 'Won',
      value: stats.won,
      icon: Trophy,
      color: 'text-green-500',
    },
    {
      label: 'Lost',
      value: stats.lost,
      icon: XCircle,
      color: 'text-red-500',
    },
    {
      label: 'Outbid Alerts',
      value: stats.outbid,
      icon: AlertCircle,
      color: 'text-yellow-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-card border border-border rounded-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  {card.label}
                </p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {card.value}
                </p>
              </div>
              <Icon className={`${card.color} opacity-20`} size={40} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
