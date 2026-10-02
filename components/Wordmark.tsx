import Link from 'next/link';
export default function Wordmark({ size = 26, color, href = '/' }: { size?: number; color?: string; href?: string }) {
  return (
    <Link href={href} className="serif" style={{ fontSize: size, letterSpacing: '-.02em', whiteSpace: 'nowrap', color }}>
      Legacy <em style={{ fontWeight: 300 }}>Handover</em>
    </Link>
  );
}
