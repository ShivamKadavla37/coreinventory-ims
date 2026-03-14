import { useState, useEffect } from 'react';
import { transfersAPI, productsAPI, warehousesAPI } from '../services/api';
import { HiOutlineSearch, HiOutlineViewList, HiOutlineViewGrid, HiOutlineX, HiOutlineCheck, HiOutlineSwitchHorizontal, HiOutlinePlus } from 'react-icons/hi';
import toast from 'react-hot-toast';

const Transfers = () => {
  const [transfers, setTransfers] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [form, setForm] = useState({ productId: '', fromWarehouseId: '', toWarehouseId: '', quantity: '' });
  const [filterStatus, setFilterStatus] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [tRes, pRes, wRes] = await Promise.all([transfersAPI.getAll(), productsAPI.getAll(), warehousesAPI.getAll()]);
      setTransfers(tRes.data); setProducts(pRes.data); setWarehouses(wRes.data);
    } catch (error) { toast.error('Failed to fetch data'); } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.fromWarehouseId === form.toWarehouseId) { toast.error('Source and destination must differ'); return; }
    try {
      await transfersAPI.create({ productId: parseInt(form.productId), fromWarehouseId: parseInt(form.fromWarehouseId), toWarehouseId: parseInt(form.toWarehouseId), quantity: parseInt(form.quantity) });
      toast.success('Transfer created'); setShowModal(false); setForm({ productId: '', fromWarehouseId: '', toWarehouseId: '', quantity: '' }); fetchData();
    } catch (error) { toast.error(error.response?.data?.message || 'Failed'); }
  };

  const handleValidate = async (id) => {
    try { await transfersAPI.validate(id); toast.success('Transfer validated! Stock moved.'); fetchData(); }
    catch (error) { toast.error(error.response?.data?.message || 'Insufficient stock'); }
  };

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this transfer?')) return;
    try { await transfersAPI.cancel(id); toast.success('Transfer cancelled.'); fetchData(); }
    catch (error) { toast.error(error.response?.data?.message || 'Failed to cancel'); }
  };

  const filtered = transfers.filter(t => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterWarehouse && String(t.fromWarehouseId) !== filterWarehouse && String(t.toWarehouseId) !== filterWarehouse) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return t.product?.name?.toLowerCase().includes(q) || t.fromWarehouse?.name?.toLowerCase().includes(q) || t.toWarehouse?.name?.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="fade-in p-6 max-w-7xl mx-auto mt-6 space-y-6">
        <div className="h-6 w-32 bg-gray-200 rounded-full skeleton-pulse mb-8"></div>
        <div className="bg-white border border-gray-200 rounded-xl h-96 skeleton-pulse"></div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="sub-header">
        <div className="flex items-center gap-3">
          <h1 className="page-title">Internal Transfers</h1>
        </div>
        <div className="flex items-center gap-3">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="select-field py-1.5 text-sm w-36">
            <option value="">All Statuses</option>
            <option value="draft">Ready</option>
            <option value="validated">Done</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select value={filterWarehouse} onChange={e => setFilterWarehouse(e.target.value)} className="select-field py-1.5 text-sm w-44">
            <option value="">All Warehouses</option>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <button onClick={() => setShowModal(true)} className="btn-new" id="add-transfer-btn"><HiOutlinePlus size={18} /> Add Transfer</button>
          {searchOpen ? (
            <div className="flex items-center gap-2">
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="input-field py-1.5 text-sm w-64" autoFocus />
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
              <th>Reference</th><th>Product</th><th>From</th><th>To</th><th>Quantity</th><th>Schedule Date</th><th>Status</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="table-row cursor-pointer" onClick={() => setSelectedTransfer(t)}>
                  <td className="font-medium text-rose-600">WH/INT/{String(t.id).padStart(4, '0')}</td>
                  <td className="text-gray-800 font-medium">{t.product?.name}</td>
                  <td className="text-gray-600">{t.fromWarehouse?.name}</td>
                  <td className="text-gray-600">{t.toWarehouse?.name}</td>
                  <td className="text-gray-800 font-semibold">{t.quantity}</td>
                  <td className="text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td>{t.status === 'validated' ? <span className="badge-success">Done</span> : t.status === 'draft' ? <span className="status-ready">Ready</span> : <span className="badge-neutral">{t.status}</span>}</td>
                  <td>{t.status === 'draft' && (
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); handleValidate(t.id); }} className="btn-success flex items-center gap-1 text-xs px-3 py-1"><HiOutlineCheck size={14} /> Validate</button>
                      <button onClick={(e) => { e.stopPropagation(); handleCancel(t.id); }} className="text-gray-400 hover:text-red-500 transition-colors"><HiOutlineX size={16} /></button>
                    </div>
                  )}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16">
                    <div className="empty-state-container">
                      <div className="empty-state-icon"><HiOutlineSwitchHorizontal size={36} /></div>
                      <h3 className="empty-state-title">No transfers found</h3>
                      <p className="empty-state-desc">You haven't moved any products internally yet, or none match your search criteria. Click "+ Add Transfer" to start.</p>
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
            {filtered.map((t) => (
              <div key={t.id} onClick={() => setSelectedTransfer(t)} className="op-card flex flex-col cursor-pointer hover:border-rose-200 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-medium text-rose-600 text-sm">WH/INT/{String(t.id).padStart(4, '0')}</span>
                  {t.status === 'validated' ? (
                    <span className="badge-success">Done</span>
                  ) : t.status === 'draft' ? (
                    <span className="status-ready">Ready</span>
                  ) : (
                    <span className="badge-neutral">{t.status}</span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">{t.product?.name || 'Unknown Product'}</h3>
                <div className="text-sm text-gray-600 mb-4 flex-[1]">
                  <p className="truncate"><span className="text-gray-400">From:</span> {t.fromWarehouse?.name}</p>
                  <p className="truncate"><span className="text-gray-400">To:</span> {t.toWarehouse?.name}</p>
                </div>
                <div className="flex justify-between items-end border-t border-gray-100 pt-3 mt-auto">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Quantity</p>
                    <p className="font-semibold text-gray-800">{t.quantity}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    {t.status === 'draft' ? (
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); handleCancel(t.id); }} className="text-xs text-gray-400 font-medium hover:text-red-500 px-2 py-1.5 transition-colors">Cancel</button>
                        <button onClick={(e) => { e.stopPropagation(); handleValidate(t.id); }} className="btn-success flex items-center gap-1 text-xs px-3 py-1.5">
                          <HiOutlineCheck size={14} /> Validate
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full py-16">
                <div className="empty-state-container">
                  <div className="empty-state-icon"><HiOutlineSwitchHorizontal size={36} /></div>
                  <h3 className="empty-state-title">No transfers found</h3>
                  <p className="empty-state-desc">You haven't moved any products internally yet, or none match your search criteria. Click "+ Add Transfer" to start.</p>
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
              <h2 className="text-lg font-semibold text-gray-800">New Internal Transfer</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><HiOutlineX size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-600 mb-1">Product</label>
                <select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} className="select-field" required>
                  <option value="">Select product</option>{products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-600 mb-1">From Warehouse</label>
                  <select value={form.fromWarehouseId} onChange={(e) => setForm({ ...form, fromWarehouseId: e.target.value })} className="select-field" required>
                    <option value="">Source</option>{warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-600 mb-1">To Warehouse</label>
                  <select value={form.toWarehouseId} onChange={(e) => setForm({ ...form, toWarehouseId: e.target.value })} className="select-field" required>
                    <option value="">Destination</option>{warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="block text-sm font-medium text-gray-600 mb-1">Quantity</label>
                <input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="input-field" required />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Discard</button>
                <button type="submit" className="btn-primary flex-1">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedTransfer && (
        <div className="modal-overlay" onClick={() => setSelectedTransfer(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-800">Transfer Details</h2>
              <button onClick={() => setSelectedTransfer(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><HiOutlineX size={20} /></button>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span className="text-gray-500 font-medium">Reference</span>
                <span className="font-bold text-rose-600">WH/INT/{String(selectedTransfer.id).padStart(4, '0')}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-xs text-gray-500 block mb-1">From (Warehouse)</span>
                  <span className="font-medium text-gray-800">{selectedTransfer.fromWarehouse?.name}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-xs text-gray-500 block mb-1">To (Warehouse)</span>
                  <span className="font-medium text-gray-800">{selectedTransfer.toWarehouse?.name}</span>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span className="text-xs text-gray-500 block mb-1">Product</span>
                <span className="font-medium text-gray-800">{selectedTransfer.product?.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-xs text-gray-500 block mb-1">Quantity</span>
                  <span className="font-medium text-gray-800">{selectedTransfer.quantity}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mt-auto flex items-center justify-between">
                  <span className="text-xs text-gray-500 block mb-0">Status</span>
                  <span>{selectedTransfer.status === 'validated' ? <span className="badge-success">Done</span> : selectedTransfer.status === 'draft' ? <span className="status-ready">Ready</span> : <span className="badge-neutral">{selectedTransfer.status}</span>}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transfers;
