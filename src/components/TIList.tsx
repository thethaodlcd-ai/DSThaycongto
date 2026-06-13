import { useMemo, useState } from 'react';
import { Customer } from '../types/customer';
import { Users, FileText, Settings2, Zap, AlertTriangle, Component } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { isExpiringSoonOrOverdue, isTargetYear } from '../utils/dateHelpers';

interface TIListProps {
  customers: Customer[];
  tiCustomers: any[];
}

export function TIList({ customers, tiCustomers }: TIListProps) {
  const mergedData = useMemo(() => {
    const tiMap = new Map<string, any>();
    tiCustomers.forEach(row => {
      const codeKey = Object.keys(row).find(k => k.includes('mã khách') || k.includes('ma khach'));
      if (codeKey && row[codeKey]) {
        tiMap.set(String(row[codeKey]).trim().toUpperCase(), row);
      }
    });

    const results = [];
    for (const c of customers) {
      if (c.status !== 'removed' && c.customerCode) {
        const cCode = c.customerCode.trim().toUpperCase();
        if (tiMap.has(cCode)) {
          const tiRow = tiMap.get(cCode);
          const tiKeys = Object.keys(tiRow).filter(k => 
            (k.includes('ti') && k.includes('số')) ||
            k.includes('số máy ti') ||
            k.includes('thiết bị ti')
          );
          
          let nums: string[] = [];
          
          if (tiKeys.length > 0) {
            // First pass exactly check for 1, 2, 3 or A, B, C suffixes to order them
            nums = tiKeys.map(k => String(tiRow[k] || '')).filter(v => v.trim() !== '');
          }

          // ensure we have at least 3 fields, pad if needed
          const tiDevices = [
            nums[0] || '',
            nums[1] || '',
            nums[2] || ''
          ];
          
          results.push({
            customer: c,
            tiDevices
          });
        }
      }
    }
    return results;
  }, [customers, tiCustomers]);

  return (
    <div className="flex flex-col w-full h-full bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Danh Sách Khách Hàng Có TI</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Đã tìm thấy {mergedData.length} khách hàng có TI khớp mã</p>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="min-w-[1200px] h-full flex flex-col">
          {/* Header */}
          <div className="grid grid-cols-[60px_120px_minmax(150px,1.5fr)_minmax(150px,2fr)_120px_120px_100px_100px_100px_100px] gap-4 bg-slate-100 p-4 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase shrink-0 sticky top-0 z-10 shadow-sm">
            <div>STT</div>
            <div>Mã Khách Hàng</div>
            <div>Tên Khách Hàng</div>
            <div>Địa Chỉ</div>
            <div>Số TB C.Tơ</div>
            <div>Mã Chủng Loại</div>
            <div>Hạn KĐ</div>
            <div>Số TB TI 1</div>
            <div>Số TB TI 2</div>
            <div>Số TB TI 3</div>
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
                  const { customer, tiDevices } = item;
                  
                  return (
                    <div key={customer.customerCode + index} className="grid grid-cols-[60px_120px_minmax(150px,1.5fr)_minmax(150px,2fr)_120px_120px_100px_100px_100px_100px] gap-4 p-4 text-sm items-center hover:bg-white transition-colors bg-white/50">
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

                      <div className="text-amber-600 font-bold font-mono text-xs truncate" title={tiDevices[0]}>
                        {tiDevices[0] || '-'}
                      </div>

                      <div className="text-amber-600 font-bold font-mono text-xs truncate" title={tiDevices[1]}>
                        {tiDevices[1] || '-'}
                      </div>

                      <div className="text-amber-600 font-bold font-mono text-xs truncate" title={tiDevices[2]}>
                        {tiDevices[2] || '-'}
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
