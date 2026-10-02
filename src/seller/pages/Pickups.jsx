import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useSeller } from '../contexts/SellerContext';
import { useToast } from '../../contexts/ToastContext';
import Icon from '../../components/ui/Icon';

export default function Pickups() {
  const { isAdmin } = useSeller();
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('pickup_points').select('*').order('created_at', { ascending: false });
      setItems(data || []);
    } catch (e) { toast(e.message, 'err'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="glass-tile rounded-2xl overflow-hidden">
      <div className="relative z-10 px-5 py-4 border-b border-line/60 flex justify-between items-center">
        <div>
          <h3 className="font-black text-[15px]">Drop-off Locations</h3>
          <p className="text-[11.5px] text-muted font-semibold mt-0.5">
            {isAdmin ? 'Locations you\'ve set for sellers' : 'Locations set by admin'} · {loading ? '...' : items.length}
          </p>
        </div>
        <button onClick={load} className="btn-ghost text-xs py-2.5 px-3.5">Refresh</button>
      </div>

      <div className="relative z-10">
        {loading ? (
          <div className="p-4 space-y-2">{[1,2].map(i => <div key={i} className="h-16 rounded-xl bg-surface-2/60 animate-pulse" />)}</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-light text-brand flex items-center justify-center mx-auto mb-3">
              <Icon name="mapPin" size={22} />
            </div>
            <div className="text-[13.5px] font-extrabold text-ink mb-1">No locations</div>
            <div className="text-[12px] text-muted">
              {isAdmin ? 'Add pickup points for your sellers.' : 'Admin has not added any pickup points yet.'}
            </div>
          </div>
        ) : items.map((pp) => (
          <div key={pp.id} className="flex items-center gap-3.5 px-5 py-3.5 border-t border-line/30">
            <span className="w-10 h-10 rounded-xl bg-brand-light text-brand flex items-center justify-center shrink-0">
              <Icon name="mapPin" size={16} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-extrabold text-ink truncate">{pp.name}</div>
              <div className="text-[11.5px] text-muted font-semibold truncate">
                {pp.city ? `${pp.city} · ` : ''}{pp.address}
              </div>
            </div>
            <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase shrink-0 ${
              pp.active ? 'bg-ok/15 text-ok' : 'bg-surface-2 text-muted'
            }`}>
              {pp.active ? 'Active' : 'Off'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
