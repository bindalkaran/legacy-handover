'use client';
export default function PrintButton({ label = 'Download PDF', className = 'btn btn-ghost btn-sm' }: { label?: string; className?: string }) {
  return <button className={className} onClick={() => window.print()}>{label}</button>;
}
