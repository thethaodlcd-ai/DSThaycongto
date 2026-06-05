import { useState, useMemo, useEffect } from 'react';
import { Customer } from '../types/customer';
import { ChevronRight, FileSpreadsheet, MapPin, Phone, Zap, MonitorSmartphone, Share, User, Hash } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

import { FieldWorkSection } from './FieldWorkSection';

interface DetailsProps {
  customers: Customer[];
  mode: 'books' | 'stations' | 'all';
}

export function Details({ customers, mode }: DetailsProps) {
  const [selectedBookCode, setSelectedBookCode] = useState<string | null>(null);
  const [selectedCustomerCode, setSelectedCustomerCode] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [mobilePane, setMobilePane] = useState<'categories' | 'list' | 'detail'>('categories');

  const groupedCustomers = useMemo(() => {
    const groups: Record<string, Customer[]> = {};
    if (mode === 'all') {
      groups['Tất cả khách hàng'] = customers;
    } else if (mode === 'stations') {
      for (const customer of customers) {
        const key = customer.stationCode || 'Không có mã trạm';
        if (!groups[key]) groups[key] = [];
        groups[key].push(customer);
      }
    } else {
      for (const customer of customers) {
        const key = customer.bookCode || 'Không có mã sổ';
        if (!groups[key]) groups[key] = [];
        groups[key].push(customer);
      }
    }
    return groups;
  }, [customers, mode]);

  const bookCodes = Object.keys(groupedCustomers).sort();

  // Auto-select first book and first customer on desktop
  useEffect(() => {
    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    if (isDesktop && bookCodes.length > 0 && !selectedBookCode) {
      setSelectedBookCode(bookCodes[0]);
    }
  }, [bookCodes, selectedBookCode]);

  useEffect(() => {
    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    if (isDesktop && selectedBookCode && groupedCustomers[selectedBookCode] && !selectedCustomerCode) {
      setSelectedCustomerCode(groupedCustomers[selectedBookCode][0]?.customerCode || null);
    }
  }, [selectedBookCode, groupedCustomers, selectedCustomerCode]);

  const activeBookCustomers = selectedBookCode ? groupedCustomers[selectedBookCode] : [];
  
  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return activeBookCustomers;
    const lowerQuery = search.toLowerCase();
    return activeBookCustomers.filter(
      c => c.customerName.toLowerCase().includes(lowerQuery) || c.customerCode.toLowerCase().includes(lowerQuery)
    );
  }, [activeBookCustomers, search]);

  const selectedCustomer = useMemo(() => {
    return activeBookCustomers.find(c => c.customerCode === selectedCustomerCode) || null;
  }, [activeBookCustomers, selectedCustomerCode]);

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden h-full">
      {/* Sidebar: Mã Sổ Selection */}
      <aside className={twMerge(
        "w-full md:w-64 bg-white border-r border-slate-200 flex-col flex-shrink-0 h-full",
        mobilePane === 'categories' ? "flex" : "hidden md:flex"
      )}>
        <div className="p-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {mode === 'all' ? 'Tất cả' : mode === 'stations' ? 'Danh mục Mã Trạm' : 'Danh mục Mã Sổ'}
          </label>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {bookCodes.map(code => (
            <div
              key={code}
              onClick={() => {
                setSelectedBookCode(code);
                setSelectedCustomerCode(null);
                setSearch('');
                setMobilePane('list');
              }}
              className={twMerge(
                "px-4 py-3 cursor-pointer flex justify-between items-center transition-colors border-b border-slate-50 md:border-none",
                selectedBookCode === code 
                   ? "bg-indigo-50 md:border-r-4 border-indigo-600" 
                   : "hover:bg-slate-50 text-slate-600"
              )}
            >
              <span className={selectedBookCode === code ? "font-bold text-indigo-700" : "font-medium text-sm"}>
                {code}
              </span>
              <span className={twMerge(
                "text-[10px] px-2 py-0.5 rounded-full shrink-0 ml-2",
                selectedBookCode === code ? "bg-indigo-100 text-indigo-600 font-bold" : "bg-slate-100 text-slate-400 font-medium"
              )}>
                {groupedCustomers[code].length} KH
              </span>
            </div>
          ))}
        </div>
      </aside>

      {/* Customer List Grid */}
      <section className={twMerge(
        "w-full md:w-96 border-r border-slate-200 flex-col bg-slate-50 flex-shrink-0 h-full",
        mobilePane === 'list' ? "flex" : "hidden md:flex"
      )}>
        <div className="p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between border-b border-slate-200 bg-white shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-2 max-w-full w-full sm:w-auto">
            <button 
              onClick={() => setMobilePane('categories')}
              className="md:hidden p-1.5 -ml-1 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-md"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <h2 className="text-sm font-bold text-slate-800 truncate pr-2 flex-1">Danh sách: {selectedBookCode}</h2>
          </div>
          <input 
            type="text" 
            placeholder="Tìm kiếm KH..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs border border-slate-200 rounded-md px-2 py-2 sm:py-1.5 w-full sm:w-40 outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 transition-shadow" 
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredCustomers.map(customer => {
            const isSelected = selectedCustomerCode === customer.customerCode;
            return (
              <div 
                key={customer.customerCode || customer.stt}
                onClick={() => {
                  setSelectedCustomerCode(customer.customerCode);
                  setMobilePane('detail');
                }}
                className={twMerge(
                  "p-4 border-b border-slate-100 cursor-pointer transition-colors",
                  isSelected ? "bg-white ring-1 ring-inset ring-indigo-200" : "hover:bg-slate-100/50 bg-slate-50"
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={twMerge(
                    "text-[10px] font-mono font-bold",
                    isSelected ? "text-indigo-500" : "text-slate-400"
                  )}>
                    {customer.customerCode}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">STT: {customer.stt || '-'}</span>
                </div>
                <h3 className={twMerge(
                  "text-sm font-bold leading-snug",
                  isSelected ? "text-slate-900" : "text-slate-700"
                )}>
                  {customer.customerName || 'Không có tên'}
                </h3>
                <p className="text-xs text-slate-400 truncate mt-1">{customer.address || 'Chưa có địa chỉ'}</p>
              </div>
            );
          })}
          {filteredCustomers.length === 0 && (
             <div className="text-center p-8 text-sm text-slate-500">
               Không tìm thấy kết quả phù hợp.
             </div>
          )}
        </div>
      </section>

      {/* Detail View Pane */}
      <section className={twMerge(
        "flex-1 bg-white p-4 sm:p-8 overflow-y-auto h-full",
        mobilePane === 'detail' ? "block" : "hidden md:block"
      )}>
        {selectedCustomer ? (
          <div className="max-w-3xl mx-auto">
            <button 
              onClick={() => setMobilePane('list')}
              className="md:hidden flex items-center font-bold text-xs text-indigo-600 mb-6 bg-indigo-50 px-3 py-1.5 rounded-lg w-fit"
            >
              <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
              Đi tới danh sách
            </button>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-bold text-xl uppercase border border-slate-200">
                {selectedCustomer.customerName ? selectedCustomer.customerName.charAt(0) : 'KH'}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{selectedCustomer.customerName || 'Không có tên'}</h2>
                <p className="text-slate-500 flex items-start sm:items-center gap-1.5 mt-1 font-medium text-xs sm:text-sm">
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 mt-0.5 sm:mt-0 shrink-0" />
                  <span className="truncate">{selectedCustomer.address || 'Chưa có thông tin địa chỉ'}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thông số thiết bị</h4>
                  <div className="mt-2 bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                    <DetailRow label="Số thiết bị" value={selectedCustomer.deviceNumber} mono />
                    <DetailRow label="Mã loại" value={selectedCustomer.typeCode} />
                    <DetailRow label="Dòng điện" value={selectedCustomer.current} />
                    <DetailRow label="Điện áp" value={selectedCustomer.voltage} />
                    <DetailRow label="Số pha" value={selectedCustomer.phases} />
                  </div>
                </div>
                
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vị trí hệ thống</h4>
                  <div className="mt-2 bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                    <DetailRow label="Mã khu vực" value={selectedCustomer.areaCode} />
                    <DetailRow label="Mã trạm" value={selectedCustomer.stationCode} />
                    <DetailRow label="Số TT trong trạm" value={selectedCustomer.sequenceInStation} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Liên hệ & Khác</h4>
                  <div className="mt-2 bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                    <DetailRow label="Số điện thoại" value={selectedCustomer.phoneNumber} />
                    <DetailRow label="Mã khách hàng" value={selectedCustomer.customerCode} mono />
                  </div>
                </div>

                {selectedCustomer.notes && (
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ghi chú tờ rơi</h4>
                    <div className="mt-2 bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-yellow-800 text-xs italic leading-relaxed">
                      "{selectedCustomer.notes}"
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  <button className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                    <Share className="w-4 h-4" />
                    Gửi báo cáo / Xuất dữ liệu
                  </button>
                </div>
              </div>
            </div>

            {/* Phần Hiện Trường Data */}
            <FieldWorkSection customerCode={selectedCustomer.customerCode} />
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
            <User className="w-12 h-12 text-slate-200" />
            <p className="text-sm font-medium">Chọn một khách hàng để xem chi tiết</p>
          </div>
        )}
      </section>
    </div>
  );
}

function DetailRow({ label, value, mono = false }: { label: string, value: string, mono?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-slate-500 font-medium">{label}:</span>
      <span className={twMerge(
        "text-xs",
        mono ? "font-mono font-bold text-slate-700" : "font-bold text-slate-900"
      )}>
        {value || '-'}
      </span>
    </div>
  );
}
