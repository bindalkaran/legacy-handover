export default function Photo({ caption, style, dark, className }: { caption: string; style?: React.CSSProperties; dark?: boolean; className?: string }) {
  return <div className={'photo' + (dark ? ' dark' : '') + (className ? ' ' + className : '')} style={style} role="img" aria-label={caption}><span>{caption}</span></div>;
}
