import { useEffect, useState, type ReactNode } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type ActivityRecord = {
  type: string;
  minutes: number;
  points: number;
};

export default function Activities() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getJson<{ activities: ActivityRecord[] }>('/api/activities')
      .then(({ activities: results }) => {
        if (!active) return;
        setActivities(results ?? []);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setError('Unable to load activities.');
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
    content = <p role="status">Loading activities...</p>;
  } else if (activities.length === 0) {
    content = <p>No activities found.</p>;
  } else {
    content = (
      <ul>
        {activities.map((activity, index) => (
          <li key={`${activity.type}-${activity.minutes}-${index}`}>
            {activity.type} • {activity.minutes} minutes • {activity.points} points
          </li>
        ))}
      </ul>
    );
  }

  return (
    <CapabilityCard title="Activities" description="Track student activity minutes and points.">
      {content}
    </CapabilityCard>
  );
}
