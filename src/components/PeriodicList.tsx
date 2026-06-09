import { useMemo, useState } from 'react';
import { Customer } from '../types/customer';
import { Users, Box, GitCompare, Activity, Settings2, Zap, FilterX, CheckCircle, Target, Building2 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { Details } from './Details';
import { isTargetYear } from '../utils/dateHelpers';

export type PeriodicMode = 'all' | 'stations' | 'types' | 'tiRatios' | 'phase1Direct' | 'phase1Indirect' | 'phase3Direct' | 'phase3Indirect' | 'excludeSpecificPrices' | 'replaced2026';

export function PeriodicList({ customers }: { customers: Customer[] }) {
  const [viewMode, setViewMode] = useState<PeriodicMode>('all');

  const periodicCustomers = useMemo(() => {
    return customers.filter(c => c.status !== 'removed' && isTargetYear(c.inspectionExpiry, 2026));
  }, [customers]);

  const replacedCustomers = useMemo(() => {
    return customers.filter(c => c.status !== 'removed' && c.isReplaced);
  }, [customers]);

  const stats = useMemo(() => {
    const totalCustomers = periodicCustomers.length;
    const totalStations = new Set(periodicCustomers.map(c => c.stationCode).filter(Boolean)).size;
    const totalTypes = new Set(periodicCustomers.map(c => c.typeCode).filter(Boolean)).size;
    const totalTiRatios = new Set(periodicCustomers.map(c => c.tiRatio).filter(Boolean)).size;
    const phase1Direct = periodicCustomers.filter(c => String(c.phases).includes('1') && String(c.directIndirectType).toLowerCase().includes('trực tiếp')).length;
    const phase1Indirect = periodicCustomers.filter(c => String(c.phases).includes('1') && String(c.directIndirectType).toLowerCase().includes('gián tiếp')).length;
    const phase3Direct = periodicCustomers.filter(c => String(c.phases).includes('3') && String(c.directIndirectType).toLowerCase().includes('trực tiếp')).length;
    const phase3Indirect = periodicCustomers.filter(c => String(c.phases).includes('3') && String(c.directIndirectType).toLowerCase().includes('gián tiếp')).length;
    const excludeSpecificPrices = periodicCustomers.filter(c => {
      const p = String(c.priceString).replace(/\s+/g, '').toUpperCase();
      return p !== "BT:100%*KDDV-A;CD:100%*KDDV-A;TD:100%*KDDV-A" && 
             p !== "BT:100%*SXBT-A;CD:100%*SXBT-A;TD:100%*SXBT-A" && 
             p !== "BT:100%*3007-KDDV-A;CD:100%*5174-KDDV-A;TD:100%*1830-KDDV-A" &&
             p !== "BT:100%*1896-SXBT-A;CD:100%*3474-SXBT-A;TD:100%*1241-SXBT-A";
    }).length;
  
    return { 
      totalCustomers, 
      totalStations,
      totalTypes, 
      totalTiRatios,
      phase1Direct, 
      phase1Indirect, 
      phase3Direct, 
      phase3Indirect, 
      excludeSpecificPrices,
      replacedCount: replacedCustomers.length,
      totalPlan: totalCustomers + replacedCustomers.length 
    };
  }, [periodicCustomers, replacedCustomers]);

  const activeCustomers = viewMode === 'replaced2026' ? replacedCustomers : periodicCustomers;

  return (
    <div className="flex flex-col w-full h-full bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Danh Sách Thay Định Kỳ - Tiến Độ 2026</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Đã thay: {stats.replacedCount} / Phải Thay: {stats.totalPlan} ({(stats.replacedCount / (stats.totalPlan || 1) * 100).toFixed(1)}%)</p>
        </div>
      </div>

      <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0 overflow-x-auto scrollbar-hide">
        <div className="flex md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 min-w-max md:min-w-0">
          <StatCard
            icon={Target}
            title="Chưa Thay (Cần Thay)"
            value={stats.totalCustomers}
            onClick={() => setViewMode('all')}
            active={viewMode === 'all'}
          />
          <StatCard
            icon={CheckCircle}
            title="Đã thay"
            value={stats.replacedCount}
            onClick={() => setViewMode('replaced2026')}
            active={viewMode === 'replaced2026'}
            highlight
          />
          <StatCard
            icon={Building2}
            title="Số lượng trạm"
            value={stats.totalStations}
            onClick={() => setViewMode('stations')}
            active={viewMode === 'stations'}
          />
          <StatCard
            icon={Box}
            title="Chủng loại công tơ"
            value={stats.totalTypes}
            onClick={() => setViewMode('types')}
            active={viewMode === 'types'}
          />
          <StatCard
            icon={GitCompare}
            title="Tỷ số đấu"
            value={stats.totalTiRatios}
            onClick={() => setViewMode('tiRatios')}
            active={viewMode === 'tiRatios'}
          />
          <StatCard
            icon={Zap}
            title="1 Pha Trực Tiếp"
            value={stats.phase1Direct}
            onClick={() => setViewMode('phase1Direct')}
            active={viewMode === 'phase1Direct'}
          />
          <StatCard
            icon={Settings2}
            title="1 Pha Gián Tiếp"
            value={stats.phase1Indirect}
            onClick={() => setViewMode('phase1Indirect')}
            active={viewMode === 'phase1Indirect'}
          />
          <StatCard
            icon={Activity}
            title="3 Pha Trực Tiếp"
            value={stats.phase3Direct}
            onClick={() => setViewMode('phase3Direct')}
            active={viewMode === 'phase3Direct'}
          />
          <StatCard
            icon={Settings2}
            title="3 Pha Gián Tiếp"
            value={stats.phase3Indirect}
            onClick={() => setViewMode('phase3Indirect')}
            active={viewMode === 'phase3Indirect'}
          />
          <StatCard
            icon={FilterX}
            title="KH Không Thuộc Nhóm Đổi Giá"
            value={stats.excludeSpecificPrices}
            onClick={() => setViewMode('excludeSpecificPrices')}
            active={viewMode === 'excludeSpecificPrices'}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden relative">
        <Details customers={activeCustomers} mode={viewMode as any} />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, onClick, active = false, highlight = false }: { icon: any, title: string, value: number, onClick: () => void, active?: boolean, highlight?: boolean }) {
  return (
    <div 
      onClick={onClick}
      className={twMerge(
        "rounded-xl border shadow-sm overflow-hidden flex items-center p-4 cursor-pointer transition-all",
        active 
          ? "border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/50" 
          : highlight 
            ? "border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/60"
            : "border-slate-200 hover:border-indigo-300 bg-white hover:bg-slate-50"
      )}
    >
      <div className={twMerge(
        "w-10 h-10 rounded-lg flex items-center justify-center mr-3 shrink-0",
        active 
          ? "bg-indigo-100 text-indigo-700" 
          : highlight
            ? "bg-emerald-100 text-emerald-600"
            : "bg-slate-100 text-slate-500"
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className={twMerge(
          "text-[9px] sm:text-[10px] font-bold uppercase tracking-widest truncate",
          active 
            ? "text-indigo-600" 
            : highlight
              ? "text-emerald-700"
              : "text-slate-400"
        )}>
          {title}
        </p>
        <h3 className={twMerge(
          "text-lg sm:text-xl font-black mt-0.5",
          active 
            ? "text-indigo-900" 
            : highlight
              ? "text-emerald-900"
              : "text-slate-900"
        )}>
          {value}
        </h3>
      </div>
    </div>
  );
}

