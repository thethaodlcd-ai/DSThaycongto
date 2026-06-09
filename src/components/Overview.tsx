import { useMemo } from 'react';
import { Customer } from '../types/customer';
import { Users, Book, Building2, AlertTriangle, Zap, Activity, Box, GitCompare, FileText, Settings2, CalendarClock, FileEdit, Trash2, PlusCircle, Shapes } from 'lucide-react';
import { isExpiringSoonOrOverdue, isTargetYear } from '../utils/dateHelpers';

interface OverviewProps {
  customers: Customer[];
  onNavigate: (mode: 'all' | 'books' | 'stations' | 'overdue' | 'phase1' | 'phase3' | 'types' | 'tiRatios' | 'notesAndSolar' | 'phase1Direct' | 'phase1Indirect' | 'phase3Direct' | 'phase3Indirect' | 'periodic2026' | 'changedCustomers' | 'removedCustomers' | 'newCustomers' | 'customerTypes' | 'customersWithPE') => void;
}

export function Overview({ customers, onNavigate }: OverviewProps) {
  const stats = useMemo(() => {
    const currentCustomers = customers.filter(c => c.status !== 'removed');
    
    const uniqueBooks = new Set(currentCustomers.map(c => c.bookCode).filter(Boolean));
    const uniqueStations = new Set(currentCustomers.map(c => c.stationCode).filter(Boolean));
    const uniqueTypes = new Set(currentCustomers.map(c => c.typeCode).filter(Boolean));
    const uniqueTiRatios = new Set(currentCustomers.map(c => c.tiRatio).filter(Boolean));
    
    // Thống kê quá hạn thay / có ghi chú, NLMT
    const notesAndSolarCustomers = currentCustomers.filter(c => c.notes?.trim() || c.solarPower?.trim());
    const notesAndSolarCount = notesAndSolarCustomers.length;
    const totalSolarPower = notesAndSolarCustomers.reduce((sum, c) => {
      const power = parseFloat(c.solarPower?.replace(',', '.') || '0');
      return sum + (isNaN(power) ? 0 : power);
    }, 0);

    const overdueCount = currentCustomers.filter(c => isExpiringSoonOrOverdue(c.inspectionExpiry)).length;
    const periodic2026Count = currentCustomers.filter(c => isTargetYear(c.inspectionExpiry, 2026)).length;
    const changedCount = currentCustomers.filter(c => c.changes && Object.keys(c.changes).length > 0).length;
    
    // Status counts
    const removedCount = customers.filter(c => c.status === 'removed').length;
    const newCount = currentCustomers.filter(c => c.status === 'new').length;
    
    // Types counts by priceString using mutually exclusive classification
    let shbtCount = 0;
    let cqbvCount = 0;
    let cqhcCount = 0;
    let kddvCount = 0;
    let sxbtCount = 0;
    let mixedCount = 0;
    let otherCount = 0;

    currentCustomers.forEach(c => {
      const p = c.priceString || '';
      const hasSHBT = p.includes('SHBT');
      const hasCQBV = p.includes('CQBV');
      const hasCQHC = p.includes('CQHC');
      const hasKDDV = p.includes('KDDV');
      const hasSXBT = p.includes('SXBT');
      
      const matchCount = [hasSHBT, hasCQBV, hasCQHC, hasKDDV, hasSXBT].filter(Boolean).length;
      
      if (matchCount > 1) {
        mixedCount++;
      } else if (matchCount === 0) {
        otherCount++;
      } else {
        if (hasSHBT) shbtCount++;
        else if (hasCQBV) cqbvCount++;
        else if (hasCQHC) cqhcCount++;
        else if (hasKDDV) kddvCount++;
        else if (hasSXBT) sxbtCount++;
      }
    });
    
    // Pha cơ bản
    const phase1Count = currentCustomers.filter(c => String(c.phases).includes('1')).length;
    const phase3Count = currentCustomers.filter(c => String(c.phases).includes('3')).length;

    // Phân loại chi tiết pha & trực tiếp/gián tiếp
    const phase1Direct = currentCustomers.filter(c => String(c.phases).includes('1') && String(c.directIndirectType).toLowerCase().includes('trực tiếp')).length;
    const phase1Indirect = currentCustomers.filter(c => String(c.phases).includes('1') && String(c.directIndirectType).toLowerCase().includes('gián tiếp')).length;
    
    const phase3Direct = currentCustomers.filter(c => String(c.phases).includes('3') && String(c.directIndirectType).toLowerCase().includes('trực tiếp')).length;
    const phase3Indirect = currentCustomers.filter(c => String(c.phases).includes('3') && String(c.directIndirectType).toLowerCase().includes('gián tiếp')).length;

    const peCount = currentCustomers.filter(c => c.customerCode?.includes('PE')).length;

    return {
      totalCustomers: currentCustomers.length,
      totalBooks: uniqueBooks.size,
      totalStations: uniqueStations.size,
      totalTypes: uniqueTypes.size,
      totalTiRatios: uniqueTiRatios.size,
      notesAndSolarCount,
      totalSolarPower,
      overdueCount,
      periodic2026Count,
      changedCount,
      removedCount,
      newCount,
      shbtCount,
      cqbvCount,
      cqhcCount,
      kddvCount,
      sxbtCount,
      mixedCount,
      otherCount,
      phase1Count,
      phase3Count,
      phase1Direct,
      phase1Indirect,
      phase3Direct,
      phase3Indirect,
      peCount,
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
            title="QUÁ HẠN KIỂN ĐINH (%)"
            value={stats.overdueCount}
            subtitle={`Chiếm ${((stats.overdueCount / (stats.periodic2026Count || 1)) * 100).toFixed(1)}% so với Tổng Thay ĐK 2026`}
            onClick={() => onNavigate('overdue')}
            highlight
          />
          <StatCard
            icon={CalendarClock}
            title="Thay định kỳ 2026"
            value={stats.periodic2026Count}
            onClick={() => onNavigate('periodic2026')}
            highlight
          />
          <StatCard
            icon={Zap}
            title="Khách hàng có PE"
            value={stats.peCount}
            onClick={() => onNavigate('customersWithPE')}
            highlight
          />
          <StatCard
            icon={FileEdit}
            title="Khách hàng có thay đổi"
            value={stats.changedCount}
            onClick={() => onNavigate('changedCustomers')}
            highlight
          />
          <StatCard
            icon={Trash2}
            title="Khách hàng thanh lý"
            value={stats.removedCount}
            onClick={() => onNavigate('removedCustomers')}
            highlight
          />
          <StatCard
            icon={PlusCircle}
            title="Khách hàng lắp mới"
            value={stats.newCount}
            onClick={() => onNavigate('newCustomers')}
            highlight
          />
          <StatCard
            icon={Shapes}
            title="Loại khách hàng"
            value={stats.shbtCount + stats.cqbvCount + stats.cqhcCount + stats.kddvCount + stats.sxbtCount + stats.mixedCount + stats.otherCount}
            onClick={() => onNavigate('customerTypes')}
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
          <StatCard
            icon={FileText}
            title="Khách hàng NLMT"
            value={stats.notesAndSolarCount}
            subtitle={`Tổng công suất: ${stats.totalSolarPower.toLocaleString('vi-VN')} kWp`}
            onClick={() => onNavigate('notesAndSolar')}
            highlight
          />
          <StatCard
            icon={Zap}
            title="1 Pha Trực Tiếp"
            value={stats.phase1Direct}
            onClick={() => onNavigate('phase1Direct')}
          />
          <StatCard
            icon={Settings2}
            title="1 Pha Gián Tiếp"
            value={stats.phase1Indirect}
            onClick={() => onNavigate('phase1Indirect')}
          />
          <StatCard
            icon={Activity}
            title="3 Pha Trực Tiếp"
            value={stats.phase3Direct}
            onClick={() => onNavigate('phase3Direct')}
          />
          <StatCard
            icon={Settings2}
            title="3 Pha Gián Tiếp"
            value={stats.phase3Indirect}
            onClick={() => onNavigate('phase3Indirect')}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, onClick, highlight = false, subtitle }: { icon: any, title: string, value: number | string, onClick: () => void, highlight?: boolean, subtitle?: string }) {
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
        {subtitle && <p className={`text-xs font-medium mt-1 ${highlight ? 'text-red-500' : 'text-indigo-600'}`}>{subtitle}</p>}
      </div>
    </div>
  );
}
