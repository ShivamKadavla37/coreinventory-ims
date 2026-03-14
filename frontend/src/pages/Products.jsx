import { useState, useEffect } from 'react';
import { productsAPI, warehousesAPI } from '../services/api';
import { HiOutlineSearch, HiOutlineViewList, HiOutlineViewGrid, HiOutlinePencil, HiOutlineTrash, HiOutlineX, HiOutlinePlus } from 'react-icons/hi';
import toast from 'react-hot-toast';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [form, setForm] = useState({ name: '', sku: '', category: '', unit: 'pcs', description: '', minStock: 10, initialStock: 0, initialWarehouseId: '' });
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async (q = '') => {
    try {
      const [pRes, wRes] = await Promise.all([productsAPI.getAll({ search: q }), warehousesAPI.getAll()]);
      setProducts(pRes.data);
      setWarehouses(wRes.data);
    } catch (error) { toast.error('Failed to fetch data'); } finally { setLoading(false); }
  };

  const handleSearch = (e) => { const v = e.target.value; setSearch(v); fetchProducts(v); };

  const openCreate = () => { setIsCustomCategory(false); setCustomCategoryName(''); setEditingProduct(null); setForm({ name: '', sku: '', category: '', unit: 'pcs', description: '', minStock: 10, initialStock: 0, initialWarehouseId: warehouses.length > 0 ? warehouses[0].id : '' }); setShowModal(true); };
  const openEdit = (p) => { 
    const defaultCategories = ['Electronics', 'Furniture', 'Supplies', 'Hygiene', 'Clothing', 'Food'];
    const isCustom = p.category && !defaultCategories.includes(p.category);
    setIsCustomCategory(isCustom);
    setCustomCategoryName(isCustom ? p.category : '');
    setEditingProduct(p); 
    setForm({ name: p.name, sku: p.sku, category: isCustom ? 'Other' : p.category, unit: p.unit, description: p.description || '', minStock: p.minStock || 10, initialStock: 0, initialWarehouseId: '' }); 
    setShowModal(true); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const finalCategory = isCustomCategory ? customCategoryName : form.category;
      if (isCustomCategory && !finalCategory.trim()) { toast.error('Enter a category name'); return; }
      
      const payload = { ...form, category: finalCategory };
      if (editingProduct) { await productsAPI.update(editingProduct.id, payload); toast.success('Updated'); }
      else { await productsAPI.create(payload); toast.success('Created'); }
      setShowModal(false); fetchProducts(search);
    } catch (error) { toast.error(error.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try { await productsAPI.delete(id); toast.success('Deleted'); fetchProducts(search); }
    catch (error) { toast.error('Failed'); }
  };

  const viewStock = async (p) => {
    try { const res = await productsAPI.getById(p.id); setSelectedProduct(res.data); }
    catch (error) { toast.error('Failed'); }
  };

  if (loading) {
    return (
      <div className="fade-in p-6 max-w-7xl mx-auto mt-6 space-y-6">
        <div className="h-6 w-32 bg-gray-200 rounded-full skeleton-pulse mb-8"></div>
        <div className="bg-white border border-gray-200 rounded-xl h-96 skeleton-pulse"></div>
      </div>
    );
  }

  const filteredProducts = products.filter(p => {
    if (filterCategory && p.category !== filterCategory) return false;
    return true;
  });

  return (
    <div className="fade-in">
      <div className="sub-header">
        <div className="flex items-center gap-3">
          <h1 className="page-title">Products</h1>
        </div>
        <div className="flex items-center gap-3">
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="select-field py-1.5 text-sm w-40">
            <option value="">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Furniture">Furniture</option>
            <option value="Supplies">Supplies</option>
            <option value="Hygiene">Hygiene</option>
            <option value="Clothing">Clothing</option>
            <option value="Food">Food</option>
          </select>
          <button onClick={openCreate} className="btn-new" id="add-product-btn"><HiOutlinePlus size={18} /> Add Product</button>
          {searchOpen ? (
            <div className="flex items-center gap-2">
              <input type="text" value={search} onChange={handleSearch} placeholder="Search name or SKU..." className="input-field py-1.5 text-sm w-64" autoFocus id="product-search" />
              <button onClick={() => { setSearchOpen(false); setSearch(''); fetchProducts(''); }} className="p-1.5 rounded hover:bg-gray-100 text-gray-400"><HiOutlineX size={16} /></button>
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
              <th>Name</th><th>SKU</th><th>Category</th><th>Unit</th><th>Total Stock</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id} className="table-row" onClick={() => viewStock(p)}>
                  <td className="text-gray-800 font-medium">{p.name}</td>
                  <td className="text-gray-500 font-mono text-xs">{p.sku}</td>
                  <td><span className="badge-info">{p.category}</span></td>
                  <td className="text-gray-500">{p.unit}</td>
                  <td><span className={`font-semibold ${p.totalStock < 10 ? 'text-red-600' : 'text-emerald-600'}`}>{p.totalStock}</span></td>
                  <td>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-rose-500"><HiOutlinePencil size={15} /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"><HiOutlineTrash size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16">
                    <div className="empty-state-container">
                      <div className="empty-state-icon"><HiOutlineCube size={36} /></div>
                      <h3 className="empty-state-title">No products found</h3>
                      <p className="empty-state-desc">You haven't added any products yet, or none match your search criteria. Click "+ Add Product" to add inventory.</p>
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
            {filteredProducts.map((p) => (
              <div key={p.id} className="op-card flex flex-col hover:border-rose-200" onClick={() => viewStock(p)}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 line-clamp-2 leading-tight">{p.name}</h3>
                    <p className="text-xs text-gray-500 font-mono mt-1 pt-1">{p.sku}</p>
                  </div>
                  <span className="badge-info whitespace-nowrap ml-2">{p.category}</span>
                </div>
                <div className="flex justify-between items-end border-t border-gray-100 pt-3 mt-auto">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Total Stock</p>
                    <p className={`font-semibold ${p.totalStock < 10 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {p.totalStock} <span className="text-xs text-gray-500 font-normal">{p.unit}</span>
                    </p>
                  </div>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-rose-500 transition-colors"><HiOutlinePencil size={18} /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><HiOutlineTrash size={18} /></button>
                  </div>
                </div>
              </div>
            ))}
            {products.length === 0 && (
              <div className="col-span-full py-16">
                <div className="empty-state-container">
                  <div className="empty-state-icon"><HiOutlineCube size={36} /></div>
                  <h3 className="empty-state-title">No products found</h3>
                  <p className="empty-state-desc">You haven't added any products yet, or none match your search criteria. Click "+ Add Product" to add inventory.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stock Detail Modal */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-800">Stock — {selectedProduct.name}</h2>
              <button onClick={() => setSelectedProduct(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><HiOutlineX size={18} /></button>
            </div>
            <table className="w-full text-sm">
              <thead className="table-header"><tr><th>Warehouse</th><th>Location</th><th>Quantity</th></tr></thead>
              <tbody>
                {selectedProduct.stocks?.map((s) => (
                  <tr key={s.id} className="table-row">
                    <td className="text-gray-800 font-medium">{s.warehouse?.name}</td>
                    <td className="text-gray-500">{s.warehouse?.location || '-'}</td>
                    <td><span className={`font-semibold ${s.quantity < 10 ? 'text-red-600' : 'text-emerald-600'}`}>{s.quantity}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between">
              <span className="text-sm text-gray-500">Total</span>
              <span className="text-sm font-bold text-gray-800">{selectedProduct.totalStock}</span>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-800">{editingProduct ? 'Edit Product' : 'New Product'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><HiOutlineX size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-600 mb-1">SKU</label>
                  <input type="text" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="input-field" required /></div>
                <div><label className="block text-sm font-medium text-gray-600 mb-1">Category</label>
                  {!isCustomCategory ? (
                    <select 
                      value={form.category} 
                      onChange={(e) => {
                        if (e.target.value === 'Other') { setIsCustomCategory(true); setForm({ ...form, category: 'Other' }); }
                        else { setForm({ ...form, category: e.target.value }); }
                      }} 
                      className="select-field" required={!isCustomCategory}
                    >
                      <option value="" disabled>Select category</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Furniture">Furniture</option>
                      <option value="Supplies">Supplies</option>
                      <option value="Hygiene">Hygiene</option>
                      <option value="Clothing">Clothing</option>
                      <option value="Food">Food</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <>
                      <input type="text" value={customCategoryName} onChange={(e) => setCustomCategoryName(e.target.value)} className="input-field" placeholder="Enter new category name" required={isCustomCategory} autoFocus />
                      <button type="button" onClick={() => { setIsCustomCategory(false); setCustomCategoryName(''); setForm({ ...form, category: '' }); }} className="text-sm text-gray-500 hover:text-gray-700 font-medium mt-1.5 inline-block">
                        Go to existing categories
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-600 mb-1">Unit</label>
                  <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="select-field">
                    <option value="pcs">Pieces</option><option value="kg">Kilograms</option><option value="ltr">Litres</option>
                    <option value="box">Box</option><option value="ream">Ream</option><option value="bottle">Bottle</option>
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-600 mb-1">Min Stock Alert</label>
                  <input type="number" min="0" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: parseInt(e.target.value) || 0 })} className="input-field" required />
                </div>
              </div>
              {!editingProduct && (
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-600 mb-1">Initial Stock (Optional)</label>
                  <input type="number" min="0" value={form.initialStock} onChange={(e) => setForm({ ...form, initialStock: parseInt(e.target.value) || 0 })} className="input-field" />
                </div>
                <div><label className="block text-sm font-medium text-gray-600 mb-1">Initial Warehouse</label>
                  <select value={form.initialWarehouseId} onChange={(e) => setForm({ ...form, initialWarehouseId: e.target.value })} className="select-field" disabled={!form.initialStock || form.initialStock === 0}>
                    <option value="">Select warehouse</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              </div>
              )}
              <div><label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field h-20 resize-none" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Discard</button>
                <button type="submit" className="btn-primary flex-1">{editingProduct ? 'Save' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
