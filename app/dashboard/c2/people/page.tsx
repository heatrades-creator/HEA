'use client';

import { useEffect, useState } from 'react';
import PeopleTable from '@/components/dashboard/c2/PeopleTable';
import { getCached, setCached } from '@/lib/c2Cache';

export default function PeoplePage() {
  const [people, setPeople] = useState<unknown[]>(() => getCached('people') ?? []);
  const [loading, setLoading] = useState(!getCached('people'));

  useEffect(() => {
    if (getCached('people')) return; // already cached — no fetch needed
    fetch('/api/c2/people')
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setCached('people', list);
        setPeople(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-6 max-w-5xl mx-auto animate-pulse">
      <div className="mb-6">
        <div className="h-6 w-24 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-40 bg-gray-100 rounded" />
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <div className="h-4 w-40 bg-gray-200 rounded" />
            <div className="flex gap-2"><div className="h-5 w-20 bg-gray-200 rounded-full" /><div className="h-5 w-14 bg-gray-200 rounded-full" /></div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[#111827] text-xl font-semibold">People</h1>
        <p className="text-[#6b7280] text-sm mt-0.5">
          {people.length > 0 ? `${people.length} personnel record${people.length !== 1 ? 's' : ''}` : 'All HEA personnel'}
        </p>
      </div>
      <PeopleTable initialPeople={people} />
    </div>
  );
}
