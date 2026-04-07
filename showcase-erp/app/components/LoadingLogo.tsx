export default function LoadingLogo({ size = 80 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size * 0.82}
      viewBox="0 0 50 41"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Laden…"
      role="img"
    >
      {/* C shape */}
      <path
        fill="#7fa416"
        d="M31.071,38.476c-2.98,1.572-6.44,2.424-10.057,2.424C9.44,40.9,0,31.744,0,20.53 c0-11.898,10.512-21,22.134-20.403l-0.001,8.924C13.731,9.113,9.134,14.17,9.134,20.501s5.17,11.495,11.509,11.495 c2.922,0,5.597-1.098,7.63-2.902c1.136-1.008,2.073-2.236,2.772-3.59L31.071,38.476L31.071,38.476z"
      />
      {/* T shape */}
      <polygon
        fill="#7fa416"
        points="23.155,0.195 23.155,9.073 32.128,9.073 32.128,40.828 41.181,40.828 41.181,9.209 50,9.209 50,0.2"
      />
      {/* Pulsing dot */}
      <circle cx="21.045" cy="20.539" r="4.876" fill="#7fa416">
        <animate
          attributeName="r"
          values="2.8;4.876;2.8"
          dur="1.2s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.4 0 0.2 1;0.4 0 0.2 1"
        />
        <animate
          attributeName="opacity"
          values="0.4;1;0.4"
          dur="1.2s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.4 0 0.2 1;0.4 0 0.2 1"
        />
      </circle>
    </svg>
  );
}
