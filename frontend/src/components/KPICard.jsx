const KPICard = ({ title, value, icon: Icon, color = 'primary', subtitle }) => {
  const colorMap = {
    primary: 'from-primary-500/20 to-primary-600/5 border-primary-500/30 text-primary-400',
    emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30 text-emerald-400',
    amber: 'from-amber-500/20 to-amber-600/5 border-amber-500/30 text-amber-400',
    red: 'from-red-500/20 to-red-600/5 border-red-500/30 text-red-400',
    blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/30 text-blue-400',
    violet: 'from-violet-500/20 to-violet-600/5 border-violet-500/30 text-violet-400',
  };

  const iconBgMap = {
    primary: 'bg-primary-500/20 text-primary-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/20 text-amber-400',
    red: 'bg-red-500/20 text-red-400',
    blue: 'bg-blue-500/20 text-blue-400',
    violet: 'bg-violet-500/20 text-violet-400',
  };

  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-2xl p-5 transition-all duration-300 hover:shadow-glow slide-up`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-surface-400 font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {subtitle && <p className="text-xs text-surface-400 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`w-12 h-12 rounded-xl ${iconBgMap[color]} flex items-center justify-center`}>
            <Icon size={24} />
          </div>
        )}
      </div>
    </div>
  );
};

export default KPICard;
