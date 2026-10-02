import { useMemo, useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import ProductGrid from '../components/product/ProductGrid';
import { finalPrice } from '../lib/format';
import Icon from '../components/ui/Icon';

const SORTS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'discount', label: 'Biggest Discount' },
];

export default function ShopPage() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || 'All';
  const brandParam = params.get('brand') || '';
  const keyword = params.get('keyword') || '';
  const search = params.get('q') || '';
  const sellerFilter = params.get('seller') || '';

  const { products, loading } = useProducts();

  const [sort, setSort] = useState('newest');
  const [selectedBrands, setSelectedBrands] = useState(brandParam ? [brandParam] : []);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setSelectedBrands(brandParam ? [brandParam] : []);
  }, [brandParam]);

  const availableBrands = useMemo(() => {
    const list = products.filter((p) => {
      if (sellerFilter) return p.seller_id === sellerFilter;
      return category === 'All' ? true : p.category_name === category;
    });
    const set = new Set(list.map((p) => p.brand).filter(Boolean));
    return Array.from(set).sort();
  }, [products, category, sellerFilter]);

  const filtered = useMemo(() => {
    let f = [...products];

    if (sellerFilter) {
      f = f.filter((p) => p.seller_id === sellerFilter);
    } else if (category !== 'All' && category !== 'Search') {
      f = f.filter((p) => p.category_name === category);
    }

    if (keyword) {
      const k = keyword.toLowerCase();
      f = f.filter((p) => (p.title || '').toLowerCase().includes(k));
    }

    if (search) {
      const q = search.toLowerCase();
      f = f.filter(
        (p) =>
          (p.title || '').toLowerCase().includes(q) ||
          (p.brand || '').toLowerCase().includes(q) ||
          (p.category_name || '').toLowerCase().includes(q)
      );
    }

    if (selectedBrands.length) {
      f = f.filter((p) => selectedBrands.includes(p.brand));
    }

    const min = parseFloat(priceMin) || 0;
    const max = parseFloat(priceMax) || Infinity;
    if (min > 0 || max < Infinity) {
      f = f.filter((p) => {
        const fp = finalPrice(p);
        return fp >= min && fp <= max;
      });
    }

    if (sort === 'price-low') f.sort((a, b) => finalPrice(a) - finalPrice(b));
    else if (sort === 'price-high') f.sort((a, b) => finalPrice(b) - finalPrice(a));
    else if (sort === 'discount')
      f.sort((a, b) => (parseFloat(b.discount_percent) || 0) - (parseFloat(a.discount_percent) || 0));

    return f;
  }, [products, category, keyword, search, sellerFilter, selectedBrands, priceMin, priceMax, sort]);

  const toggleBrand = (b) => {
    setSelectedBrands((list) =>
      list.includes(b) ? list.filter((x) => x !== b) : [...list, b]
    );
  };

  const clearAll = () => {
    setSelectedBrands([]);
    setPriceMin('');
    setPriceMax('');
    setParams((p) => {
      p.delete('brand');
      p.delete('keyword');
      p.delete('q');
      return p;
    });
  };

  let title = 'All Products';
  if (search) title = `Results for "${search}"`;
  else if (keyword) title = `${keyword} in ${category}`;
  else if (sellerFilter) title = 'Store Products';
  else if (category !== 'All') title = category;

  const activeFilterCount =
    selectedBrands.length + (priceMin ? 1 : 0) + (priceMax ? 1 : 0);

  return (
    <div className="max-w-[1560px] mx-auto px-[4%] md:px-[5%] py-6 md:py-8">
      <div className="mb-5 flex items-center gap-2 text-[12.5px] font-semibold flex-wrap">
        <Link to="/" className="text-muted hover:text-brand transition">Home</Link>
        <span className="text-muted">/</span>
        <span className="text-ink">{title}</span>
      </div>

      <div className="flex justify-between items-end gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-[22px] md:text-[28px] font-black flex items-center gap-3 mb-1">
            <span className="w-[5px] h-[22px] md:h-[26px] bg-gradient-to-b from-brand to-accent rounded-full" />
            {title}
          </h1>
          <p className="text-[13px] text-muted ml-[17px]">
            {loading
              ? 'Loading...'
              : `${filtered.length} product${filtered.length === 1 ? '' : 's'} found`}
          </p>
        </div>

        <div className="flex gap-2.5 items-center">
          <button
            onClick={() => setFiltersOpen((o) => !o)}
            className="lg:hidden glass-tile rounded-xl px-4 py-2.5 text-[13px] font-extrabold flex items-center gap-2"
          >
            <Icon name="filter" size={15} />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-brand text-white text-[10px] font-black w-[18px] h-[18px] rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="glass-tile rounded-xl flex items-center gap-2 px-3.5 py-2.5 relative">
            <Icon name="sliders" size={15} className="text-muted relative z-10" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="relative z-10 bg-transparent border-none outline-none text-[13px] font-extrabold text-ink cursor-pointer pr-1"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex gap-5 items-start">
        <aside
          className={`${
            filtersOpen ? 'block' : 'hidden'
          } lg:block w-full lg:w-[260px] shrink-0 lg:sticky lg:top-[150px]`}
        >
          <div className="glass-tile rounded-2xl p-5 space-y-6">
            <div className="relative z-10">
              <div className="text-[10.5px] uppercase tracking-[1.2px] font-extrabold text-muted mb-1.5">
                Category
              </div>
              <div className="text-[15px] font-black text-ink">
                {sellerFilter ? 'Store Products' : category === 'All' ? 'All Products' : category}
              </div>
            </div>

            {!sellerFilter && availableBrands.length > 0 && (
              <div className="relative z-10 pt-4 border-t border-line/60">
                <div className="flex justify-between items-center mb-3">
                  <div className="text-[10.5px] uppercase tracking-[1.2px] font-extrabold text-muted">
                    Brands
                  </div>
                  {selectedBrands.length > 0 && (
                    <button
                      onClick={() => setSelectedBrands([])}
                      className="text-[11px] font-extrabold text-brand hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {availableBrands.map((b) => {
                    const checked = selectedBrands.includes(b);
                    return (
                      <label
                        key={b}
                        className="flex items-center gap-2.5 cursor-pointer group py-1"
                      >
                        <span
                          className={`w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center transition-all shrink-0 ${
                            checked
                              ? 'bg-brand border-brand'
                              : 'bg-transparent border-line group-hover:border-brand'
                          }`}
                        >
                          {checked && (
                            <Icon name="check" size={11} color="white" strokeWidth={3.5} />
                          )}
                        </span>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={checked}
                          onChange={() => toggleBrand(b)}
                        />
                        <span className="text-[13px] font-semibold text-ink-2 group-hover:text-brand transition">
                          {b}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="relative z-10 pt-4 border-t border-line/60">
              <div className="text-[10.5px] uppercase tracking-[1.2px] font-extrabold text-muted mb-3">
                Price Range (PKR)
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  placeholder="Min"
                  className="flex-1 min-w-0 bg-surface/60 border border-line rounded-lg px-3 py-2 text-[12.5px] outline-none focus:border-brand focus:ring-2 focus:ring-brand-light/50"
                />
                <input
                  type="number"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  placeholder="Max"
                  className="flex-1 min-w-0 bg-surface/60 border border-line rounded-lg px-3 py-2 text-[12.5px] outline-none focus:border-brand focus:ring-2 focus:ring-brand-light/50"
                />
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={clearAll}
                className="relative z-10 w-full py-2.5 rounded-xl bg-bad/10 text-bad text-[12.5px] font-extrabold hover:bg-bad/20 transition"
              >
                Clear all filters
              </button>
            )}
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <ProductGrid products={filtered} loading={loading} />
        </div>
      </div>
    </div>
  );
}

