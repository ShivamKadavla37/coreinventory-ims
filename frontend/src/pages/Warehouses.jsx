import { useState, useEffect } from 'react';
import { warehousesAPI } from '../services/api';
import { HiOutlineOfficeBuilding, HiOutlineLocationMarker, HiOutlineX, HiOutlinePlus } from 'react-icons/hi';
import toast from 'react-hot-toast';
import IndiaWarehouseMap from '../components/IndiaWarehouseMap';

const Warehouses = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', location: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try { const res = await warehousesAPI.getAll(); setWarehouses(res.data); }
    catch (error) { toast.error('Failed'); } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { await warehousesAPI.create(form); toast.success('Warehouse created'); setShowModal(false); setForm({ name: '', location: '' }); fetchData(); }
    catch (error) { toast.error(error.response?.data?.message || 'Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="fade-in">
      <div className="sub-header">
        <div className="flex items-center gap-3">
          <h1 className="page-title">Settings — Warehouses</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowModal(true)} className="btn-new" id="add-warehouse-btn"><HiOutlinePlus size={18} /> Add Warehouse</button>
        </div>
      </div>

      <div className="p-6 pb-24 max-w-5xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map((w) => {
            const total = w.stocks?.reduce((s, i) => s + i.quantity, 0) || 0;
            const count = w.stocks?.filter(s => s.quantity > 0).length || 0;
            return (
              <div key={w.id} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
                    <HiOutlineOfficeBuilding className="text-rose-500" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{w.name}</h3>
                    {w.location && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><HiOutlineLocationMarker size={12} />{w.location}</p>}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-4">
                  <div><p className="text-xs text-gray-400">Total Stock</p><p className="text-lg font-bold text-gray-800">{total}</p></div>
                  <div><p className="text-xs text-gray-400">Products</p><p className="text-lg font-bold text-gray-800">{count}</p></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* India Map */}
        <IndiaWarehouseMap warehouses={warehouses} />
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-800">New Warehouse</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><HiOutlineX size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required /></div>
              <div><label className="block text-sm font-medium text-gray-600 mb-1">Location</label>
                <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input-field" placeholder="City, Country" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Discard</button>
                <button type="submit" className="btn-primary flex-1">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Warehouses;
