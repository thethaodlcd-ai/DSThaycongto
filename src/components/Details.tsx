import { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Customer } from '../types/customer';
import { ChevronRight, FileSpreadsheet, MapPin, Phone, Zap, MonitorSmartphone, Share, User, Hash, Download } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { isExpiringSoonOrOverdue, isTargetYear } from '../utils/dateHelpers';

import { FieldWorkSection } from './FieldWorkSection';

interface DetailsProps {
  customers: Customer[];
  mode: 'books' | 'stations' | 'all' | 'overdue' | 'phase1' | 'phase3' | 'types' | 'tiRatios' | 'notesAndSolar' | 'phase1Direct' | 'phase1Indirect' | 'phase3Direct' | 'phase3Indirect' | 'excludeSpecificPrices' | 'periodic2026' | 'replaced2026' | 'changedCustomers' | 'removedCustomers' | 'newCustomers' | 'customerTypes';
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
    } else if (mode === 'changedCustomers') {
      groups['Khách hàng có thay đổi'] = customers.filter(c => c.changes && Object.keys(c.changes).length > 0);
    } else if (mode === 'overdue') {
      groups['QUÁ HẠN KIỂN ĐINH (%)'] = customers.filter(c => isExpiringSoonOrOverdue(c.inspectionExpiry));
    } else if (mode === 'periodic2026') {
      groups['Thay định kỳ 2026'] = customers.filter(c => isTargetYear(c.inspectionExpiry, 2026));
    } else if (mode === 'replaced2026') {
      groups['Đã thay'] = customers.filter(c => c.isReplaced);
    } else if (mode === 'removedCustomers') {
      const removed = customers.filter(c => c.status === 'removed');
      groups['Khách hàng 1 Pha'] = removed.filter(c => String(c.phases).includes('1'));
      groups['Khách hàng 3 Pha'] = removed.filter(c => String(c.phases).includes('3'));
    } else if (mode === 'newCustomers') {
      const news = customers.filter(c => c.status === 'new');
      groups['Khách hàng 1 Pha'] = news.filter(c => String(c.phases).includes('1'));
      groups['Khách hàng 3 Pha'] = news.filter(c => String(c.phases).includes('3'));
    } else if (mode === 'customerTypes') {
      const current = customers.filter(c => c.status !== 'removed');
      groups['Sinh hoạt (SHBT)'] = [];
      groups['Bệnh viện - Trường học (CQBV)'] = [];
      groups['Cơ quan hành chính (CQHC)'] = [];
      groups['Kinh doanh (KDDV)'] = [];
      groups['Sản xuất (SXBT)'] = [];
      groups['Nhiều loại giá (Hỗn hợp)'] = [];
      groups['Khác'] = [];

      current.forEach(c => {
        const p = c.priceString || '';
        const hasSHBT = p.includes('SHBT');
        const hasCQBV = p.includes('CQBV');
        const hasCQHC = p.includes('CQHC');
        const hasKDDV = p.includes('KDDV');
        const hasSXBT = p.includes('SXBT');
        
        const matchCount = [hasSHBT, hasCQBV, hasCQHC, hasKDDV, hasSXBT].filter(Boolean).length;
        
        if (matchCount > 1) {
          groups['Nhiều loại giá (Hỗn hợp)'].push(c);
        } else if (matchCount === 0) {
          groups['Khác'].push(c);
        } else {
          if (hasSHBT) groups['Sinh hoạt (SHBT)'].push(c);
          else if (hasCQBV) groups['Bệnh viện - Trường học (CQBV)'].push(c);
          else if (hasCQHC) groups['Cơ quan hành chính (CQHC)'].push(c);
          else if (hasKDDV) groups['Kinh doanh (KDDV)'].push(c);
          else if (hasSXBT) groups['Sản xuất (SXBT)'].push(c);
        }
      });

      // Remove empty categories
      Object.keys(groups).forEach(k => {
        if (groups[k].length === 0) delete groups[k];
      });
    } else if (mode === 'phase1') {
      groups['Khách hàng 1 Pha'] = customers.filter(c => String(c.phases).includes('1'));
    } else if (mode === 'phase3') {
      groups['Khách hàng 3 Pha'] = customers.filter(c => String(c.phases).includes('3'));
    } else if (mode === 'types') {
      for (const customer of customers) {
        const key = customer.typeCode || 'Không có mã chủng loại';
        if (!groups[key]) groups[key] = [];
        groups[key].push(customer);
      }
    } else if (mode === 'tiRatios') {
      for (const customer of customers) {
        const key = customer.tiRatio || 'Không có tỷ số TI';
        if (!groups[key]) groups[key] = [];
        groups[key].push(customer);
      }
    } else if (mode === 'notesAndSolar') {
      groups['Khách hàng NLMT'] = customers.filter(c => c.notes?.trim() || c.solarPower?.trim());
    } else if (mode === 'phase1Direct') {
      groups['1 Pha Trực Tiếp'] = customers.filter(c => String(c.phases).includes('1') && String(c.directIndirectType).toLowerCase().includes('trực tiếp'));
    } else if (mode === 'phase1Indirect') {
      groups['1 Pha Gián Tiếp'] = customers.filter(c => String(c.phases).includes('1') && String(c.directIndirectType).toLowerCase().includes('gián tiếp'));
    } else if (mode === 'phase3Direct') {
      groups['3 Pha Trực Tiếp'] = customers.filter(c => String(c.phases).includes('3') && String(c.directIndirectType).toLowerCase().includes('trực tiếp'));
    } else if (mode === 'phase3Indirect') {
      groups['3 Pha Gián Tiếp'] = customers.filter(c => String(c.phases).includes('3') && String(c.directIndirectType).toLowerCase().includes('gián tiếp'));
    } else if (mode === 'excludeSpecificPrices') {
      groups['KH Không Thuộc Nhóm Đổi Giá'] = customers.filter(c => {
        const p = String(c.priceString).replace(/\s+/g, '').toUpperCase();
        return p !== "BT:100%*KDDV-A;CD:100%*KDDV-A;TD:100%*KDDV-A" && 
               p !== "BT:100%*SXBT-A;CD:100%*SXBT-A;TD:100%*SXBT-A" && 
               p !== "BT:100%*3007-KDDV-A;CD:100%*5174-KDDV-A;TD:100%*1830-KDDV-A" &&
               p !== "BT:100%*1896-SXBT-A;CD:100%*3474-SXBT-A;TD:100%*1241-SXBT-A";
      });
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

  // Reset selectedbookCode if it's no longer valid 
  useEffect(() => {
    if (selectedBookCode && !bookCodes.includes(selectedBookCode)) {
      setSelectedBookCode(bookCodes.length > 0 ? bookCodes[0] : null);
      setSelectedCustomerCode(null);
      setSearch('');
    }
  }, [bookCodes, selectedBookCode]);

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

  const activeBookCustomers = selectedBookCode ? (groupedCustomers[selectedBookCode] || []) : [];
  
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

  const handleExportExcel = () => {
    if (!activeBookCustomers || activeBookCustomers.length === 0) return;

    const exportData = activeBookCustomers.map(c => ({
      "Mã đơn vị": c.unitCode,
      "Mã thiết bị": c.deviceCode,
      "số thiết bị": c.deviceNumber,
      "Mã chủng loại": c.typeCode,
      "Dòng điện": c.current,
      "điện áp": c.voltage,
      "số pha": c.phases,
      "Ngày kiểm định": c.inspectionDate,
      "Hạn kiểm định": c.inspectionExpiry,
      "Mã điển đo": c.measurementPointCode,
      "Mã khách hàng": c.customerCode,
      "Hệ số nhân": c.multiplier,
      "Ngày treo tháo": c.installRemoveDate,
      "Mã khu vực": c.areaCode,
      "Số khu vực": c.areaNumber,
      "Tên khách hàng": c.customerName,
      "Địa chỉ sử dụng điện": c.electricityUsageAddress,
      "Địa chỉ sử khách hàng": c.customerAddress,
      "Số trụ": c.poleNumber,
      "Mã sổ ghi điện": c.bookCode,
      "Mã trạm": c.stationCode,
      "Số điiện thoại": c.phoneNumber,
      "Chuỗi giá": c.priceString,
      "Loại trực tiếp, gián giếp": c.directIndirectType,
      "Tỷ số TI đấu": c.tiRatio,
      "Ghi chú": c.notes,
      "Công suất lắp NLMT (kWp)": c.solarPower,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "KhachHang");
    
    // Generate valid filename string
    const fileNameSafeLabel = String(selectedBookCode || 'DanhSach').replace(/[\/\\?%*:|"<>]/g, '-');
    XLSX.writeFile(workbook, `Danh_Sach_${fileNameSafeLabel}.xlsx`);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden h-full">
      {/* Sidebar: Mã Sổ Selection */}
      <aside className={twMerge(
        "w-full md:w-64 bg-white border-r border-slate-200 flex-col flex-shrink-0 h-full",
        mobilePane === 'categories' ? "flex" : "hidden md:flex"
      )}>
        <div className="p-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {mode === 'all' ? 'Tất cả' : mode === 'stations' ? 'Danh mục Mã Trạm' : mode === 'overdue' ? 'Kiểm định' : mode === 'removedCustomers' ? 'KH Thanh Lý' : mode === 'newCustomers' ? 'KH Lắp Mới' : mode === 'customerTypes' ? 'Loại Khách Hàng' : mode.includes('phase') ? 'Phân loại pha' : mode === 'types' ? 'Chủng loại công tơ' : mode === 'tiRatios' ? 'Tỷ số TI đấu' : mode === 'notesAndSolar' ? 'Khách hàng NLMT' : mode === 'excludeSpecificPrices' ? 'Lọc chuỗi giá' : 'Danh mục Mã Sổ'}
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
              <div className="flex flex-col items-end shrink-0 ml-2">
                <span className={twMerge(
                  "text-[10px] px-2 py-0.5 rounded-full",
                  selectedBookCode === code ? "bg-indigo-100 text-indigo-600 font-bold" : "bg-slate-100 text-slate-400 font-medium"
                )}>
                  {groupedCustomers[code].length} KH
                </span>
                {mode === 'notesAndSolar' && (
                  <span className={twMerge("text-[9px] font-medium mt-1 uppercase", selectedBookCode === code ? "text-indigo-500" : "text-slate-400")}>
                    {groupedCustomers[code].reduce((sum, c) => sum + (isNaN(parseFloat(c.solarPower?.replace(',', '.') || '0')) ? 0 : parseFloat(c.solarPower?.replace(',', '.') || '0')), 0).toLocaleString('vi-VN')} kWp
                  </span>
                )}
              </div>
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
            <h2 className="text-sm flex-1 font-bold text-slate-800 truncate pr-2" title={String(selectedBookCode)}>
              {selectedBookCode}
              {mode === 'notesAndSolar' && activeBookCustomers && (
                <span className="text-xs text-indigo-600 font-bold ml-2 bg-indigo-50 px-2 py-0.5 rounded-full inline-block">
                  Tổng: {activeBookCustomers.reduce((sum, c) => sum + (isNaN(parseFloat(c.solarPower?.replace(',', '.') || '0')) ? 0 : parseFloat(c.solarPower?.replace(',', '.') || '0')), 0).toLocaleString('vi-VN')} kWp
                </span>
              )}
            </h2>
            <button 
              onClick={handleExportExcel} 
              className="p-1.5 text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-lg flex items-center justify-center shrink-0 transition-colors"
              title="Xuất danh sách ra file Excel"
            >
              <Download className="w-4 h-4" />
            </button>
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
                  <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">ĐV: {customer.unitCode || '-'}</span>
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
                {selectedCustomer.changes?.customerName ? (
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                      {selectedCustomer.customerName || 'Không có tên'}
                    </h2>
                    <div className="flex items-center gap-2 mt-1 text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded w-fit">
                       <span className="line-through opacity-60 decoration-red-300">{selectedCustomer.changes.customerName.old || 'Không có tên'}</span>
                       <span className="text-red-300">→</span>
                       <span>{selectedCustomer.changes.customerName.new || 'Không có tên'}</span>
                    </div>
                  </div>
                ) : (
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{selectedCustomer.customerName || 'Không có tên'}</h2>
                )}
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
                    <DetailRow label="Mã đơn vị" value={selectedCustomer.unitCode} />
                    <DetailRow label="Mã thiết bị" value={selectedCustomer.deviceCode} mono />
                    <DetailRow label="Số thiết bị" value={selectedCustomer.deviceNumber} mono change={selectedCustomer.changes?.deviceNumber} />
                    <DetailRow label="Mã loại" value={selectedCustomer.typeCode} />
                    <DetailRow label="Dòng điện" value={selectedCustomer.current} />
                    <DetailRow label="Điện áp" value={selectedCustomer.voltage} />
                    <DetailRow label="Số pha" value={selectedCustomer.phases} />
                    <DetailRow label="Hệ số nhân" value={selectedCustomer.multiplier} />
                    <DetailRow label="Kiểm định (Ngày)" value={selectedCustomer.inspectionDate} />
                    <DetailRow label="Kiểm định (Hạn)" value={selectedCustomer.inspectionExpiry} />
                    <DetailRow label="Tỷ số TI đấu" value={selectedCustomer.tiRatio} />
                  </div>
                </div>
                
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vị trí & Thông tin lưới</h4>
                  <div className="mt-2 bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                    <DetailRow label="Mã trạm" value={selectedCustomer.stationCode} />
                    <DetailRow label="Số trụ" value={selectedCustomer.poleNumber} />
                    <DetailRow label="Khu vực" value={[selectedCustomer.areaCode, selectedCustomer.areaNumber].filter(Boolean).join(" - ")} />
                    <DetailRow label="Mã điểm đo" value={selectedCustomer.measurementPointCode} />
                    <DetailRow label="Loại (TT/GT)" value={selectedCustomer.directIndirectType} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Liên hệ & Quản lý</h4>
                  <div className="mt-2 bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                    <DetailRow label="Số điện thoại" value={selectedCustomer.phoneNumber} />
                    <DetailRow label="Mã khách hàng" value={selectedCustomer.customerCode} mono />
                    <DetailRow label="Mã sổ ghi điện" value={selectedCustomer.bookCode} />
                    <DetailRow label="Ngày treo tháo" value={selectedCustomer.installRemoveDate} />
                    <DetailRow label="Chuỗi giá" value={selectedCustomer.priceString} change={selectedCustomer.changes?.priceString} />
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Địa chỉ</h4>
                  <div className="mt-2 bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                    <DetailRow label="Địa chỉ KH" value={selectedCustomer.customerAddress} />
                    <div className="pt-2 border-t border-slate-200 mt-2">
                      <DetailRow label="Nơi SD điện" value={selectedCustomer.electricityUsageAddress} />
                    </div>
                  </div>
                </div>

                {(selectedCustomer.notes || selectedCustomer.solarPower) && (
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ghi chú & NLMT</h4>
                    <div className="mt-2 bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-yellow-800 text-xs italic leading-relaxed space-y-2">
                      {selectedCustomer.notes && <p><strong>Ghi chú:</strong> {selectedCustomer.notes}</p>}
                      {selectedCustomer.solarPower && <p><strong>Công suất lắp NLMT (kWp):</strong> {selectedCustomer.solarPower}</p>}
                    </div>
                  </div>
                )}
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

function DetailRow({ label, value, mono = false, change }: { label: string, value: string, mono?: boolean, change?: { old: string, new: string } }) {
  if (change) {
    return (
      <div className="flex justify-between items-center text-red-500 bg-red-50/50 -mx-1 px-1 rounded">
        <span className="text-xs font-medium">{label}:</span>
        <span className={twMerge(
          "text-xs flex items-center gap-1 ml-2 text-right",
          mono ? "font-mono font-bold text-red-700" : "font-bold text-red-600"
        )}>
          <span className="line-through opacity-60 decoration-red-300">{change.old || '-'}</span>
          <span className="text-red-300">→</span>
          <span>{change.new || '-'}</span>
        </span>
      </div>
    );
  }

  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-slate-500 font-medium">{label}:</span>
      <span className={twMerge(
        "text-xs text-right ml-2",
        mono ? "font-mono font-bold text-slate-700" : "font-bold text-slate-900"
      )}>
        {value || '-'}
      </span>
    </div>
  );
}
