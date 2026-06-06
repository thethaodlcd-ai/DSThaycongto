import { useMemo, useState } from 'react';
import { Customer } from '../types/customer';
import { Users, Box, GitCompare, Activity, Settings2, Zap } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { Details } from './Details';

export type PricingMode = 'all' | 'types' | 'tiRatios' | 'phase1Direct' | 'phase1Indirect' | 'phase3Direct' | 'phase3Indirect';

export function PricingList({ customers }: { customers: Customer[] }) {
  const [viewMode, setViewMode] = useState<PricingMode>('all');

  const pricingCustomers = useMemo(() => {
    return customers.filter(c => {
      const p = String(c.priceString).trim().replace(/\s+/g, '').toUpperCase();
      return p === "BT:100%*KDDV-A;CD:100%*KDDV-A;TD:100%*KDDV-A" || 
             p === "BT:100%*SXBT-A;CD:100%*SXBT-A;TD:100%*SXBT-A" || 
             p === "BT:100%*3007-KDDV-A;CD:100%*5174-KDDV-A;TD:100%*1830-KDDV-A" ||
             p === "BT:100%*1896-SXBT-A;CD:100%*3474-SXBT-A;TD:100%*1241-SXBT-A";
    });
  }, [customers]);

  const stats = useMemo(() => {
    const totalCustomers = pricingCustomers.length;
    const totalTypes = new Set(pricingCustomers.map(c => c.typeCode).filter(Boolean)).size;
    const totalTiRatios = new Set(pricingCustomers.map(c => c.tiRatio).filter(Boolean)).size;
    const phase1Direct = pricingCustomers.filter(c => String(c.phases).includes('1') && String(c.directIndirectType).toLowerCase().includes('trực tiếp')).length;
    const phase1Indirect = pricingCustomers.filter(c => String(c.phases).includes('1') && String(c.directIndirectType).toLowerCase().includes('gián tiếp')).length;
    const phase3Direct = pricingCustomers.filter(c => String(c.phases).includes('3') && String(c.directIndirectType).toLowerCase().includes('trực tiếp')).length;
    const phase3Indirect = pricingCustomers.filter(c => String(c.phases).includes('3') && String(c.directIndirectType).toLowerCase().includes('gián tiếp')).length;
  
    return { totalCustomers, totalTypes, totalTiRatios, phase1Direct, phase1Indirect, phase3Direct, phase3Indirect };
  }, [pricingCustomers]);

  return (
    <div className="flex flex-col w-full h-full bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Danh Sách Thay Thời Gian Cho Biểu Giá</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Đã tìm thấy {pricingCustomers.length} khách hàng có chuỗi giá khớp</p>
        </div>
      </div>

      <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0 overflow-x-auto scrollbar-hide">
        <div className="flex md:grid md:grid-cols-3 lg:grid-cols-4 gap-4 min-w-max md:min-w-0">
          <StatCard
            icon={Users}
            title="Khách hàng"
            value={stats.totalCustomers}
            onClick={() => setViewMode('all')}
            active={viewMode === 'all'}
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
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden relative">
        <Details customers={pricingCustomers} mode={viewMode} />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, onClick, active = false }: { icon: any, title: string, value: number, onClick: () => void, active?: boolean }) {
  return (
    <div 
      onClick={onClick}
      className={twMerge(
        "rounded-xl border shadow-sm overflow-hidden flex items-center p-4 cursor-pointer transition-all",
        active 
          ? "border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/50" 
          : "border-slate-200 hover:border-indigo-300 bg-white hover:bg-slate-50"
      )}
    >
      <div className={twMerge(
        "w-10 h-10 rounded-lg flex items-center justify-center mr-3 shrink-0",
        active ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className={twMerge(
          "text-[9px] sm:text-[10px] font-bold uppercase tracking-widest truncate",
          active ? "text-indigo-600" : "text-slate-400"
        )}>
          {title}
        </p>
        <h3 className={twMerge(
          "text-lg sm:text-xl font-black mt-0.5",
          active ? "text-indigo-900" : "text-slate-900"
        )}>
          {value}
        </h3>
      </div>
    </div>
  );
}
