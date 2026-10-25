export function ShopMark({ size = 34, tone = "#059669" }: { size?: number; tone?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Hamdan Commission Shop mark">
      {/* bori (sack) silhouette */}
      <path
        d="M25.5 5.5h13c1.1 0 2 .9 2 2v3.2c0 .9-.6 1.7-1.5 1.9l-1.6.4c2.9 2 4.8 5.3 4.8 9.1v33.4c0 5.2-3.6 8.9-8.8 8.9H30c-5.2 0-8.8-3.7-8.8-8.9V22.1c0-3.8 1.9-7.1 4.8-9.1l-1.6-.4c-.9-.2-1.5-1-1.5-1.9V7.5c0-1.1.9-2 2-2z"
        fill={tone}
      />
      {/* tie rope */}
      <path d="M22.6 18.6h18.8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
      {/* monogram H */}
      <path
        d="M26.6 27.4h4.6v7.2h6v-7.2h4.6v17.8h-4.6v-7.5h-6v7.5h-4.6z"
        fill="#fff"
      />
    </svg>
  );
}
