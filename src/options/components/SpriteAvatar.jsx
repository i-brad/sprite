import React from 'react'

// The Sprite mascot as a reusable avatar. `mood` switches between the calm
// branding face and the panicked face used for chaos/explosions. Monochrome
// body with a single neon accent, matching the rest of the app.
export default function SpriteAvatar({ size = 32, mood = 'calm', className = '' }) {
  const panic = mood === 'panic'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* antenna / lit fuse */}
      <path
        d="M32 11 q5 -5 9 -2"
        stroke="#71717a"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="42" cy="7" r="3" fill="#c6ff00" />

      {/* body */}
      <path
        d="M32 12 C19 12 12 22 12 35 L12 52 q0 4 4 3 l4 -3 q2 -1.5 4 0 l4 3 q2 1.5 4 0 l4 -3 q2 -1.5 4 0 l4 3 q4 1 4 -3 L52 35 C52 22 45 12 32 12 Z"
        fill="#0e0e10"
        stroke="#52525a"
        strokeWidth="1.6"
      />

      {/* eyes */}
      <circle cx="25" cy="34" r="5" fill="#f4f4f5" />
      <circle cx="39" cy="34" r="5" fill="#f4f4f5" />
      <circle cx={panic ? 25 : 26} cy={panic ? 35.5 : 34} r="2.2" fill="#050505" />
      <circle cx={panic ? 39 : 40} cy={panic ? 35.5 : 34} r="2.2" fill="#050505" />

      {panic ? (
        <>
          {/* worried brows + open mouth + sweat */}
          <path d="M21 27 l7 3" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" />
          <path d="M43 27 l-7 3" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="32" cy="44" rx="4" ry="3.2" fill="#050505" />
          <path
            d="M48 36 q2 4 0 6 a2.2 2.2 0 0 1 -4 0 q-1 -3 1 -5 z"
            fill="#c6ff00"
            opacity="0.85"
          />
        </>
      ) : (
        /* calm little smile */
        <path
          d="M27 43 q5 4 10 0"
          stroke="#a1a1aa"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      )}
    </svg>
  )
}
