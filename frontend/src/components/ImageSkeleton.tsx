import { useState } from 'react'

interface Props {
  src: string
  alt?: string
  style?: React.CSSProperties
  className?: string
  objectFit?: 'cover' | 'contain'
}

export default function ImageSkeleton({ src, alt = '', style, className, objectFit = 'cover' }: Props) {
  const [loaded, setLoaded] = useState(false)
  return (
    <div style={{ position: 'relative', ...style }} className={className}>
      {!loaded && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, var(--surface, var(--bg3)) 25%, var(--surface-hover, #e0e0e0) 50%, var(--surface, var(--bg3)) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.4s infinite',
          borderRadius: 'inherit',
        }} />
      )}
      <img
        src={src} alt={alt}
        onLoad={() => setLoaded(true)}
        style={{
          display: 'block', width: '100%', height: '100%',
          objectFit, borderRadius: 'inherit',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 200ms',
        }}
      />
    </div>
  )
}
