import { useMemo, useState } from 'react';
import { Network, DownloadCloud, Component } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import Papa from 'papaparse';
import { isExpiringSoonOrOverdue, isTargetYear } from '../utils/dateHelpers';

interface SourcePointsListProps {
  sourcePoints: any[];
  tiSourcePoints?: any[];
}

export function SourcePointsList({ sourcePoints, tiSourcePoints = [] }: SourcePointsListProps) {
  console.log("SourcePointsList renders - sourcePoints:", sourcePoints?.length, "tiSourcePoints:", tiSourcePoints?.length);

  const mergedData = useMemo(() => {
    return sourcePoints.map(row => {
      const getVal = (keys: string[]) => {
        const key = Object.keys(row).find(k => keys.some(search => k.includes(search)));
        return key ? String(row[key]).trim() : '';
      };
      
      const maDdo = getVal(['mã điểm đo', 'ma_ddo']);
      
      // Match TIs
      const matchingTIs = tiSourcePoints.filter(ti => {
        const tiMaDdoKey = Object.keys(ti).find(k => k.includes('mã điển đo') || k.includes('mã điểm đo') || k.includes('ma_ddo'));
        return tiMaDdoKey && String(ti[tiMaDdoKey]).trim() === maDdo;
      });
      // Sort by device number just to be consistent, or just take up to 3
      const getTiVal = (ti: any, keys: string[]) => {
        const key = Object.keys(ti).find(k => keys.some(search => k.includes(search)));
        return key ? String(ti[key]).trim() : '';
      };

      const tiDevices = ['', '', ''];
      const tiExpiries = ['', '', ''];
      let cloaiTi = '';

      matchingTIs.slice(0, 3).forEach((ti, idx) => {
        tiDevices[idx] = getTiVal(ti, ['số thiết bị', 'so_tbi', 'số thiếp bị']);
        tiExpiries[idx] = getTiVal(ti, ['hạn kiểm định', 'han_kdinh', 'hạn kđ']);
        if (!cloaiTi) {
          cloaiTi = getTiVal(ti, ['mã chủng loại', 'ma_cloai']);
        }
      });

      return {
        dchiDdo: getVal(['địa chỉ điểm đo', 'dchi_ddo', 'địa chỉ']),
        maTram: getVal(['mã trạm', 'ma_tram']),
        maDdo,
        soTbi: getVal(['số thiết bị', 'so_tbi', 'số tb']),
        maCloai: getVal(['mã chủng loại', 'ma_cloai', 'mã cl']),
        hanKdinh: getVal(['hạn kiểm định', 'han_kdinh', 'hạn kđ']),
        tiDevices,
        tiExpiries,
        cloaiTi
      };
    }).filter(d => d.maDdo || d.soTbi || d.dchiDdo);
  }, [sourcePoints, tiSourcePoints]);

  const handleExport = () => {
    const exportData = mergedData.map((item, index) => ({
      'STT': index + 1,
      'DCHI_DDO': item.dchiDdo,
      'MA_TRAM': item.maTram,
      'MA_DDO': item.maDdo,
      'SO_TBI': item.soTbi,
      'MA_CLOAI': item.maCloai,
      'HAN_KDINH': item.hanKdinh,
      'SO_TI1': item.tiDevices[0],
      'HAN_KĐ TI1': item.tiExpiries[0],
      'SO_TI2': item.tiDevices[1],
      'HAN_KĐ TI2': item.tiExpiries[1],
      'SO_TI3': item.tiDevices[2],
      'HAN_KĐ TI3': item.tiExpiries[2],
      'C_LOAI TI': item.cloaiTi,
    }));

    const csv = '\uFEFF' + Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const dateStr = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
    link.setAttribute('href', url);
    link.setAttribute('download', `Diem-do-dau-nguon_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col w-full h-full bg-slate-50 p-4 md:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Điểm Đo Đầu Nguồn</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Đã tìm thấy {mergedData.length} điểm đo</p>
        </div>

        <div className="bg-slate-50 border-b border-slate-200 px-6 py-6 shrink-0 rounded-2xl border">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatCard
              icon={Network}
              title="TỔNG SỐ ĐIỂM ĐO"
              value={mergedData.length}
              highlight={false}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
            <h3 className="text-lg font-bold text-slate-800">Danh Sách Điểm Đo</h3>
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
            <div className="min-w-[1600px] h-full flex flex-col">
              {/* Header */}
              <div className="grid grid-cols-[50px_minmax(180px,2fr)_120px_140px_120px_100px_90px_100px_90px_100px_90px_100px_90px_100px] gap-2 bg-slate-50 border-b border-slate-200 p-4 text-[10px] sm:text-xs font-bold text-slate-500 uppercase sticky top-0 z-10">
                <div>STT</div>
                <div>DCHI_DDO</div>
                <div>MA_TRAM</div>
                <div>MA_DDO</div>
                <div>SO_TBI</div>
                <div>MA_CLOAI</div>
                <div>HAN_KDINH</div>
                <div>SO_TI1</div>
                <div>H.KD TI1</div>
                <div>SO_TI2</div>
                <div>H.KD TI2</div>
                <div>SO_TI3</div>
                <div>H.KD TI3</div>
                <div>C_LOAI TI</div>
              </div>
              
              {/* List */}
              <div className="divide-y divide-slate-100 overflow-y-auto w-full flex-1">
                {mergedData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
                    <Component className="w-12 h-12 mb-4 opacity-50" />
                    <p>Không có dữ liệu điểm đo.</p>
                  </div>
                ) : (
                  <div>
                    {mergedData.map((item, index) => {
                      return (
                        <div key={index} className="grid grid-cols-[50px_minmax(180px,2fr)_120px_140px_120px_100px_90px_100px_90px_100px_90px_100px_90px_100px] gap-2 p-4 text-sm items-center hover:bg-slate-50 transition-colors">
                          <div className="text-slate-400 font-medium text-xs">#{index + 1}</div>
                          
                          <div className="font-medium text-slate-900 truncate text-xs" title={item.dchiDdo}>
                            {item.dchiDdo || '-'}
                          </div>
                          
                          <div className="font-mono text-slate-700 text-xs truncate" title={item.maTram}>
                            {item.maTram || '-'}
                          </div>
                          
                          <div className="font-mono font-bold text-indigo-600 truncate text-xs" title={item.maDdo}>
                            {item.maDdo || '-'}
                          </div>

                          <div className="font-mono text-slate-700 font-medium text-xs truncate">
                            {item.soTbi || '-'}
                          </div>

                          <div className="font-mono text-slate-500 text-[10px] truncate">
                            {item.maCloai || '-'}
                          </div>
                          
                          <div>
                            <span className={twMerge(
                              "px-2 py-1 rounded-md text-[10px] font-bold whitespace-nowrap",
                              isExpiringSoonOrOverdue(item.hanKdinh)
                                ? "bg-red-100 text-red-700"
                                : isTargetYear(item.hanKdinh, 2026)
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-100 text-slate-600"
                            )}>
                              {item.hanKdinh || '-'}
                            </span>
                          </div>

                          {/* TI 1 */}
                          <div className="font-mono text-slate-700 text-[10px] truncate" title={item.tiDevices[0]}>
                            {item.tiDevices[0] || '-'}
                          </div>
                          <div>
                            <span className={twMerge(
                              "px-1.5 py-0.5 rounded-md text-[9px] font-bold whitespace-nowrap",
                              (item.tiExpiries[0] && isExpiringSoonOrOverdue(item.tiExpiries[0]))
                                ? "bg-red-100 text-red-700"
                                : "bg-slate-100 text-slate-600"
                            )}>
                              {item.tiExpiries[0] || '-'}
                            </span>
                          </div>

                          {/* TI 2 */}
                          <div className="font-mono text-slate-700 text-[10px] truncate" title={item.tiDevices[1]}>
                            {item.tiDevices[1] || '-'}
                          </div>
                          <div>
                            <span className={twMerge(
                              "px-1.5 py-0.5 rounded-md text-[9px] font-bold whitespace-nowrap",
                              (item.tiExpiries[1] && isExpiringSoonOrOverdue(item.tiExpiries[1]))
                                ? "bg-red-100 text-red-700"
                                : "bg-slate-100 text-slate-600"
                            )}>
                              {item.tiExpiries[1] || '-'}
                            </span>
                          </div>

                          {/* TI 3 */}
                          <div className="font-mono text-slate-700 text-[10px] truncate" title={item.tiDevices[2]}>
                            {item.tiDevices[2] || '-'}
                          </div>
                          <div>
                            <span className={twMerge(
                              "px-1.5 py-0.5 rounded-md text-[9px] font-bold whitespace-nowrap",
                              (item.tiExpiries[2] && isExpiringSoonOrOverdue(item.tiExpiries[2]))
                                ? "bg-red-100 text-red-700"
                                : "bg-slate-100 text-slate-600"
                            )}>
                              {item.tiExpiries[2] || '-'}
                            </span>
                          </div>
                          
                          <div className="font-mono text-slate-500 text-[10px] truncate" title={item.cloaiTi}>
                            {item.cloaiTi || '-'}
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

function StatCard({ icon: Icon, title, value, onClick, highlight = false, subtitle }: { icon: any, title: string, value: number | string, onClick?: () => void, highlight?: boolean, subtitle?: string }) {
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-2xl border ${highlight ? 'border-red-200' : 'border-slate-100'} shadow-sm overflow-hidden flex items-center p-6 transition-all group`}
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
