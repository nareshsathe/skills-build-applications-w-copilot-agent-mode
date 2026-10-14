import { useEffect, useState, type ReactNode } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type TeamRecord = {
  name: string;
  members: string[];
};

export default function Teams() {
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getJson<{ teams: TeamRecord[] }>('/api/teams')
      .then(({ teams: results }) => {
        if (!active) return;
        setTeams(results ?? []);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setError('Unable to load teams.');
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
    content = <p role="status">Loading teams...</p>;
  } else if (teams.length === 0) {
    content = <p>No teams found.</p>;
  } else {
    content = (
      <ul>
        {teams.map((team, index) => (
          <li key={`${team.name}-${index}`}>
            {team.name} ({team.members.length} member{team.members.length === 1 ? '' : 's'})
          </li>
        ))}
      </ul>
    );
  }

  return (
    <CapabilityCard title="Teams" description="Manage teams and members.">
      {content}
    </CapabilityCard>
  );
}
