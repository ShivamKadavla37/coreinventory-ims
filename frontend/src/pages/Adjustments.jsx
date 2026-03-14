import { useState, useEffect } from 'react';
import { adjustmentsAPI, productsAPI, warehousesAPI } from '../services/api';
import { HiOutlineSearch, HiOutlineViewList, HiOutlineViewGrid, HiOutlineX, HiOutlinePlus } from 'react-icons/hi';
import toast from 'react-hot-toast';

const Adjustments = () => {
  const [adjustments, setAdjustments] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [selectedAdjustment, setSelectedAdjustment] = useState(null);
  const [form, setForm] = useState({ productId: '', warehouseId: '', newQuantity: '', reason: '' });
  const [filterWarehouse, setFilterWarehouse] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [aRes, pRes, wRes] = await Promise.all([adjustmentsAPI.getAll(), productsAPI.getAll(), warehousesAPI.getAll()]);
      setAdjustments(aRes.data); setProducts(pRes.data); setWarehouses(wRes.data);
    } catch (error) { toast.error('Failed to fetch data'); } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await adjustmentsAPI.create({ productId: parseInt(form.productId), warehouseId: parseInt(form.warehouseId), newQuantity: parseInt(form.newQuantity), reason: form.reason });
      toast.success('Stock adjusted'); setShowModal(false); setForm({ productId: '', warehouseId: '', newQuantity: '', reason: '' }); fetchData();
    } catch (error) { toast.error(error.response?.data?.message || 'Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" /></div>;

  const filtered = adjustments.filter(a => {
    if (filterWarehouse && String(a.warehouseId) !== filterWarehouse) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return a.product?.name?.toLowerCase().includes(q) || a.warehouse?.name?.toLowerCase().includes(q) || a.reason?.toLowerCase().includes(q);
  });

  return (
    <div className="fade-in">
      <div className="sub-header">
        <div className="flex items-center gap-3">
          <h1 className="page-title">Stock Adjustments</h1>
        </div>
        <div className="flex items-center gap-3">
          <select value={filterWarehouse} onChange={e => setFilterWarehouse(e.target.value)} className="select-field py-1.5 text-sm w-44">
            <option value="">All Warehouses</option>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <button onClick={() => setShowModal(true)} className="btn-new" id="add-adjustment-btn"><HiOutlinePlus size={18} /> Add Adjustment</button>
          {searchOpen ? (
            <div className="flex items-center gap-2">
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product or warehouse..." className="input-field py-1.5 text-sm w-64" autoFocus />
              <button onClick={() => { setSearchOpen(false); setSearch(''); }} className="p-1.5 rounded hover:bg-gray-100 text-gray-400"><HiOutlineX size={16} /></button>
            </div>
          ) : (
            <button onClick={() => setSearchOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"><HiOutlineSearch size={18} /></button>
          )}
          <div className="view-toggle">
            <button onClick={() => setViewMode('list')} className={viewMode === 'list' ? 'view-toggle-btn-active' : 'view-toggle-btn'}><HiOutlineViewList size={16} /></button>
            <button onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'view-toggle-btn-active' : 'view-toggle-btn'}><HiOutlineViewGrid size={16} /></button>
          </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white pb-24">
          <div className="max-w-7xl mx-auto">
            <table className="w-full text-sm">
              <thead className="table-header"><tr>
              <th>Reference</th><th>Product</th><th>Warehouse</th><th>Old Qty</th><th>New Qty</th><th>Change</th><th>Reason</th><th>Date</th>
            </tr></thead>
            <tbody>
              {filtered.map((a) => {
                const change = a.newQuantity - a.oldQuantity;
                return (
                  <tr key={a.id} className="table-row cursor-pointer" onClick={() => setSelectedAdjustment(a)}>
                    <td className="font-medium text-rose-600">ADJ/{String(a.id).padStart(4, '0')}</td>
                    <td className="text-gray-800 font-medium">{a.product?.name}</td>
                    <td className="text-gray-600">{a.warehouse?.name}</td>
                    <td className="text-gray-500">{a.oldQuantity}</td>
                    <td className="text-gray-800 font-semibold">{a.newQuantity}</td>
                    <td><span className={`font-semibold ${change > 0 ? 'text-emerald-600' : change < 0 ? 'text-red-600' : 'text-gray-400'}`}>{change > 0 ? '+' : ''}{change}</span></td>
                    <td className="text-gray-500 text-xs max-w-[200px] truncate">{a.reason || '-'}</td>
                    <td className="text-gray-500">{new Date(a.createdAt).toLocaleDateString()}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16">
                    <div className="empty-state-container">
                      <div className="empty-state-icon"><HiOutlineSearch size={36} /></div>
                      <h3 className="empty-state-title">No adjustments found</h3>
                      <p className="empty-state-desc">You haven't made any inventory adjustments yet. Click "+ Add Adjustment" to start.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-4 pb-24 min-h-[calc(100vh-140px)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-7xl mx-auto">
            {filtered.map((a) => {
              const change = a.newQuantity - a.oldQuantity;
              return (
                <div key={a.id} onClick={() => setSelectedAdjustment(a)} className="op-card flex flex-col cursor-pointer hover:border-rose-200 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-medium text-rose-600 text-sm">ADJ/{String(a.id).padStart(4, '0')}</span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">{a.product?.name || 'Unknown Product'}</h3>
                  <div className="text-sm text-gray-600 mb-4 flex-[1]">
                    <p className="truncate"><span className="text-gray-400">Warehouse:</span> {a.warehouse?.name}</p>
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2 italic">"{a.reason || 'No reason provided'}"</p>
                  </div>
                  <div className="flex justify-between items-end border-t border-gray-100 pt-3 mt-auto">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Physical Qty</p>
                      <p className="font-semibold text-gray-800">{a.newQuantity}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <p className={`font-semibold text-sm ${change > 0 ? 'text-emerald-500' : change < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                        {change > 0 ? '+' : ''}{change}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(a.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {adjustments.length === 0 && (
              <div className="col-span-full py-16">
                <div className="empty-state-container">
                  <div className="empty-state-icon"><HiOutlineSearch size={36} /></div>
                  <h3 className="empty-state-title">No adjustments found</h3>
                  <p className="empty-state-desc">You haven't made any inventory adjustments yet. Click "+ Add Adjustment" to start.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-800">New Stock Adjustment</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><HiOutlineX size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-600 mb-1">Product</label>
                <select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} className="select-field" required>
                  <option value="">Select product</option>{products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select></div>
              <div><label className="block text-sm font-medium text-gray-600 mb-1">Warehouse</label>
                <select value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })} className="select-field" required>
                  <option value="">Select warehouse</option>{warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select></div>
              <div><label className="block text-sm font-medium text-gray-600 mb-1">New Quantity (physical count)</label>
                <input type="number" min="0" value={form.newQuantity} onChange={(e) => setForm({ ...form, newQuantity: e.target.value })} className="input-field" required /></div>
              <div><label className="block text-sm font-medium text-gray-600 mb-1">Reason</label>
                <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="input-field h-20 resize-none" placeholder="Why?" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Discard</button>
                <button type="submit" className="btn-primary flex-1">Apply</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedAdjustment && (
        <div className="modal-overlay" onClick={() => setSelectedAdjustment(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-800">Adjustment Details</h2>
              <button onClick={() => setSelectedAdjustment(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><HiOutlineX size={20} /></button>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span className="text-gray-500 font-medium">Reference</span>
                <span className="font-bold text-rose-600">ADJ/{String(selectedAdjustment.id).padStart(4, '0')}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-xs text-gray-500 block mb-1">Product</span>
                  <span className="font-medium text-gray-800">{selectedAdjustment.product?.name}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-xs text-gray-500 block mb-1">Warehouse</span>
                  <span className="font-medium text-gray-800">{selectedAdjustment.warehouse?.name}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-xs text-gray-500 block mb-1">Old Qty</span>
                  <span className="font-medium text-gray-800">{selectedAdjustment.oldQuantity}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-xs text-gray-500 block mb-1">New Qty</span>
                  <span className="font-medium text-gray-800">{selectedAdjustment.newQuantity}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-xs text-gray-500 block mb-1">Change</span>
                  <span className={`font-medium ${selectedAdjustment.newQuantity - selectedAdjustment.oldQuantity > 0 ? 'text-emerald-500' : selectedAdjustment.newQuantity - selectedAdjustment.oldQuantity < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                    {selectedAdjustment.newQuantity - selectedAdjustment.oldQuantity > 0 ? '+' : ''}{selectedAdjustment.newQuantity - selectedAdjustment.oldQuantity}
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span className="text-xs text-gray-500 block mb-1">Reason</span>
                <span className="font-medium text-gray-800 italic">"{selectedAdjustment.reason || 'No reason provided'}"</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Adjustments;
