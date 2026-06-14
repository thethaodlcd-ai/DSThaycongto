import { useMemo, useState } from 'react';
import { Customer } from '../types/customer';
import { Users, FileText, Settings2, Zap, AlertTriangle, Component, DownloadCloud, CalendarDays } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { isExpiringSoonOrOverdue, isExpiringInCurrentYear, isTargetYear } from '../utils/dateHelpers';
import Papa from 'papaparse';

interface TIListProps {
  customers: Customer[];
  tiCustomers: any[];
}

type ViewMode = 'all' | 'multiple' | 'expiring' | 'expiringYear';

export function TIList({ customers, tiCustomers }: TIListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('all');

  const mergedData = useMemo(() => {
    const tiMap = new Map<string, any[]>();
    tiCustomers.forEach(row => {
      const codeKey = Object.keys(row).find(k => k.includes('mã khách') || k.includes('ma khach'));
      if (codeKey && row[codeKey]) {
        const cCode = String(row[codeKey]).trim().toUpperCase();
        if (!tiMap.has(cCode)) {
          tiMap.set(cCode, []);
        }
        tiMap.get(cCode)!.push(row);
      }
    });

    const results = [];
    for (const c of customers) {
      if (c.status !== 'removed' && c.customerCode) {
        const cCode = c.customerCode.trim().toUpperCase();
        if (tiMap.has(cCode)) {
          const rows = tiMap.get(cCode)!;
          
          // Try to filter to just TI rows
          const tiRows = rows.filter(r => {
            const vhCongKey = Object.keys(r).find(k => k === 'vh_cong');
            if (vhCongKey && String(r[vhCongKey]).toUpperCase() === 'TI') return true;
            const tsKey = Object.keys(r).find(k => k.includes('tỷ số') || k.includes('ty so'));
            if (tsKey && String(r[tsKey]).trim() !== '') return true;
            return false;
          });

          // if empty, use all rows and just slice them
          const validRows = tiRows.length > 0 ? tiRows : rows;

          const tiDevices: string[] = [];
          const tiExpiries: string[] = [];
          let tySoTi = '';

          validRows.forEach(r => {
            const soThietBiKey = Object.keys(r).find(k => k.includes('số thiết bị') || k.includes('so thiet bi'));
            const hanKDKey = Object.keys(r).find(k => k.includes('hạn kiểm định') || k.includes('han kiem dinh'));
            const tsKey = Object.keys(r).find(k => k.includes('tỷ số') || k.includes('ty so'));

            if (soThietBiKey && r[soThietBiKey]) {
              const tb = String(r[soThietBiKey]).trim();
              if (tb) tiDevices.push(tb);
            }
            if (hanKDKey && r[hanKDKey]) {
              const hkd = String(r[hanKDKey]).trim();
              // Only push to expiries if it correlates with a device
              tiExpiries.push(hkd);
            } else {
              tiExpiries.push('');
            }

            if (tsKey && r[tsKey] && !tySoTi) {
              tySoTi = String(r[tsKey]).trim();
            }
          });

          // Ensure arrays are at least size 3
          while (tiDevices.length < 3) tiDevices.push('');
          while (tiExpiries.length < 3) tiExpiries.push('');
          
          results.push({
            customer: c,
            tiDevices: [tiDevices[0], tiDevices[1], tiDevices[2]],
            tiExpiries: [tiExpiries[0], tiExpiries[1], tiExpiries[2]],
            tySoTi
          });
        }
      }
    }
    return results;
  }, [customers, tiCustomers]);

  const filteredData = useMemo(() => {
    return mergedData.filter(item => {
      if (viewMode === 'multiple') return !!item.tiDevices[1];
      if (viewMode === 'expiring') return item.tiExpiries.some(e => e && isExpiringSoonOrOverdue(e));
      if (viewMode === 'expiringYear') return item.tiExpiries.some(e => e && isExpiringInCurrentYear(e));
      return true;
    });
  }, [mergedData, viewMode]);

  const handleExport = () => {
    const exportData = filteredData.map((item, index) => ({
      'STT': index + 1,
      'Mã Khách Hàng': item.customer.customerCode || '',
      'Tên Khách Hàng': item.customer.customerName || '',
      'Địa Chỉ': item.customer.address || '',
      'Số TB Công Tơ': item.customer.deviceNumber || '',
      'Mã Chủng Loại': item.customer.typeCode || '',
      'Hạn KĐ': item.customer.inspectionExpiry || '',
      'Tỷ Số TI': item.tySoTi || '',
      'Số TB TI 1': item.tiDevices[0] || '',
      'Hạn KĐ TI 1': item.tiExpiries[0] || '',
      'Số TB TI 2': item.tiDevices[1] || '',
      'Hạn KĐ TI 2': item.tiExpiries[1] || '',
      'Số TB TI 3': item.tiDevices[2] || '',
      'Hạn KĐ TI 3': item.tiExpiries[2] || '',
    }));

    // Add BOM to ensure Excel opens CSV with correct encoding
    const csv = '\uFEFF' + Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    // Format current date for filename
    const dateStr = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
    link.setAttribute('href', url);
    link.setAttribute('download', `Danh-sach-khach-hang-co-TI_${viewMode}_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Danh Sách Khách Hàng Có TI</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Đã tìm thấy {filteredData.length} khách hàng có TI khớp mã</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Users}
            title="KHÁCH HÀNG CÓ TI"
            value={mergedData.length}
            isActive={viewMode === 'all'}
            onClick={() => setViewMode('all')}
            highlight={false}
          />
          <StatCard
            icon={Zap}
            title="CÓ NHIỀU HƠN 1 TI"
            value={mergedData.filter(d => d.tiDevices[1]).length}
            isActive={viewMode === 'multiple'}
            onClick={() => setViewMode('multiple')}
            highlight={false}
          />
          <StatCard
            icon={CalendarDays}
            title="TI ĐẾN HẠN KĐ"
            value={mergedData.filter(d => d.tiExpiries.some(e => e && isExpiringInCurrentYear(e))).length}
            isActive={viewMode === 'expiringYear'}
            onClick={() => setViewMode('expiringYear')}
            highlight={false}
          />
          <StatCard
            icon={AlertTriangle}
            title="TI QUÁ HẠN KIỂM ĐỊNH"
            value={mergedData.filter(d => d.tiExpiries.some(e => e && isExpiringSoonOrOverdue(e))).length}
            isActive={viewMode === 'expiring'}
            onClick={() => setViewMode('expiring')}
            highlight={mergedData.filter(d => d.tiExpiries.some(e => e && isExpiringSoonOrOverdue(e))).length > 0}
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px] flex-1">
          <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
            <h3 className="text-lg font-bold text-slate-800">
              {viewMode === 'all' && 'Chi tiết đối chiếu TI'}
              {viewMode === 'multiple' && 'Khách hàng có nhiều hơn 1 TI'}
              {viewMode === 'expiringYear' && 'TI đến hạn kiểm định (trong năm nay)'}
              {viewMode === 'expiring' && 'TI quá hạn kiểm định (Gần hoặc đã quá hạn)'}
            </h3>
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={filteredData.length === 0}
            >
              <DownloadCloud className="w-4 h-4" />
              <span>Xuất File Excel (.csv)</span>
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            <div className="min-w-[1400px] h-full flex flex-col">
              {/* Header */}
              <div className="grid grid-cols-[60px_100px_minmax(150px,1.5fr)_minmax(150px,2fr)_100px_100px_100px_80px_120px_80px_120px_80px_120px_80px] gap-2 bg-slate-50 border-b border-slate-200 p-4 text-[10px] sm:text-xs font-bold text-slate-500 uppercase sticky top-0 z-10">
                <div>STT</div>
                <div>Mã K.Hàng</div>
                <div>Tên Khách Hàng</div>
                <div>Địa Chỉ</div>
                <div>Số TB C.Tơ</div>
                <div>Mã C.Loại</div>
                <div>Hạn KĐ</div>
                <div>Tỷ Số TI</div>
                <div>Số TB TI 1</div>
                <div>Hạn KĐ TI 1</div>
                <div>Số TB TI 2</div>
                <div>Hạn KĐ TI 2</div>
                <div>Số TB TI 3</div>
                <div>Hạn KĐ TI 3</div>
              </div>
              
              {/* List */}
              <div className="divide-y divide-slate-100 overflow-y-auto w-full flex-1">
                {filteredData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
                    <Component className="w-12 h-12 mb-4 opacity-50" />
                    <p>Không có dữ liệu đối chiếu hoặc chưa tải được Danh Sách TI.</p>
                  </div>
                ) : (
                  <div>
                    {filteredData.map((item, index) => {
                      const { customer, tiDevices, tiExpiries, tySoTi } = item;
                      
                      return (
                        <div key={customer.customerCode + index} className="grid grid-cols-[60px_100px_minmax(150px,1.5fr)_minmax(150px,2fr)_100px_100px_100px_80px_120px_80px_120px_80px_120px_80px] gap-2 p-4 text-xs sm:text-sm items-center hover:bg-slate-50 transition-colors">
                          <div className="text-slate-400 font-medium tracking-wider">#{index + 1}</div>
                          
                          <div>
                            <span className="font-mono font-bold text-indigo-600">{customer.customerCode}</span>
                          </div>
                          
                          <div className="font-semibold text-slate-900 truncate" title={customer.customerName}>
                            {customer.customerName || '-'}
                          </div>
                          
                          <div className="text-slate-500 truncate text-xs" title={customer.address}>
                            {customer.address || '-'}
                          </div>
                          
                          <div className="text-slate-700 font-medium font-mono">
                            {customer.deviceNumber || '-'}
                          </div>

                          <div className="font-mono text-slate-500 text-xs truncate">
                            {customer.typeCode || '-'}
                          </div>
                          
                          <div>
                            <span className={twMerge(
                              "px-2 py-1 rounded-md text-[10px] font-bold whitespace-nowrap uppercase tracking-wider",
                              isExpiringSoonOrOverdue(customer.inspectionExpiry)
                                ? "bg-red-100 text-red-700"
                                : isTargetYear(customer.inspectionExpiry, 2026)
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-100 text-slate-600"
                            )}>
                              {customer.inspectionExpiry || '-'}
                            </span>
                          </div>

                          <div className="text-emerald-600 font-bold font-mono text-xs truncate bg-emerald-50 px-2 py-1 rounded inline-block" title={tySoTi}>
                            {tySoTi || '-'}
                          </div>

                          <div className="text-amber-600 font-bold font-mono text-[10px] sm:text-xs xl:text-sm truncate" title={tiDevices[0]}>
                            {tiDevices[0] || '-'}
                          </div>
                          <div className={twMerge("font-bold font-mono text-[10px] sm:text-xs", tiExpiries[0] && isExpiringSoonOrOverdue(tiExpiries[0]) ? "text-red-600 bg-red-50 px-1.5 py-0.5 rounded w-fit" : tiExpiries[0] && isExpiringInCurrentYear(tiExpiries[0]) ? "text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded w-fit" : "text-slate-600")}>
                            {tiExpiries[0] || '-'}
                          </div>

                          <div className="text-amber-600 font-bold font-mono text-[10px] sm:text-xs xl:text-sm truncate" title={tiDevices[1]}>
                            {tiDevices[1] || '-'}
                          </div>
                          <div className={twMerge("font-bold font-mono text-[10px] sm:text-xs", tiExpiries[1] && isExpiringSoonOrOverdue(tiExpiries[1]) ? "text-red-600 bg-red-50 px-1.5 py-0.5 rounded w-fit" : tiExpiries[1] && isExpiringInCurrentYear(tiExpiries[1]) ? "text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded w-fit" : "text-slate-600")}>
                            {tiExpiries[1] || '-'}
                          </div>

                          <div className="text-amber-600 font-bold font-mono text-[10px] sm:text-xs xl:text-sm truncate" title={tiDevices[2]}>
                            {tiDevices[2] || '-'}
                          </div>
                          <div className={twMerge("font-bold font-mono text-[10px] sm:text-xs", tiExpiries[2] && isExpiringSoonOrOverdue(tiExpiries[2]) ? "text-red-600 bg-red-50 px-1.5 py-0.5 rounded w-fit" : tiExpiries[2] && isExpiringInCurrentYear(tiExpiries[2]) ? "text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded w-fit" : "text-slate-600")}>
                            {tiExpiries[2] || '-'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, onClick, highlight = false, isActive = false, subtitle }: { icon: any, title: string, value: number | string, onClick?: () => void, highlight?: boolean, isActive?: boolean, subtitle?: string }) {
  return (
    <div 
      onClick={onClick}
      className={twMerge(
        "bg-white rounded-2xl border shadow-sm overflow-hidden flex items-center p-6 transition-all group cursor-pointer hover:shadow-md",
        isActive ? 'ring-2 ring-indigo-500 border-transparent shadow-md' : 'border-slate-100',
        highlight && isActive ? 'ring-red-500' : ''
      )}
    >
      <div className={twMerge(
        "w-12 h-12 rounded-xl flex items-center justify-center mr-4",
        highlight ? 'bg-red-50 border border-red-100 text-red-500' : 'bg-slate-50 border border-slate-100 text-indigo-500',
        isActive && highlight ? 'bg-red-100' : '',
        isActive && !highlight ? 'bg-indigo-100 text-indigo-600' : ''
      )}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className={twMerge(
          "text-[10px] font-bold uppercase tracking-widest",
          highlight ? 'text-red-400' : 'text-slate-400',
          isActive && !highlight ? 'text-indigo-500' : ''
        )}>{title}</p>
        <h3 className="text-3xl font-black text-slate-900 mt-0.5">{value}</h3>
        {subtitle && <p className={twMerge(
          "text-xs font-medium mt-1",
          highlight ? 'text-red-500' : 'text-indigo-600'
        )}>{subtitle}</p>}
      </div>
    </div>
  );
}
