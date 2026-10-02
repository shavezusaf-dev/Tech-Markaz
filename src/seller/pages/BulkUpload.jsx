import { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';
import { useSeller } from '../contexts/SellerContext';
import { useToast } from '../../contexts/ToastContext';
import { fmt } from '../../lib/format';
import Icon from '../../components/ui/Icon';

// Strip BOM + lowercase + remove "(...)" suffixes like (PKR), (Optional)
const normalizeKey = (k) =>
  String(k || '')
    .replace(/^\uFEFF/, '')
    .toLowerCase()
    .trim()
    .replace(/\s*\([^)]*\)\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim();

// Spec columns we want to pull from the CSV into the `specs` JSON object
const SPEC_COLUMNS = [
  'display size', 'display resolution', 'display type', 'refresh rate',
  'processor', 'ram', 'rom', 'battery capacity',
  'main camera', 'front camera', 'bluetooth version',
  'nfc', 'pta approved', 'charging port',
  'screen size', 'panel type', 'smart os', 'hdmi ports',
  'driver size', 'battery life', 'noise cancellation',
  'water resistance', 'brightness', 'throw ratio', 'lamp life',
  'capacity', 'type', 'energy rating', 'spin speed',
];

export default function BulkUpload() {
  const { user, isAdmin } = useSeller();
  const { toast } = useToast();
  const [pending, setPending] = useState([]);
  const [busy, setBusy] = useState(false);

  const downloadTemplate = () => {
    const headers = [
      'Brand', 'Category', 'Subcategory', 'Product Name', 'Description',
      'Regular Price (PKR)', 'Sale Price (PKR)', 'Stock',
      'Display Size', 'Display Resolution', 'Processor', 'RAM', 'ROM',
      'Battery Capacity', 'Main Camera', 'Front Camera',
      'Bluetooth Version', 'NFC', 'PTA Approved', 'Charging Port',
      'Image URL 1', 'Image URL 2', 'Image URL 3',
    ];
    const sample = [[
      'Samsung', 'Smartphone', 'Smartphones', 'Galaxy A55',
      'Flagship-killer mid-ranger',
      149999, 139999, 20,
      '6.6 inches', '1080 x 2340', 'Exynos 1480', '8GB', '256GB',
      '5000mAh', '50MP', '32MP', 'Yes', 'Yes', 'Yes', 'Type-C',
      'https://example.com/img1.jpg', '', '',
    ]];
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sample]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, 'TechMarkaz_Template.xlsx');
  };

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try {
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(new Uint8Array(buf), { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });

      const valid = [];
      let skipped = 0;

      raw.forEach((r) => {
        const n = {};
        Object.keys(r).forEach((k) => { n[normalizeKey(k)] = r[k]; });

        const title = String(n['product name'] || n['title'] || n['name'] || '').trim();
        if (!title) { skipped++; return; }

        // Category: prefer "category" but fall back to "subcategory"
        const category =
          String(n['category'] || n['subcategory'] || n['cat'] || '').trim() || 'Smartphone';

        // Price resolution (robust)
        const saleRaw = n['sale price'] ?? n['sale'] ?? n['price'];
        const regRaw = n['regular price'] ?? n['regular'] ?? n['price'];
        const parseNum = (v) =>
          parseFloat(String(v || '').replace(/[^0-9.]/g, '')) || 0;
        const sale = parseNum(saleRaw);
        const regular = parseNum(regRaw);
        const price = sale > 0 ? sale : regular;
        if (price <= 0) { skipped++; return; }

        let disc = 0;
        if (regular > 0 && sale > 0 && regular > sale) {
          disc = Math.round(((regular - sale) / regular) * 100);
        }

        const stock = parseInt(String(n['stock'] || 1).replace(/[^0-9-]/g, ''), 10) || 1;
        const brand = String(n['brand'] || '').trim();
        const desc = String(n['description'] || '').trim();

        // Images — up to 10
        const images = [];
        for (let i = 1; i <= 10; i++) {
          const u = n[`image url ${i}`] || n[`image ${i}`] || n[`image${i}`];
          if (u && /^https?:\/\//i.test(String(u).trim())) images.push(String(u).trim());
        }

        // Specs — collect any SPEC_COLUMNS found in the row
        const specs = {};
        SPEC_COLUMNS.forEach((col) => {
          const v = n[col];
          if (v !== undefined && v !== null && String(v).trim() !== '') {
            // Title-case the key for display
            const label = col.replace(/\b\w/g, (c) => c.toUpperCase());
            specs[label] = String(v).trim();
          }
        });

        valid.push({
          seller_id: isAdmin ? null : user.id,
          title: title.slice(0, 220),
          category_name: category,
          brand: brand || null,
          description: desc || null,
          price,
          discount_percent: disc,
          stock_count: stock,
          images: images.length ? images : ['https://via.placeholder.com/600x400'],
          specs: Object.keys(specs).length ? specs : null,
          status: 'active',
        });
      });

      setPending(valid);
      if (!valid.length) {
        toast(`No valid rows (skipped ${skipped}). Check that price columns have numbers.`, 'warn');
      } else {
        toast(`${valid.length} products ready${skipped ? `, ${skipped} skipped` : ''}`, 'ok');
      }
    } catch (err) {
      toast('Parse failed: ' + err.message, 'err');
      console.error(err);
    }
  };

  const upload = async () => {
    if (!pending.length) return;
    setBusy(true);
    let ok = 0, fail = 0;
    for (const p of pending) {
      const { error } = await supabase.from('products').insert([p]);
      if (error) {
        console.error('[bulk] insert failed:', error, p);
        fail++;
      } else ok++;
    }
    setBusy(false);
    toast(`${ok} uploaded${fail ? ` · ${fail} failed` : ''}`, fail ? 'warn' : 'ok');
    setPending([]);
  };

  return (
    <div className="space-y-5">
      <div className="glass-tile rounded-2xl overflow-hidden">
        <div className="relative z-10 px-5 py-4 border-b border-line/60 flex justify-between items-center">
          <div>
            <h3 className="font-black text-[15px]">Bulk Import</h3>
            <p className="text-[11.5px] text-muted font-semibold mt-0.5">Upload Excel or CSV</p>
          </div>
          <button onClick={downloadTemplate} className="btn-glass">
            <Icon name="upload" size={13} />
            Download Template
          </button>
        </div>

        <div className="relative z-10 p-6">
          <label className="block border-2 border-dashed border-line rounded-2xl p-8 text-center cursor-pointer hover:border-brand hover:bg-brand-light/40 transition">
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onFile} />
            <Icon name="upload" size={28} className="mx-auto text-brand mb-3" />
            <div className="text-[14px] font-extrabold text-ink mb-1">Drop file or click to browse</div>
            <div className="text-[11.5px] text-muted">.xlsx / .xls / .csv · up to 5,000 rows</div>
          </label>

          <div className="text-[11.5px] text-muted leading-relaxed mt-4">
            <b className="text-ink-2">Supported columns:</b> Brand · Category · Subcategory · Product Name · Description ·
            Regular Price (PKR) · Sale Price (PKR) · Stock · Image URL 1-10 · Display Size · Resolution · Processor ·
            RAM · ROM · Battery Capacity · Main Camera · Front Camera · Bluetooth Version · NFC · PTA Approved · Charging Port
          </div>
        </div>
      </div>

      {pending.length > 0 && (
        <div className="glass-tile rounded-2xl overflow-hidden">
          <div className="relative z-10 px-5 py-4 border-b border-line/60 flex justify-between items-center">
            <div>
              <h3 className="font-black text-[15px]">Preview</h3>
              <p className="text-[11.5px] text-muted font-semibold mt-0.5">{pending.length} products ready</p>
            </div>
            <button onClick={upload} disabled={busy} className="btn-primary">
              {busy ? 'Uploading...' : `Confirm & Upload ${pending.length}`}
            </button>
          </div>
          <div className="overflow-x-auto max-h-[420px]">
            <table className="w-full">
              <thead className="bg-surface-2/60 text-[10.5px] uppercase text-muted font-extrabold tracking-wider sticky top-0">
                <tr>
                  <th className="p-3 text-left">#</th>
                  <th className="p-3 text-left">Title</th>
                  <th className="p-3 text-left">Category</th>
                  <th className="p-3 text-left">Brand</th>
                  <th className="p-3 text-left">Price</th>
                  <th className="p-3 text-left">Disc</th>
                  <th className="p-3 text-left">Stock</th>
                  <th className="p-3 text-left">Specs</th>
                </tr>
              </thead>
              <tbody>
                {pending.slice(0, 50).map((p, i) => (
                  <tr key={i} className="border-t border-line/30">
                    <td className="p-3 text-[12px] text-muted">{i + 1}</td>
                    <td className="p-3 text-[12.5px] font-semibold max-w-[260px] truncate">{p.title}</td>
                    <td className="p-3 text-[12px] text-muted">{p.category_name}</td>
                    <td className="p-3 text-[12px] text-muted">{p.brand || '—'}</td>
                    <td className="p-3 text-[12.5px] font-extrabold">{fmt(p.price)}</td>
                    <td className="p-3 text-[12px]">{p.discount_percent ? `${p.discount_percent}%` : '—'}</td>
                    <td className="p-3 text-[12.5px] font-bold">{p.stock_count}</td>
                    <td className="p-3 text-[11.5px] text-muted">
                      {p.specs ? Object.keys(p.specs).length : 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
