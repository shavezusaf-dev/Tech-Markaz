export default function RatingStars({ value = 4.5, size = 12, showNumber = true }) {
  const n = parseFloat(value) || 4.5;
  return (
    <span className="inline-flex items-center gap-0.5 text-[#F59E0B]">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= Math.round(n);
        return (
          <svg
            key={i}
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill={filled ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={1.5}
            style={{ display: 'block', flexShrink: 0 }}
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        );
      })}
      {showNumber && (
        <span className="ml-1.5 text-muted font-semibold text-[11.5px] leading-none">
          {n}
        </span>
      )}
    </span>
  );
}
