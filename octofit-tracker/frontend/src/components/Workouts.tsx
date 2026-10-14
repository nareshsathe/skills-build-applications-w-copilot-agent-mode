import { useEffect, useState, type ReactNode } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = {
  title: string;
  reason?: string;
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getJson<{ suggestions: WorkoutSuggestion[] }>('/api/workouts/suggestions/mona@example.com')
      .then(({ suggestions: results }) => {
        if (!active) return;
        setSuggestions(results ?? []);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setError('Unable to load workout suggestions.');
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
    content = <p role="status">Loading workout suggestions...</p>;
  } else if (suggestions.length === 0) {
    content = <p>No workout suggestions.</p>;
  } else {
    content = (
      <ul>
        {suggestions.map((suggestion, index) => (
          <li key={`${suggestion.title}-${index}`}>
            <strong>{suggestion.title}</strong>
            {suggestion.reason ? <div>{suggestion.reason}</div> : null}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns.">
      {content}
    </CapabilityCard>
  );
}
