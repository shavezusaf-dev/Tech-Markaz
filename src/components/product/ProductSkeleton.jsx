export default function ProductSkeleton() {
  return (
    <div className="bg-surface rounded-2xl border border-line overflow-hidden">
      <div className="aspect-square bg-gradient-to-r from-surface-2 via-line to-surface-2 bg-[length:200%_100%] animate-[shimmer_1.6s_infinite]" />
      <div className="p-4 space-y-3">
        <div className="h-2.5 bg-line rounded w-1/3" />
        <div className="h-3 bg-line rounded w-full" />
        <div className="h-3 bg-line rounded w-2/3" />
        <div className="h-8 bg-line rounded-xl mt-2" />
      </div>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
