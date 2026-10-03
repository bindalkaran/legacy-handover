'use client';
import { useEffect } from 'react';

// Old single-page links used #family, #mbo, #valuation, #prepare. The hash never reaches the server, so map it here.
const MAP: Record<string, string> = { family: 'family-business-succession', mbo: 'management-buyout', valuation: 'business-valuation', prepare: 'preparing-to-step-back' };

export default function Guides() {
  useEffect(() => {
    const slug = MAP[window.location.hash.slice(1)] || MAP.family;
    window.location.replace('/guides/' + slug);
  }, []);
  return <main style={{ padding: 48 }} className="muted">Opening the guide…</main>;
}
