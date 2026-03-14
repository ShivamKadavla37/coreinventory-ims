import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, warehousesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import OnboardingTour from '../components/OnboardingTour';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import {
  HiOutlineTrendingUp, HiOutlineReply, HiOutlineShoppingCart,
  HiOutlineTruck, HiOutlineArchive, HiOutlineLogout, HiOutlineLogin
} from 'react-icons/hi';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState([]);
  const [filters, setFilters] = useState({ docType: '', status: '', warehouseId: '', category: '' });
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    if (user?.id) {
      const tourKey = `koshnetra_tour_completed_${user.id}`;
      const tourCompleted = localStorage.getItem(tourKey);
      if (!tourCompleted) setShowTour(true);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [filters]);

  const handleFilterChange = (key, val) => {
    setFilters(f => ({ ...f, [key]: val }));
  };

  const fetchData = async () => {
    try {
      const [statsRes, chartRes, lowStockRes, whRes] = await Promise.all([
        dashboardAPI.getStats(filters),
        dashboardAPI.getChart(filters),
        dashboardAPI.getLowStock(filters),
        warehousesAPI.getAll(),
      ]);
      setStats(statsRes.data);
      setChartData(chartRes.data);
      setLowStock(lowStockRes.data);
      setWarehouses(whRes.data);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const warehouseChartData = {
    labels: chartData?.stockByWarehouse?.labels || [],
    datasets: [{
      label: 'Stock Quantity',
      data: chartData?.stockByWarehouse?.data || [],
      backgroundColor: 'rgba(244, 63, 94, 0.15)',
      borderColor: 'rgba(244, 63, 94, 0.8)',
      borderWidth: 2,
      borderRadius: 6,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#1f2937',
        bodyColor: '#6b7280',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 12 } } },
      y: { grid: { color: '#f3f4f6' }, ticks: { color: '#9ca3af', font: { size: 12 } } },
    },
  };

  return (
    <div className="fade-in">
      {/* Onboarding Tour for new users */}
      {showTour && <OnboardingTour userId={user?.id} onComplete={() => setShowTour(false)} />}

      {/* Sub-header */}
      <div className="sub-header">
        <h1 className="page-title">Dashboard</h1>
      </div>

      <div className="bg-white border-b border-gray-200 px-6 py-3 mb-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500">Filters:</span>
          </div>
          <select value={filters.docType} onChange={e => handleFilterChange('docType', e.target.value)} className="select-field py-1.5 text-sm w-40">
            <option value="">All Doc Types</option>
            <option value="receipt">Receipts</option>
            <option value="delivery">Deliveries</option>
            <option value="transfer">Internal Transfers</option>
          </select>
          <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} className="select-field py-1.5 text-sm w-40">
            <option value="">All Statuses</option>
            <option value="draft">Draft (Waiting)</option>
            <option value="validated">Done</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select value={filters.warehouseId} onChange={e => handleFilterChange('warehouseId', e.target.value)} className="select-field py-1.5 text-sm w-48">
            <option value="">All Warehouses</option>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <select value={filters.category} onChange={e => handleFilterChange('category', e.target.value)} className="select-field py-1.5 text-sm w-40">
            <option value="">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Furniture">Furniture</option>
            <option value="Supplies">Supplies</option>
            <option value="Hygiene">Hygiene</option>
            <option value="Clothing">Clothing</option>
            <option value="Food">Food</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div className="p-6 pt-0 max-w-7xl mx-auto space-y-6">
        
        {/* KPI Top Blocks matching UI image */}
        <div className="bg-gray-50/50 p-6 rounded-xl border border-gray-100 mb-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Sales */}
            <div className="bg-white p-4 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-100 flex items-center justify-between">
              <HiOutlineTrendingUp className="text-red-500 w-10 h-10" />
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Sales</p>
                <p className="text-gray-800 font-medium">{stats?.kpis?.delivery || 0} Qty.</p>
              </div>
            </div>
            {/* Sales Rtrn. */}
            <div className="bg-white p-4 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-100 flex items-center justify-between">
              <HiOutlineReply className="text-amber-500 w-10 h-10" />
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Sales Rtrn.</p>
                <p className="text-gray-800 font-medium">{stats?.kpis?.adjustment || 0} Qty.</p>
              </div>
            </div>
            {/* Purchase */}
            <div className="bg-white p-4 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-100 flex items-center justify-between">
              <HiOutlineShoppingCart className="text-blue-500 w-10 h-10" />
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Purchase</p>
                <p className="text-gray-800 font-medium">{stats?.kpis?.receipt || 0} Qty.</p>
              </div>
            </div>
            {/* Purchase Rtrn. */}
            <div className="bg-white p-4 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-100 flex items-center justify-between">
              <HiOutlineReply className="text-lime-500 w-10 h-10" style={{ transform: 'scaleX(-1)' }} />
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Purchase Rtrn.</p>
                <p className="text-gray-800 font-medium">0 Qty.</p>
              </div>
            </div>
            {/* Delivery Order */}
            <div className="bg-white p-4 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-100 flex items-center justify-between">
              <HiOutlineTruck className="text-lime-500 w-10 h-10" />
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Delivery Order</p>
                <p className="text-gray-800 font-medium">{stats?.pendingDeliveries || 0} Qty.</p>
              </div>
            </div>
            {/* Goods Receive */}
            <div className="bg-white p-4 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-100 flex items-center justify-between">
              <HiOutlineArchive className="text-blue-500 w-10 h-10" />
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Goods Receive</p>
                <p className="text-gray-800 font-medium">{stats?.kpis?.receipt || 0} Qty.</p>
              </div>
            </div>
            {/* Transfer Out */}
            <div className="bg-white p-4 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-100 flex items-center justify-between">
              <HiOutlineLogout className="text-amber-500 w-10 h-10" />
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Transfer Out</p>
                <p className="text-gray-800 font-medium">{stats?.kpis?.transfer_out || 0} Qty.</p>
              </div>
            </div>
            {/* Transfer In */}
            <div className="bg-white p-4 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-100 flex items-center justify-between">
              <HiOutlineLogin className="text-red-500 w-10 h-10" />
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Transfer In</p>
                <p className="text-gray-800 font-medium">{stats?.kpis?.transfer_in || 0} Qty.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Operation Cards — matching Excalidraw layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(!filters.docType || filters.docType === 'receipt') && (
          <div
            className="op-card border-l-4 border-l-rose-500 hover:border-l-rose-600"
            onClick={() => navigate('/receipts')}
          >
            <h3 className="op-card-title flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Receipts
            </h3>
            <div className="space-y-1.5">
              {stats?.pendingReceipts > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{stats.pendingReceiptsQty || 0} units</span>
                  <span className={!filters.status ? 'badge-neutral' : filters.status === 'validated' ? 'badge-success' : filters.status === 'cancelled' ? 'badge-neutral' : 'badge-warning'}>
                    {!filters.status ? 'All Statuses' : filters.status === 'validated' ? 'Done' : filters.status === 'cancelled' ? 'Cancelled' : 'Waiting'}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Operations</span>
                <span className="text-sm font-semibold text-gray-700">{stats?.pendingReceipts || 0}</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <button className="text-rose-500 text-sm font-medium hover:text-rose-600 transition-colors">
                {stats?.pendingReceipts || 0} to View →
              </button>
            </div>
          </div>
          )}

          {(!filters.docType || filters.docType === 'delivery') && (
          <div
            className="op-card border-l-4 border-l-blue-500 hover:border-l-blue-600"
            onClick={() => navigate('/deliveries')}
          >
            <h3 className="op-card-title flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Delivery
            </h3>
            <div className="space-y-1.5">
              {stats?.pendingDeliveries > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{stats.pendingDeliveriesQty || 0} units</span>
                  <span className={!filters.status ? 'badge-neutral' : filters.status === 'validated' ? 'badge-success' : filters.status === 'cancelled' ? 'badge-neutral' : 'badge-warning'}>
                    {!filters.status ? 'All Statuses' : filters.status === 'validated' ? 'Done' : filters.status === 'cancelled' ? 'Cancelled' : 'Waiting'}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Operations</span>
                <span className="text-sm font-semibold text-gray-700">{stats?.pendingDeliveries || 0}</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <button className="text-blue-500 text-sm font-medium hover:text-blue-600 transition-colors">
                {stats?.pendingDeliveries || 0} to View →
              </button>
            </div>
          </div>
          )}

          {(!filters.docType || filters.docType === 'transfer') && (
          <div
            className="op-card border-l-4 border-l-violet-500 hover:border-l-violet-600"
            onClick={() => navigate('/transfers')}
          >
            <h3 className="op-card-title flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-500" />
              Internal Transfers
            </h3>
            <div className="space-y-1.5">
              {stats?.pendingTransfers > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{stats.pendingTransfersQty || 0} units</span>
                  <span className={!filters.status ? 'badge-neutral' : filters.status === 'validated' ? 'badge-success' : filters.status === 'cancelled' ? 'badge-neutral' : 'badge-info'}>
                    {!filters.status ? 'All Statuses' : filters.status === 'validated' ? 'Done' : filters.status === 'cancelled' ? 'Cancelled' : 'In Progress'}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Operations</span>
                <span className="text-sm font-semibold text-gray-700">{stats?.pendingTransfers || 0}</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <button className="text-violet-500 text-sm font-medium hover:text-violet-600 transition-colors">
                {stats?.pendingTransfers || 0} to View →
              </button>
            </div>
          </div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Products</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{stats?.totalProducts || 0}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Stock</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{stats?.totalStock || 0}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Low Stock</p>
            <p className="text-2xl font-bold text-rose-500 mt-1">{stats?.lowStockItems || 0}</p>
          </div>
          <div className="bg-white border-l-4 border-l-red-500 border-t border-r border-b border-gray-200 rounded-lg p-4 shadow-sm">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Out of Stock</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats?.outOfStockItems || 0}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Warehouses</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{stats?.warehouseCount || 0}</p>
          </div>
        </div>

        {/* Chart + Low Stock */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Stock by Warehouse</h2>
            <div className="h-56">
              <Bar data={warehouseChartData} options={chartOptions} />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Low Stock Alerts</h2>
            {lowStock.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-gray-400 text-sm">All stock levels healthy</div>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-2">
                {lowStock.slice(0, 8).map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.product?.name}</p>
                      <p className="text-xs text-gray-400">{item.warehouse?.name}</p>
                    </div>
                    <span className={`text-sm font-bold ${item.quantity === 0 ? 'text-red-600' : item.quantity < 5 ? 'text-red-500' : 'text-amber-500'}`}>
                      {item.quantity} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
