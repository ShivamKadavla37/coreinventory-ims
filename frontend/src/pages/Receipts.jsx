import { useState, useEffect } from 'react';
import { receiptsAPI, productsAPI, warehousesAPI } from '../services/api';
import { HiOutlineSearch, HiOutlineViewList, HiOutlineViewGrid, HiOutlineX, HiOutlineCheck, HiOutlineDocumentDownload, HiOutlinePlus, HiOutlineTable, HiOutlineDocumentText } from 'react-icons/hi';
import toast from 'react-hot-toast';

const Receipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [form, setForm] = useState({ supplier: '', productId: '', warehouseId: '', quantity: '' });
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [rRes, pRes, wRes] = await Promise.all([
        receiptsAPI.getAll(), productsAPI.getAll(), warehousesAPI.getAll(),
      ]);
      setReceipts(rRes.data); setProducts(pRes.data); setWarehouses(wRes.data);
    } catch (error) { toast.error('Failed to fetch data'); } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let finalProductId = form.productId;
      if (isNewProduct) {
        if (!newProductName.trim()) { toast.error('Enter a product name'); return; }
        const pRes = await productsAPI.create({ name: newProductName, sku: 'SKU-' + Math.floor(100000 + Math.random() * 900000), category: 'General' });
        finalProductId = pRes.data.id;
      }
      await receiptsAPI.create({ ...form, productId: parseInt(finalProductId), warehouseId: parseInt(form.warehouseId), quantity: parseInt(form.quantity) });
      toast.success('Receipt created');
      setShowModal(false);
      setForm({ supplier: '', productId: '', warehouseId: '', quantity: '' });
      setIsNewProduct(false);
      setNewProductName('');
      fetchData();
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to create receipt'); }
  };

  const handleValidate = async (id) => {
    try {
      await receiptsAPI.validate(id);
      toast.success('Receipt validated! Stock increased.');
      fetchData();
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to validate'); }
  };

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this receipt?')) return;
    try { await receiptsAPI.cancel(id); toast.success('Receipt cancelled.'); fetchData(); }
    catch (error) { toast.error(error.response?.data?.message || 'Failed to cancel'); }
  };

  const filtered = receipts.filter(r => {
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterWarehouse && String(r.warehouseId) !== filterWarehouse) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return r.supplier?.toLowerCase().includes(q) || r.product?.name?.toLowerCase().includes(q) || `#${r.id}`.includes(q);
  });

  const [exportMode, setExportMode] = useState(null); // 'csv' | 'pdf' | null
  const [showExportPicker, setShowExportPicker] = useState(false);

  const openExportPicker = (mode) => {
    setExportMode(mode);
    setShowExportPicker(true);
  };

  const doExportCSV = (receiptList) => {
    const headers = ['Reference', 'Supplier', 'Warehouse', 'Product', 'SKU', 'Category', 'Quantity', 'Date', 'Status'];
    const rows = receiptList.map(r => [
      `WH/IN/${String(r.id).padStart(4, '0')}`,
      r.supplier || '',
      r.warehouse?.name || '',
      r.product?.name || '',
      r.product?.sku || '',
      r.product?.category || '',
      r.quantity,
      new Date(r.createdAt).toLocaleDateString(),
      r.status === 'validated' ? 'Done' : r.status === 'draft' ? 'Ready' : r.status,
    ]);
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const name = receiptList.length === 1 ? `receipt_WH-IN-${String(receiptList[0].id).padStart(4, '0')}` : `receipts_all_${new Date().toISOString().slice(0, 10)}`;
    link.download = `${name}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success('CSV exported!');
    setShowExportPicker(false);
  };

  const doExportPDF = (receiptList) => {
    const printWindow = window.open('', '_blank');
    const isSingle = receiptList.length === 1;
    const r = isSingle ? receiptList[0] : null;

    let bodyContent = '';
    if (isSingle) {
      const statusLabel = r.status === 'validated' ? 'Done' : r.status === 'draft' ? 'Ready' : r.status;
      const statusColor = r.status === 'validated' ? '#059669' : r.status === 'draft' ? '#d97706' : '#6b7280';
      const statusBg = r.status === 'validated' ? '#d1fae5' : r.status === 'draft' ? '#fef3c7' : '#f3f4f6';
      bodyContent = `
        <div class="receipt-card">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;">
            <div>
              <h2 style="font-size:28px;font-weight:700;color:#e11d48;margin:0;">WH/IN/${String(r.id).padStart(4, '0')}</h2>
              <p style="color:#6b7280;font-size:13px;margin-top:4px;">Receipt Document</p>
            </div>
            <span style="padding:6px 16px;border-radius:999px;font-size:13px;font-weight:600;background:${statusBg};color:${statusColor};">${statusLabel}</span>
          </div>
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
            <tr><td class="label">Supplier</td><td class="value">${r.supplier || 'N/A'}</td></tr>
            <tr><td class="label">Destination Warehouse</td><td class="value">${r.warehouse?.name || 'N/A'}</td></tr>
            <tr><td class="label">Product</td><td class="value">${r.product?.name || 'N/A'}</td></tr>
            <tr><td class="label">SKU / Code</td><td class="value">${r.product?.sku || 'N/A'}</td></tr>
            <tr><td class="label">Category</td><td class="value">${r.product?.category || 'N/A'}</td></tr>
            <tr><td class="label">Quantity Received</td><td class="value" style="font-size:18px;font-weight:700;color:#059669;">${r.quantity}</td></tr>
            <tr><td class="label">Date Created</td><td class="value">${new Date(r.createdAt).toLocaleString()}</td></tr>
            <tr><td class="label">Last Updated</td><td class="value">${new Date(r.updatedAt).toLocaleString()}</td></tr>
          </table>
        </div>`;
    } else {
      const tableRows = receiptList.map(r => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:600;color:#e11d48;">WH/IN/${String(r.id).padStart(4, '0')}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${r.supplier || ''}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${r.warehouse?.name || ''}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:500;">${r.product?.name || ''}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:600;">${r.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${new Date(r.createdAt).toLocaleDateString()}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">
            <span style="padding:2px 10px;border-radius:999px;font-size:12px;font-weight:600;${
              r.status === 'validated' ? 'background:#d1fae5;color:#059669;' :
              r.status === 'draft' ? 'background:#fef3c7;color:#d97706;' :
              'background:#f3f4f6;color:#6b7280;'
            }">${r.status === 'validated' ? 'Done' : r.status === 'draft' ? 'Ready' : r.status}</span>
          </td>
        </tr>
      `).join('');
      bodyContent = `
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead><tr>
            <th>Reference</th><th>Supplier</th><th>Warehouse</th><th>Product</th><th>Quantity</th><th>Date</th><th>Status</th>
          </tr></thead>
          <tbody>${tableRows}</tbody>
        </table>`;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>KOSHNETRA — ${isSingle ? `Receipt WH/IN/${String(r.id).padStart(4, '0')}` : 'Receipts Report'}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding:40px; color:#1f2937; }
        .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:30px; padding-bottom:20px; border-bottom:2px solid #e11d48; }
        .header h1 { font-size:24px; color:#e11d48; }
        .header .date { font-size:13px; color:#6b7280; }
        th { padding:10px 12px; background:#fef2f2; color:#9f1239; text-align:left; font-weight:600; text-transform:uppercase; font-size:11px; letter-spacing:0.5px; border-bottom:2px solid #fecdd3; }
        .receipt-card { background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:30px; }
        .label { padding:10px 0; color:#6b7280; font-size:13px; width:200px; border-bottom:1px solid #f3f4f6; }
        .value { padding:10px 0; font-weight:500; font-size:14px; color:#1f2937; border-bottom:1px solid #f3f4f6; }
        .footer { margin-top:30px; padding-top:15px; border-top:1px solid #e5e7eb; font-size:12px; color:#9ca3af; text-align:center; }
        @media print { body { padding:20px; } }
      </style>
      </head><body>
        <div class="header">
          <h1>KOSHNETRA — ${isSingle ? 'Receipt Details' : 'Receipts Report'}</h1>
          <span class="date">Generated: ${new Date().toLocaleString()}</span>
        </div>
        ${bodyContent}
        <div class="footer">${isSingle ? `Receipt WH/IN/${String(r.id).padStart(4, '0')}` : `Total Records: ${receiptList.length}`} &bull; KOSHNETRA Inventory Management System</div>
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 400);
    toast.success('PDF export ready — use Print > Save as PDF');
    setShowExportPicker(false);
  };

  const handleExportSelect = (receipt) => {
    const list = receipt === 'all' ? filtered : [receipt];
    if (exportMode === 'csv') doExportCSV(list);
    else doExportPDF(list);
  };

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
      {/* Sub-header matching Excalidraw */}
      <div className="sub-header">
        <div className="flex items-center gap-3">
          <h1 className="page-title">Receipts</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => openExportPicker('csv')} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm" title="Export as CSV">
            <HiOutlineTable size={16} className="text-emerald-500" /> CSV
          </button>
          <button onClick={() => openExportPicker('pdf')} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm" title="Export as PDF">
            <HiOutlineDocumentText size={16} className="text-red-500" /> PDF
          </button>
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
          <button onClick={() => setShowModal(true)} className="btn-new" id="add-receipt-btn"><HiOutlinePlus size={18} /> Add Receipt</button>
          {/* Search */}
          {searchOpen ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reference & contacts..."
                className="input-field py-1.5 text-sm w-64"
                autoFocus
              />
              <button onClick={() => { setSearchOpen(false); setSearch(''); }} className="p-1.5 rounded hover:bg-gray-100 text-gray-400">
                <HiOutlineX size={16} />
              </button>
            </div>
          ) : (
            <button onClick={() => setSearchOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
              <HiOutlineSearch size={18} />
            </button>
          )}
          {/* View toggles */}
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
                <th>From (Supplier)</th>
                <th>To (Warehouse)</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Schedule Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="table-row cursor-pointer" onClick={() => setSelectedReceipt(r)}>
                  <td className="font-medium text-rose-600">WH/IN/{String(r.id).padStart(4, '0')}</td>
                  <td className="text-gray-600">{r.supplier}</td>
                  <td className="text-gray-600">{r.warehouse?.name}</td>
                  <td className="text-gray-800 font-medium">{r.product?.name}</td>
                  <td className="text-gray-800 font-semibold">{r.quantity}</td>
                  <td className="text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td>
                    {r.status === 'validated' ? (
                      <span className="badge-success">Done</span>
                    ) : r.status === 'draft' ? (
                      <span className="status-ready">Ready</span>
                    ) : (
                      <span className="badge-neutral">{r.status}</span>
                    )}
                  </td>
                  <td>
                    {r.status === 'draft' && (
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); handleValidate(r.id); }} className="btn-success flex items-center gap-1 text-xs px-3 py-1">
                          <HiOutlineCheck size={14} /> Validate
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleCancel(r.id); }} className="text-gray-400 hover:text-red-500 transition-colors">
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
                      <div className="empty-state-icon"><HiOutlineDocumentDownload size={36} /></div>
                      <h3 className="empty-state-title">No receipts found</h3>
                      <p className="empty-state-desc">You haven't created any incoming receipts yet, or none match your search criteria. Click "+ Add Receipt" to start.</p>
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
            {filtered.map((r) => (
              <div key={r.id} onClick={() => setSelectedReceipt(r)} className="op-card flex flex-col cursor-pointer hover:border-rose-200 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-medium text-rose-600 text-sm">WH/IN/{String(r.id).padStart(4, '0')}</span>
                  {r.status === 'validated' ? (
                    <span className="badge-success">Done</span>
                  ) : r.status === 'draft' ? (
                    <span className="status-ready">Ready</span>
                  ) : (
                    <span className="badge-neutral">{r.status}</span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">{r.product?.name || 'Unknown Product'}</h3>
                <div className="text-sm text-gray-600 mb-4 flex-[1]">
                  <p className="truncate"><span className="text-gray-400">From:</span> {r.supplier}</p>
                  <p className="truncate"><span className="text-gray-400">To:</span> {r.warehouse?.name}</p>
                </div>
                <div className="flex justify-between items-end border-t border-gray-100 pt-3 mt-auto">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Quantity</p>
                    <p className="font-semibold text-gray-800">{r.quantity}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    {r.status === 'draft' ? (
                      <div className="flex items-center gap-2">
                         <button onClick={(e) => { e.stopPropagation(); handleCancel(r.id); }} className="text-xs text-gray-400 font-medium hover:text-red-500 px-2 py-1.5 transition-colors">
                           Cancel
                         </button>
                         <button onClick={(e) => { e.stopPropagation(); handleValidate(r.id); }} className="btn-success flex items-center gap-1 text-xs px-3 py-1.5">
                          <HiOutlineCheck size={14} /> Validate
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full py-16">
                <div className="empty-state-container">
                  <div className="empty-state-icon"><HiOutlineDocumentDownload size={36} /></div>
                  <h3 className="empty-state-title">No receipts found</h3>
                  <p className="empty-state-desc">You haven't created any incoming receipts yet, or none match your search criteria. Click "+ Add Receipt" to start.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-800">New Receipt</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><HiOutlineX size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Supplier</label>
                <input type="text" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} className="input-field" placeholder="Supplier name" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Product</label>
                {!isNewProduct ? (
                  <>
                    <select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} className="select-field" required={!isNewProduct}>
                      <option value="">Select product</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                    </select>
                    <button type="button" onClick={() => setIsNewProduct(true)} className="text-sm text-rose-500 hover:text-rose-600 font-medium mt-1.5 inline-block">
                      + Add new product
                    </button>
                  </>
                ) : (
                  <>
                    <input type="text" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} className="input-field" placeholder="Enter new product name" required={isNewProduct} />
                    <button type="button" onClick={() => { setIsNewProduct(false); setNewProductName(''); }} className="text-sm text-gray-500 hover:text-gray-700 font-medium mt-1.5 inline-block">
                      Go to existing product
                    </button>
                  </>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Destination Warehouse</label>
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
      {selectedReceipt && (
        <div className="modal-overlay" onClick={() => setSelectedReceipt(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-800">Receipt Details</h2>
              <button onClick={() => setSelectedReceipt(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><HiOutlineX size={20} /></button>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span className="text-gray-500 font-medium">Reference</span>
                <span className="font-bold text-rose-600">WH/IN/{String(selectedReceipt.id).padStart(4, '0')}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-xs text-gray-500 block mb-1">From (Supplier)</span>
                  <span className="font-medium text-gray-800">{selectedReceipt.supplier}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-xs text-gray-500 block mb-1">To (Warehouse)</span>
                  <span className="font-medium text-gray-800">{selectedReceipt.warehouse?.name}</span>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span className="text-xs text-gray-500 block mb-1">Product</span>
                <span className="font-medium text-gray-800">{selectedReceipt.product?.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-xs text-gray-500 block mb-1">Quantity</span>
                  <span className="font-medium text-gray-800">{selectedReceipt.quantity}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mt-auto flex items-center justify-between">
                  <span className="text-xs text-gray-500 block mb-0">Status</span>
                  <span>{selectedReceipt.status === 'validated' ? <span className="badge-success">Done</span> : selectedReceipt.status === 'draft' ? <span className="status-ready">Ready</span> : <span className="badge-neutral">{selectedReceipt.status}</span>}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Picker Modal */}
      {showExportPicker && (
        <div className="modal-overlay" onClick={() => setShowExportPicker(false)}>
          <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Export as {exportMode === 'csv' ? 'CSV' : 'PDF'}
              </h2>
              <button onClick={() => setShowExportPicker(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><HiOutlineX size={18} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Select a receipt to export, or export all receipts at once.</p>

            {/* Export All Button */}
            <button
              onClick={() => handleExportSelect('all')}
              className="w-full mb-3 flex items-center justify-between px-4 py-3 rounded-xl border-2 border-dashed border-rose-200 bg-rose-50/50 text-rose-600 hover:bg-rose-100 hover:border-rose-300 transition-all font-medium text-sm"
            >
              <span className="flex items-center gap-2">
                {exportMode === 'csv' ? <HiOutlineTable size={18} /> : <HiOutlineDocumentText size={18} />}
                Export All Receipts ({filtered.length})
              </span>
              <span className="text-xs text-rose-400">All transactions</span>
            </button>

            {/* Individual receipts */}
            <div className="max-h-64 overflow-y-auto space-y-1.5 border-t border-gray-100 pt-3">
              {filtered.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleExportSelect(r)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-rose-600 font-semibold text-sm whitespace-nowrap">WH/IN/{String(r.id).padStart(4, '0')}</span>
                    <div>
                      <p className="text-sm text-gray-800 font-medium">{r.product?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-400">{r.supplier} → {r.warehouse?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold text-gray-700">{r.quantity}</span>
                    {r.status === 'validated' ? (
                      <span className="badge-success text-[10px]">Done</span>
                    ) : r.status === 'draft' ? (
                      <span className="status-ready text-[10px]">Ready</span>
                    ) : (
                      <span className="badge-neutral text-[10px]">{r.status}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Receipts;
