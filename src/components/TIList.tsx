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
          // Look for TI device number column
          const tiDeviceKey = Object.keys(tiRow).find(k => 
            k.includes('số thiết bị ti') || 
            k.includes('ti') ||
            k.includes('số máy ti') ||
            k.includes('số thiết bị')
          );
          const tiDeviceNum = tiDeviceKey ? tiRow[tiDeviceKey] : 'Không có thông tin';
          
          results.push({
            customer: c,
            tiDeviceNum
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
        <div className="min-w-[1000px] h-full flex flex-col">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 bg-slate-100 p-4 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase shrink-0 sticky top-0 z-10 shadow-sm">
            <div className="col-span-1">STT</div>
            <div className="col-span-2">Mã Khách Hàng</div>
            <div className="col-span-2">Tên Khách Hàng</div>
            <div className="col-span-2">Địa Chỉ</div>
            <div className="col-span-1">Số TB Công Tơ</div>
            <div className="col-span-1">Số TB TI</div>
            <div className="col-span-1">Mã Chủng Loại</div>
            <div className="col-span-1">Hạn KĐ</div>
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
                  const { customer, tiDeviceNum } = item;
                  
                  return (
                    <div key={customer.customerCode + index} className="grid grid-cols-12 gap-4 p-4 text-sm items-center hover:bg-white transition-colors bg-white/50">
                      <div className="col-span-1 text-slate-400 font-medium">#{index + 1}</div>
                      
                      <div className="col-span-2">
                        <span className="font-mono font-bold text-indigo-600">{customer.customerCode}</span>
                      </div>
                      
                      <div className="col-span-2 font-medium text-slate-900 truncate" title={customer.customerName}>
                        {customer.customerName || '-'}
                      </div>
                      
                      <div className="col-span-2 text-slate-500 truncate text-xs" title={customer.address}>
                        {customer.address || '-'}
                      </div>
                      
                      <div className="col-span-1 text-slate-700 font-medium">
                        {customer.deviceNumber || '-'}
                      </div>

                      <div className="col-span-1 text-amber-600 font-bold">
                        {tiDeviceNum || '-'}
                      </div>
                      
                      <div className="col-span-1 font-mono text-slate-500 text-xs truncate">
                        {customer.typeCode || '-'}
                      </div>
                      
                      <div className="col-span-1">
                        <span className={twMerge(
                          "px-2 py-1 rounded-md text-xs font-bold whitespace-nowrap",
                          isExpiringSoonOrOverdue(customer.inspectionExpiry)
                            ? "bg-red-100 text-red-700"
                            : isTargetYear(customer.inspectionExpiry, 2026)
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                        )}>
                          {customer.inspectionExpiry || '-'}
                        </span>
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
