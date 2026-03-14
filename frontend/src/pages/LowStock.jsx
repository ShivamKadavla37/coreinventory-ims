import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import { HiOutlineExclamation } from 'react-icons/hi';
import toast from 'react-hot-toast';

const LowStock = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await dashboardAPI.getLowStock();
        setItems(res.data);
      } catch (error) { toast.error('Failed to fetch low stock alerts'); } finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="fade-in">
      <div className="sub-header">
        <h1 className="page-title">Low Stock Alerts</h1>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {items.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <HiOutlineExclamation className="text-emerald-500" size={32} />
            </div>
            <p className="text-gray-800 font-medium text-lg">All Clear!</p>
            <p className="text-gray-500 mt-1">No low stock items.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div key={item.id} className={`bg-white rounded-lg p-5 border shadow-sm ${item.quantity === 0 ? 'border-red-300' : item.quantity < 5 ? 'border-red-200' : 'border-amber-200'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-gray-800 font-semibold">{item.product?.name}</h3>
                    <p className="text-gray-500 text-xs font-mono mt-1">{item.product?.sku}</p>
                    <p className="text-gray-600 text-sm mt-2">{item.warehouse?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-bold ${item.quantity === 0 ? 'text-red-600' : item.quantity < 5 ? 'text-red-500' : 'text-amber-500'}`}>
                      {item.quantity}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.quantity === 0 ? 'Out of stock' : item.quantity < 5 ? 'Critical' : 'Low'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LowStock;
