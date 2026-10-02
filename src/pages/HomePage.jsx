import { Link } from 'react-router-dom';
import Reveal from '../components/ui/Reveal';
import Icon from '../components/ui/Icon';
import Hero from '../components/home/Hero';
import ServiceRow from '../components/home/ServiceRow';
import CategoryStrip from '../components/home/CategoryStrip';
import FlashSale from '../components/home/FlashSale';
import Vouchers from '../components/home/Vouchers';
import ShowcaseGrid from '../components/home/ShowcaseGrid';
import TrustStrip from '../components/home/TrustStrip';
import ProductGrid from '../components/product/ProductGrid';
import { useProducts } from '../hooks/useProducts';

export default function HomePage() {
  const { products, loading } = useProducts();

  return (
    <>
      <Reveal direction="zoom">
        <Hero />
      </Reveal>

      <Reveal direction="up" delay={80}>
        <ServiceRow />
      </Reveal>

      <Reveal direction="up" delay={120}>
        <CategoryStrip />
      </Reveal>

      <Reveal direction="fade">
        <FlashSale products={products} loading={loading} />
      </Reveal>

      <Reveal direction="left">
        <Vouchers />
      </Reveal>

      <Reveal direction="right">
        <ShowcaseGrid />
      </Reveal>

      <Reveal direction="up">
        <section className="px-[4%] md:px-[5%] py-6 max-w-[1560px] mx-auto w-full">
          <div className="flex justify-between items-end mb-5 flex-wrap gap-3">
            <div>
              <h2 className="text-[18px] md:text-[22px] font-black flex items-center gap-3">
                <span className="w-[5px] h-[18px] md:h-[22px] bg-gradient-to-b from-brand to-accent rounded-full" />
                Featured Products
              </h2>
              <div className="text-[12px] md:text-[13px] text-muted ml-[17px] mt-1">
                Hand-picked from top-rated sellers
              </div>
            </div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-1.5 text-brand font-extrabold text-[13.5px] hover:gap-3 transition-all"
            >
              View All <Icon name="arrowRight" size={14} strokeWidth={2.4} />
            </Link>
          </div>

          <ProductGrid products={products.slice(0, 8)} loading={loading} />
        </section>
      </Reveal>

      <Reveal direction="up" delay={80}>
        <TrustStrip />
      </Reveal>
    </>
  );
}
