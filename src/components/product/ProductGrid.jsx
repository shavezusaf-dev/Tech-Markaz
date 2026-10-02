import ProductCard from './ProductCard';
import ProductSkeleton from './ProductSkeleton';

export default function ProductGrid({ products = [], loading, cols = 4 }) {
  const gridCls =
    cols === 2
      ? 'grid-cols-2 md:grid-cols-4 gap-3 md:gap-4'
      : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4';

  if (loading) {
    return (
      <div className={`grid ${gridCls}`}>
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="text-center py-16 text-muted">
        <strong className="block text-ink font-black mb-1.5">No products found</strong>
        <span className="text-[13px]">Try adjusting filters or search.</span>
      </div>
    );
  }

  return (
    <div className={`grid ${gridCls}`}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
