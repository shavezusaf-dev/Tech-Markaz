import { Link } from 'react-router-dom';
import Brand from '../ui/Brand';

export default function Footer() {
  return (
    <footer className="bg-[#050814] text-white mt-auto border-t-4 border-brand">
      <div className="max-w-[1560px] mx-auto px-[5%] py-14 flex flex-wrap justify-between gap-10">
        <div className="flex-1 min-w-[220px]">
          <div className="mb-4">
            <Brand link={false} />
          </div>
          <p className="text-[#8894AC] text-[13.5px] leading-relaxed">
            Pakistan's leading multi-vendor marketplace for premium electronics,
            appliances, and digital lifestyle products.
          </p>
        </div>

        <div className="flex-1 min-w-[200px]">
          <h3 className="text-[13px] font-extrabold uppercase tracking-[1.2px] mb-4">
            Customer Care
          </h3>
          <ul className="space-y-2.5">
            <li><Link to="/account/orders" className="text-[#8894AC] text-[13px] hover:text-accent transition">Track Your Order</Link></li>
            <li><Link to="/account/settings/returns" className="text-[#8894AC] text-[13px] hover:text-accent transition">Returns & Refunds</Link></li>
            <li><Link to="/support" className="text-[#8894AC] text-[13px] hover:text-accent transition">Help & Support</Link></li>
          </ul>
        </div>

        <div className="flex-1 min-w-[200px]">
          <h3 className="text-[13px] font-extrabold uppercase tracking-[1.2px] mb-4">
            Company
          </h3>
          <ul className="space-y-2.5">
            <li><Link to="/account/settings/about" className="text-[#8894AC] text-[13px] hover:text-accent transition">About Us</Link></li>
            <li><a href="https://seller.tech-markaz.vercel.app" className="text-[#8894AC] text-[13px] hover:text-accent transition">Become a Seller</a></li>
            <li><Link to="/account/settings/terms" className="text-[#8894AC] text-[13px] hover:text-accent transition">Terms of Service</Link></li>
          </ul>
        </div>

        <div className="flex-1 min-w-[240px]">
          <h3 className="text-[13px] font-extrabold uppercase tracking-[1.2px] mb-4">
            Newsletter
          </h3>
          <p className="text-[#8894AC] text-[13.5px] mb-3">
            Subscribe for exclusive deals and product drops.
          </p>
          <div className="flex bg-[#0F1424] border border-[#1E2740] rounded-xl overflow-hidden">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-[13px] text-white"
            />
            <button className="bg-accent text-ink font-extrabold text-[13px] px-5 hover:bg-accent-dark transition">
              Subscribe
            </button>
          </div>
        </div>
      </div>

      <div className="bg-[#030509] py-5 text-center text-[#5C6A88] text-[12.5px] border-t border-[#1E2740]">
        © 2026 Tech Markaz Marketplace · All rights reserved · Made in Pakistan
      </div>
    </footer>
  );
}



