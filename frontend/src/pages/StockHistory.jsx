import { useState, useEffect } from 'react';
import { stockHistoryAPI } from '../services/api';
import { HiOutlineArrowUp, HiOutlineArrowDown, HiOutlineSwitchHorizontal, HiOutlineAdjustments, HiOutlineViewList, HiOutlineViewGrid } from 'react-icons/hi';
import toast from 'react-hot-toast';

const StockHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [viewMode, setViewMode] = useState('list');

  useEffect(() => { fetchData(); }, [filter]);

  const fetchData = async () => {
    try { const params = {}; if (filter) params.changeType = filter; const res = await stockHistoryAPI.getAll(params); setHistory(res.data); }
    catch (error) { toast.error('Failed to fetch history'); } finally { setLoading(false); }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'receipt': return <span className="badge-success">Receipt</span>;
      case 'delivery': return <span className="badge-danger">Delivery</span>;
      case 'transfer_in': return <span className="badge-info">Transfer In</span>;
      case 'transfer_out': return <span className="badge-warning">Transfer Out</span>;
      case 'adjustment': return <span className="badge-neutral">Adjustment</span>;
      default: return <span className="badge-neutral">{type}</span>;
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="fade-in">
      <div className="sub-header">
        <div className="flex items-center gap-3">
          <h1 className="page-title">Move History</h1>
        </div>
        <div className="flex items-center gap-3">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="select-field w-auto min-w-[160px] py-1.5 text-sm" id="history-filter">
            <option value="">All Movements</option>
            <option value="receipt">Receipts</option>
            <option value="delivery">Deliveries</option>
            <option value="transfer_in">Transfer In</option>
            <option value="transfer_out">Transfer Out</option>
            <option value="adjustment">Adjustments</option>
          </select>
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
                <th>Type</th><th>Product</th><th>Warehouse</th><th>Change</th><th>Notes</th><th>Date</th>
              </tr></thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="table-row">
                    <td>{getTypeBadge(h.changeType)}</td>
                    <td className="text-gray-800 font-medium">{h.product?.name}</td>
                    <td className="text-gray-600">{h.warehouse?.name}</td>
                    <td><span className={`font-semibold ${h.quantityChange > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{h.quantityChange > 0 ? '+' : ''}{h.quantityChange}</span></td>
                    <td className="text-gray-500 text-xs max-w-[250px] truncate">{h.notes || '-'}</td>
                    <td className="text-gray-500">{new Date(h.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16">
                      <div className="empty-state-container">
                        <div className="empty-state-icon"><HiOutlineSwitchHorizontal size={36} /></div>
                        <h3 className="empty-state-title">No movements found</h3>
                        <p className="empty-state-desc">You haven't moved any products yet, or none match your search criteria.</p>
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
            {history.map((h) => (
              <div key={h.id} className="op-card flex flex-col hover:border-gray-200 cursor-default">
                <div className="flex justify-between items-start mb-3">
                  {getTypeBadge(h.changeType)}
                  <span className="text-xs text-gray-400">{new Date(h.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">{h.product?.name || 'Unknown Product'}</h3>
                <div className="text-sm text-gray-600 mb-4 flex-[1]">
                  <p className="truncate"><span className="text-gray-400">Warehouse:</span> {h.warehouse?.name}</p>
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2 italic">"{h.notes || 'No notes'}"</p>
                </div>
                <div className="flex justify-between items-end border-t border-gray-100 pt-3 mt-auto">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Change</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className={`font-semibold text-lg ${h.quantityChange > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {h.quantityChange > 0 ? '+' : ''}{h.quantityChange}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {history.length === 0 && (
              <div className="col-span-full py-16">
                <div className="empty-state-container">
                  <div className="empty-state-icon"><HiOutlineSwitchHorizontal size={36} /></div>
                  <h3 className="empty-state-title">No movements found</h3>
                  <p className="empty-state-desc">You haven't moved any products yet, or none match your search criteria.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StockHistory;
