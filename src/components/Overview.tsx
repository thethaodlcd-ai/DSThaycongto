import { useMemo } from 'react';
import { Customer } from '../types/customer';
import { Users, Book, Building2, Zap } from 'lucide-react';

interface OverviewProps {
  customers: Customer[];
}

export function Overview({ customers, onNavigate }: OverviewProps & { onNavigate: (mode: 'all'|'books'|'stations') => void }) {
  const stats = useMemo(() => {
    const uniqueBooks = new Set(customers.map(c => c.bookCode).filter(Boolean));
    const uniqueStations = new Set(customers.map(c => c.stationCode).filter(Boolean));
    
    return {
      totalCustomers: customers.length,
      totalBooks: uniqueBooks.size,
      totalStations: uniqueStations.size,
    };
  }, [customers]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Tổng quan hệ thống</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Thông tin thống kê từ danh sách Google Sheet.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, onClick }: { icon: any, title: string, value: number, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex items-center p-6 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all group"
    >
      <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 mr-4">
        <Icon className="w-6 h-6 text-indigo-500" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        <h3 className="text-2xl font-black text-slate-900 mt-0.5">{value}</h3>
      </div>
    </div>
  );
}
