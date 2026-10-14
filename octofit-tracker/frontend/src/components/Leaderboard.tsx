import { useEffect, useState, type ReactNode } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = {
  teamName: string;
  totalPoints: number;
  rank: number;
};

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then(({ leaderboard: results }) => {
        if (!active) return;
        setEntries(results ?? []);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setError('Unable to load leaderboard.');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  let content: ReactNode;

  if (error) {
    content = <div role="alert">{error}</div>;
  } else if (loading) {
    content = <p role="status">Loading leaderboard...</p>;
  } else if (entries.length === 0) {
    content = <p>No leaderboard found.</p>;
  } else {
    content = (
      <ul>
        {entries.map((entry) => (
          <li key={`${entry.teamName}-${entry.rank}`}>
            {entry.teamName} — {entry.totalPoints} points (rank {entry.rank})
          </li>
        ))}
      </ul>
    );
  }

  return (
    <CapabilityCard title="Leaderboard" description="Compare team point totals.">
      {content}
    </CapabilityCard>
  );
}
