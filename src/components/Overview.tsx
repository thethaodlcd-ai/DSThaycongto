import { useMemo } from 'react';
import { Customer } from '../types/customer';
import { Users, Book, Building2, AlertTriangle, Zap, Activity, Box, GitCompare } from 'lucide-react';
import { isExpiringSoonOrOverdue } from '../utils/dateHelpers';

interface OverviewProps {
  customers: Customer[];
  onNavigate: (mode: 'all' | 'books' | 'stations' | 'overdue' | 'phase1' | 'phase3' | 'types' | 'tiRatios') => void;
}

export function Overview({ customers, onNavigate }: OverviewProps) {
  const stats = useMemo(() => {
    const uniqueBooks = new Set(customers.map(c => c.bookCode).filter(Boolean));
    const uniqueStations = new Set(customers.map(c => c.stationCode).filter(Boolean));
    const uniqueTypes = new Set(customers.map(c => c.typeCode).filter(Boolean));
    const uniqueTiRatios = new Set(customers.map(c => c.tiRatio).filter(Boolean));
    
    const overdueCount = customers.filter(c => isExpiringSoonOrOverdue(c.inspectionExpiry)).length;
    const phase1Count = customers.filter(c => String(c.phases).includes('1')).length;
    const phase3Count = customers.filter(c => String(c.phases).includes('3')).length;

    return {
      totalCustomers: customers.length,
      totalBooks: uniqueBooks.size,
      totalStations: uniqueStations.size,
      totalTypes: uniqueTypes.size,
      totalTiRatios: uniqueTiRatios.size,
      overdueCount,
      phase1Count,
      phase3Count,
    };
  }, [customers]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Tổng quan hệ thống</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Thông tin thống kê từ danh sách cập nhật.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            icon={Users}
            title="Tổng số khách hàng"
            value={stats.totalCustomers}
            onClick={() => onNavigate('all')}
          />
          <StatCard
            icon={Book}
            title="Số lượng mã sổ"
            value={stats.totalBooks}
            onClick={() => onNavigate('books')}
          />
          <StatCard
            icon={Building2}
            title="Số lượng trạm"
            value={stats.totalStations}
            onClick={() => onNavigate('stations')}
          />
          <StatCard
            icon={AlertTriangle}
            title="Hết hạn KĐ / Quá hạn (≤30đ)"
            value={stats.overdueCount}
            onClick={() => onNavigate('overdue')}
            highlight
          />
          <StatCard
            icon={Zap}
            title="Khách hàng 1 Pha"
            value={stats.phase1Count}
            onClick={() => onNavigate('phase1')}
          />
          <StatCard
            icon={Activity}
            title="Khách hàng 3 Pha"
            value={stats.phase3Count}
            onClick={() => onNavigate('phase3')}
          />
          <StatCard
            icon={Box}
            title="Chủng loại công tơ"
            value={stats.totalTypes}
            onClick={() => onNavigate('types')}
          />
          <StatCard
            icon={GitCompare}
            title="Tỷ số TI đấu"
            value={stats.totalTiRatios}
            onClick={() => onNavigate('tiRatios')}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, onClick, highlight = false }: { icon: any, title: string, value: number, onClick: () => void, highlight?: boolean }) {
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-2xl border ${highlight ? 'border-red-200 hover:border-red-400' : 'border-slate-100 hover:border-indigo-300'} shadow-sm overflow-hidden flex items-center p-6 cursor-pointer hover:shadow-md transition-all group`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${highlight ? 'bg-red-50 border border-red-100 text-red-500' : 'bg-slate-50 border border-slate-100 text-indigo-500'}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className={`text-[10px] font-bold uppercase tracking-widest ${highlight ? 'text-red-400' : 'text-slate-400'}`}>{title}</p>
        <h3 className="text-2xl font-black text-slate-900 mt-0.5">{value}</h3>
      </div>
    </div>
  );
}
