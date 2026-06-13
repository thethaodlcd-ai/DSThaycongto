import { useMemo, useState } from 'react';
import { Customer } from '../types/customer';
import { Users, FileText, Settings2, Zap, AlertTriangle, Component, DownloadCloud } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { isExpiringSoonOrOverdue, isTargetYear } from '../utils/dateHelpers';
import Papa from 'papaparse';

interface TIListProps {
  customers: Customer[];
  tiCustomers: any[];
}

export function TIList({ customers, tiCustomers }: TIListProps) {
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

  const handleExport = () => {
    const exportData = mergedData.map((item, index) => ({
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
    link.setAttribute('download', `Danh-sach-khach-hang-co-TI_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col w-full h-full bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Danh Sách Khách Hàng Có TI</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Đã tìm thấy {mergedData.length} khách hàng có TI khớp mã</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={mergedData.length === 0}
        >
          <DownloadCloud className="w-4 h-4" />
          <span>Xuất File Excel (.csv)</span>
        </button>
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="min-w-[1400px] h-full flex flex-col">
          {/* Header */}
          <div className="grid grid-cols-[60px_100px_minmax(150px,1.5fr)_minmax(150px,2fr)_100px_100px_100px_80px_120px_80px_120px_80px_120px_80px] gap-2 bg-slate-100 p-3 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase shrink-0 sticky top-0 z-10 shadow-sm">
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
          <div className="flex-1 overflow-y-auto">
            {mergedData.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
                <Component className="w-12 h-12 mb-4 opacity-50" />
                <p>Không có dữ liệu đối chiếu hoặc chưa tải được Danh Sách TI.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {mergedData.map((item, index) => {
                  const { customer, tiDevices, tiExpiries, tySoTi } = item;
                  
                  return (
                    <div key={customer.customerCode + index} className="grid grid-cols-[60px_100px_minmax(150px,1.5fr)_minmax(150px,2fr)_100px_100px_100px_80px_120px_80px_120px_80px_120px_80px] gap-2 p-3 text-sm items-center hover:bg-white transition-colors bg-white/50 border-b border-slate-50">
                      <div className="text-slate-400 font-medium">#{index + 1}</div>
                      
                      <div>
                        <span className="font-mono font-bold text-indigo-600">{customer.customerCode}</span>
                      </div>
                      
                      <div className="font-medium text-slate-900 truncate" title={customer.customerName}>
                        {customer.customerName || '-'}
                      </div>
                      
                      <div className="text-slate-500 truncate text-xs" title={customer.address}>
                        {customer.address || '-'}
                      </div>
                      
                      <div className="text-slate-700 font-medium">
                        {customer.deviceNumber || '-'}
                      </div>

                      <div className="font-mono text-slate-500 text-xs truncate">
                        {customer.typeCode || '-'}
                      </div>
                      
                      <div>
                        <span className={twMerge(
                          "px-2 py-1 rounded-md text-[10px] sm:text-xs font-bold whitespace-nowrap",
                          isExpiringSoonOrOverdue(customer.inspectionExpiry)
                            ? "bg-red-100 text-red-700"
                            : isTargetYear(customer.inspectionExpiry, 2026)
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                        )}>
                          {customer.inspectionExpiry || '-'}
                        </span>
                      </div>

                      <div className="text-emerald-600 font-bold font-mono text-xs truncate" title={tySoTi}>
                        {tySoTi || '-'}
                      </div>

                      <div className="text-amber-600 font-bold font-mono text-xs truncate" title={tiDevices[0]}>
                        {tiDevices[0] || '-'}
                      </div>
                      <div className="text-slate-600 font-bold font-mono text-[10px] sm:text-xs">
                        {tiExpiries[0] || '-'}
                      </div>

                      <div className="text-amber-600 font-bold font-mono text-xs truncate" title={tiDevices[1]}>
                        {tiDevices[1] || '-'}
                      </div>
                      <div className="text-slate-600 font-bold font-mono text-[10px] sm:text-xs">
                        {tiExpiries[1] || '-'}
                      </div>

                      <div className="text-amber-600 font-bold font-mono text-xs truncate" title={tiDevices[2]}>
                        {tiDevices[2] || '-'}
                      </div>
                      <div className="text-slate-600 font-bold font-mono text-[10px] sm:text-xs">
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
  );
}
