import Image from 'next/image';

/** Editorial photo slot. With `src` it renders the optimised image; without it, the designed placeholder. */
export default function Photo({ caption, src, style, dark, className, sizes = '(max-width: 760px) 100vw, 50vw', priority, position }: { caption: string; src?: string; style?: React.CSSProperties; dark?: boolean; className?: string; sizes?: string; priority?: boolean; position?: string }) {
  if (src) return (
    <div className={'photo-img' + (className ? ' ' + className : '')} style={style}>
      <Image src={src} alt={caption} fill sizes={sizes} priority={priority} style={{ objectFit: 'cover', objectPosition: position || 'center' }} />
    </div>
  );
  return <div className={'photo' + (dark ? ' dark' : '') + (className ? ' ' + className : '')} style={style} role="img" aria-label={caption}><span>{caption}</span></div>;
}
