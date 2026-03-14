import { useState, useEffect } from 'react';
import { deliveriesAPI, productsAPI, warehousesAPI } from '../services/api';
import { HiOutlineSearch, HiOutlineViewList, HiOutlineViewGrid, HiOutlineX, HiOutlineCheck, HiOutlineTruck, HiOutlinePlus } from 'react-icons/hi';
import toast from 'react-hot-toast';

const Deliveries = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [form, setForm] = useState({ customer: '', productId: '', warehouseId: '', quantity: '' });
  const [filterStatus, setFilterStatus] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [dRes, pRes, wRes] = await Promise.all([
        deliveriesAPI.getAll(), productsAPI.getAll(), warehousesAPI.getAll(),
      ]);
      setDeliveries(dRes.data); setProducts(pRes.data); setWarehouses(wRes.data);
    } catch (error) { toast.error('Failed to fetch data'); } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await deliveriesAPI.create({ ...form, productId: parseInt(form.productId), warehouseId: parseInt(form.warehouseId), quantity: parseInt(form.quantity) });
      toast.success('Delivery order created');
      setShowModal(false); setForm({ customer: '', productId: '', warehouseId: '', quantity: '' }); fetchData();
    } catch (error) { toast.error(error.response?.data?.message || 'Failed'); }
  };

  const handleValidate = async (id) => {
    try { await deliveriesAPI.validate(id); toast.success('Delivery validated! Stock decreased.'); fetchData(); }
    catch (error) { toast.error(error.response?.data?.message || 'Insufficient stock'); }
  };

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this delivery order?')) return;
    try { await deliveriesAPI.cancel(id); toast.success('Delivery cancelled.'); fetchData(); }
    catch (error) { toast.error(error.response?.data?.message || 'Failed to cancel'); }
  };

  const filtered = deliveries.filter(d => {
    if (filterStatus && d.status !== filterStatus) return false;
    if (filterWarehouse && String(d.warehouseId) !== filterWarehouse) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return d.customer?.toLowerCase().includes(q) || d.product?.name?.toLowerCase().includes(q) || `#${d.id}`.includes(q);
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
          <h1 className="page-title">Delivery</h1>
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
          <button onClick={() => setShowModal(true)} className="btn-new" id="add-delivery-btn"><HiOutlinePlus size={18} /> Add Delivery</button>
          {searchOpen ? (
            <div className="flex items-center gap-2">
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reference & contacts..." className="input-field py-1.5 text-sm w-64" autoFocus />
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
              <thead className="table-header">
              <tr>
                <th>Reference</th>
                <th>From (Warehouse)</th>
                <th>To (Customer)</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Schedule Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} className="table-row cursor-pointer" onClick={() => setSelectedDelivery(d)}>
                  <td className="font-medium text-rose-600">WH/OUT/{String(d.id).padStart(4, '0')}</td>
                  <td className="text-gray-600">{d.warehouse?.name}</td>
                  <td className="text-gray-800 font-medium">{d.customer}</td>
                  <td className="text-gray-600">{d.product?.name}</td>
                  <td className="text-gray-800 font-semibold">{d.quantity}</td>
                  <td className="text-gray-500">{new Date(d.createdAt).toLocaleDateString()}</td>
                  <td>
                    {d.status === 'validated' ? <span className="badge-success">Done</span> :
                     d.status === 'draft' ? <span className="status-ready">Ready</span> :
                     <span className="badge-neutral">{d.status}</span>}
                  </td>
                  <td>
                    {d.status === 'draft' && (
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); handleValidate(d.id); }} className="btn-success flex items-center gap-1 text-xs px-3 py-1">
                          <HiOutlineCheck size={14} /> Validate
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleCancel(d.id); }} className="text-gray-400 hover:text-red-500 transition-colors">
                          <HiOutlineX size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16">
                    <div className="empty-state-container">
                      <div className="empty-state-icon"><HiOutlineTruck size={36} /></div>
                      <h3 className="empty-state-title">No deliveries found</h3>
                      <p className="empty-state-desc">You haven't created any outbound deliveries yet, or none match your search criteria. Click "+ Add Delivery" to start.</p>
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
            {filtered.map((d) => (
              <div key={d.id} onClick={() => setSelectedDelivery(d)} className="op-card flex flex-col cursor-pointer hover:border-rose-200 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-medium text-rose-600 text-sm">WH/OUT/{String(d.id).padStart(4, '0')}</span>
                  {d.status === 'validated' ? (
                    <span className="badge-success">Done</span>
                  ) : d.status === 'draft' ? (
                    <span className="status-ready">Ready</span>
                  ) : (
                    <span className="badge-neutral">{d.status}</span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">{d.product?.name || 'Unknown Product'}</h3>
                <div className="text-sm text-gray-600 mb-4 flex-[1]">
                  <p className="truncate"><span className="text-gray-400">From:</span> {d.warehouse?.name}</p>
                  <p className="truncate"><span className="text-gray-400">To:</span> {d.customer}</p>
                </div>
                <div className="flex justify-between items-end border-t border-gray-100 pt-3 mt-auto">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Quantity</p>
                    <p className="font-semibold text-gray-800">{d.quantity}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    {d.status === 'draft' ? (
                      <div className="flex items-center gap-2">
                         <button onClick={(e) => { e.stopPropagation(); handleCancel(d.id); }} className="text-xs text-gray-400 font-medium hover:text-red-500 px-2 py-1.5 transition-colors">
                           Cancel
                         </button>
                         <button onClick={(e) => { e.stopPropagation(); handleValidate(d.id); }} className="btn-success flex items-center gap-1 text-xs px-3 py-1.5">
                          <HiOutlineCheck size={14} /> Validate
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">{new Date(d.createdAt).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full py-16">
                <div className="empty-state-container">
                  <div className="empty-state-icon"><HiOutlineTruck size={36} /></div>
                  <h3 className="empty-state-title">No deliveries found</h3>
                  <p className="empty-state-desc">You haven't created any outbound deliveries yet, or none match your search criteria. Click "+ Add Delivery" to start.</p>
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
              <h2 className="text-lg font-semibold text-gray-800">New Delivery Order</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><HiOutlineX size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Customer</label>
                <input type="text" value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} className="input-field" placeholder="Customer name" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Product</label>
                <select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} className="select-field" required>
                  <option value="">Select product</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Source Warehouse</label>
                <select value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })} className="select-field" required>
                  <option value="">Select warehouse</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Quantity</label>
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
      {selectedDelivery && (
        <div className="modal-overlay" onClick={() => setSelectedDelivery(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-800">Delivery Details</h2>
              <button onClick={() => setSelectedDelivery(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><HiOutlineX size={20} /></button>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span className="text-gray-500 font-medium">Reference</span>
                <span className="font-bold text-rose-600">WH/OUT/{String(selectedDelivery.id).padStart(4, '0')}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-xs text-gray-500 block mb-1">To (Customer)</span>
                  <span className="font-medium text-gray-800">{selectedDelivery.customer}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-xs text-gray-500 block mb-1">From (Warehouse)</span>
                  <span className="font-medium text-gray-800">{selectedDelivery.warehouse?.name}</span>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span className="text-xs text-gray-500 block mb-1">Product</span>
                <span className="font-medium text-gray-800">{selectedDelivery.product?.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-xs text-gray-500 block mb-1">Quantity</span>
                  <span className="font-medium text-gray-800">{selectedDelivery.quantity}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mt-auto flex items-center justify-between">
                  <span className="text-xs text-gray-500 block mb-0">Status</span>
                  <span>{selectedDelivery.status === 'validated' ? <span className="badge-success">Done</span> : selectedDelivery.status === 'draft' ? <span className="status-ready">Ready</span> : <span className="badge-neutral">{selectedDelivery.status}</span>}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Deliveries;
