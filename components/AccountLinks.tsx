'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type Me = { signedIn: boolean; home?: string; label?: string };

export function useMe() {
  const [me, setMe] = useState<Me | null>(null);
  useEffect(() => {
    let live = true;
    fetch('/api/me', { credentials: 'same-origin', cache: 'no-store' }).then((r) => r.json()).catch(() => ({ signedIn: false })).then((m) => live && setMe(m));
    return () => { live = false; };
  }, []);
  return me;
}

/** Header account area: "Sign in" for visitors, a dashboard link and sign out for signed-in users. */
export default function AccountLinks() {
  const me = useMe();
  if (me?.signedIn) return (
    <>
      <Link href={me.home!}>{me.label}</Link>
      <form action="/api/sign-out" method="post" style={{ display: 'inline' }}><button className="linkbtn" style={{ fontSize: 14 }}>Sign out</button></form>
    </>
  );
  return <Link href="/sign-in" style={{ visibility: me ? 'visible' : 'hidden' }}>Sign in</Link>;
}
