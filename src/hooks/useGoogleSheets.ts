import { useState, useCallback } from 'react';
import { Customer, parseCustomerData } from '../types/customer';
import Papa from 'papaparse';

const SPREADSHEET_ID = '1eAoUT8U-vRVU8RBF8TrdvFoZmRiEzRR1Tnq3oiwgia0';

export function useGoogleSheets(accessToken: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tiCustomers, setTiCustomers] = useState<any[]>([]);
  const [sourcePoints, setSourcePoints] = useState<any[]>([]);
  const [tiSourcePoints, setTiSourcePoints] = useState<any[]>([]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (accessToken) {
        // Authenticated Google Sheets API v4
        const metaRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?fields=sheets(properties(title,sheetId))`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!metaRes.ok) {
          throw new Error(`Failed to fetch spreadsheet metadata: ${metaRes.statusText}`);
        }

        const metaData = await metaRes.json();
        const firstSheetTitle = metaData.sheets[0]?.properties.title;
        const secondSheetTitle = metaData.sheets[1]?.properties.title;
        let tiSheetTitle = null;
        let sourcePointsSheetTitle = null;
        let tiDauNguonSheetTitle = null;
        for (const s of metaData.sheets) {
          const title = `${s.properties.title}`.toLowerCase();
          if (title.includes('ti') && !title.includes('đầu nguồn')) {
            tiSheetTitle = s.properties.title;
          }
          if (title.includes('đầu nguồn') && !title.includes('ti')) {
            sourcePointsSheetTitle = s.properties.title;
          }
          if (title.includes('ti') && title.includes('đầu nguồn')) {
            tiDauNguonSheetTitle = s.properties.title;
          }
          if (s.properties.sheetId === 1131885151) tiSheetTitle = s.properties.title;
          if (s.properties.sheetId === 1880586484) sourcePointsSheetTitle = s.properties.title;
        }

        if (!firstSheetTitle) throw new Error("No sheets found in the spreadsheet");

        const dataRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(firstSheetTitle)}!A2:AA`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (!dataRes.ok) {
          throw new Error(`Failed to fetch spreadsheet data: ${dataRes.statusText}`);
        }

        const rawData = await dataRes.json();
        let parsed = [];
        if (rawData.values && Array.isArray(rawData.values)) {
          parsed = rawData.values.map((row: any[]) => parseCustomerData(row));
        }

        // Try load second sheet for comparison
        if (secondSheetTitle) {
          try {
            const data2Res = await fetch(
              `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(secondSheetTitle)}!A2:AA`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (data2Res.ok) {
              const rawData2 = await data2Res.json();
              if (rawData2.values && Array.isArray(rawData2.values)) {
                const secondSheetMap = new Map<string, Customer>();
                const parsed2 = rawData2.values.map((r: any[]) => parseCustomerData(r));
                parsed2.forEach((cust: Customer) => {
                  if (cust.customerCode) {
                    secondSheetMap.set(cust.customerCode, cust);
                  }
                });
                
                const firstSheetMap = new Map<string, Customer>();
                parsed.forEach(c => {
                  if (c.customerCode) firstSheetMap.set(c.customerCode, c);
                });

                let enrichedMain = parsed.map(c => {
                  let isReplaced = false;
                  let changes: Record<string, { old: string, new: string }> = {};
                  let status: 'new' | 'existing' = 'new';

                  if (c.customerCode && secondSheetMap.has(c.customerCode)) {
                    status = 'existing';
                    const c2 = secondSheetMap.get(c.customerCode)!;
                    isReplaced = String(c2.inspectionExpiry).trim() !== String(c.inspectionExpiry).trim();

                    // Compare fields
                    const fieldsToCompare: (keyof Customer)[] = ['deviceNumber', 'customerName', 'priceString'];
                    fieldsToCompare.forEach(key => {
                      const val1 = String(c[key] || '').trim();
                      const val2 = String(c2[key] || '').trim();
                      if (val1 !== val2) {
                        changes[key] = { old: val2, new: val1 }; // Assuming c2 is baseline (older), c is current
                      }
                    });
                  }

                  return {
                    ...c,
                    isReplaced,
                    changes,
                    status
                  };
                });
                
                const removedCustomers = parsed2
                  .filter((c2: Customer) => c2.customerCode && !firstSheetMap.has(c2.customerCode))
                  .map((c2: Customer) => ({ ...c2, status: 'removed' as const }));

                parsed = [...enrichedMain, ...removedCustomers] as Customer[];
              }
            }
          } catch (e) {
            console.error("Failed to fetch second sheet for comparison", e);
          }
        }
        
        let fetchedTiData: any[] = [];
        if (tiSheetTitle) {
          try {
            const tiRes = await fetch(
              `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(tiSheetTitle)}!A1:AA`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (tiRes.ok) {
              const rawTiData = await tiRes.json();
              if (rawTiData.values && Array.isArray(rawTiData.values) && rawTiData.values.length > 0) {
                // assume the first non-empty row contains headers
                let hdIndex = 0;
                for (let i = 0; i < Math.min(rawTiData.values.length, 5); i++) {
                  if (rawTiData.values[i].some((cell: string) => String(cell).toLowerCase().includes('mã khách'))) {
                    hdIndex = i;
                    break;
                  }
                }
                const headers: string[] = rawTiData.values[hdIndex].map((h: string) => String(h).toLowerCase().trim());
                fetchedTiData = rawTiData.values.slice(hdIndex + 1).map((row: any[]) => {
                  const obj: any = {};
                  headers.forEach((h, idx) => {
                    if (h) {
                      if (obj[h] !== undefined) {
                        obj[`${h}_${idx}`] = row[idx] || '';
                      } else {
                        obj[h] = row[idx] || '';
                      }
                    }
                  });
                  return obj;
                });
              }
            }
          } catch (e) {
            console.error("Failed to fetch TI sheet", e);
          }
        }

        let fetchedSourcePointsData: any[] = [];
        if (sourcePointsSheetTitle) {
          try {
            const spRes = await fetch(
              `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(sourcePointsSheetTitle)}!A1:AA`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (spRes.ok) {
              const rawSpData = await spRes.json();
              if (rawSpData.values && Array.isArray(rawSpData.values) && rawSpData.values.length > 0) {
                let hdIndex = 0;
                for (let i = 0; i < Math.min(rawSpData.values.length, 5); i++) {
                  if (rawSpData.values[i].some((cell: string) => String(cell).toLowerCase().includes('dchi_ddo') || String(cell).toLowerCase().includes('ma_tram') || String(cell).toLowerCase().includes('địa chỉ'))) {
                    hdIndex = i;
                    break;
                  }
                }
                const headers: string[] = rawSpData.values[hdIndex].map((h: string) => String(h).toLowerCase().trim());
                fetchedSourcePointsData = rawSpData.values.slice(hdIndex + 1).map((row: any[]) => {
                  const obj: any = {};
                  headers.forEach((h, idx) => {
                    if (h) {
                      if (obj[h] !== undefined) {
                        obj[`${h}_${idx}`] = row[idx] || '';
                      } else {
                        obj[h] = row[idx] || '';
                      }
                    }
                  });
                  return obj;
                });
              }
            }
          } catch (e) {
            console.error("Failed to fetch Source Points sheet", e);
          }
        }

        let fetchedTiSourcePointsData: any[] = [];
        if (tiDauNguonSheetTitle) {
          try {
            const spRes = await fetch(
              `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(tiDauNguonSheetTitle)}!A1:AA`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (spRes.ok) {
              const rawSpData = await spRes.json();
              if (rawSpData.values && Array.isArray(rawSpData.values) && rawSpData.values.length > 0) {
                let hdIndex = 0;
                for (let i = 0; i < Math.min(rawSpData.values.length, 5); i++) {
                  if (rawSpData.values[i].some((cell: string) => String(cell).toLowerCase().includes('mã điển đo') || String(cell).toLowerCase().includes('mã thiết bị'))) {
                    hdIndex = i;
                    break;
                  }
                }
                const headers: string[] = rawSpData.values[hdIndex].map((h: string) => String(h).toLowerCase().trim());
                fetchedTiSourcePointsData = rawSpData.values.slice(hdIndex + 1).map((row: any[]) => {
                  const obj: any = {};
                  headers.forEach((h, idx) => {
                    if (h) {
                      if (obj[h] !== undefined) {
                        obj[`${h}_${idx}`] = row[idx] || '';
                      } else {
                        obj[h] = row[idx] || '';
                      }
                    }
                  });
                  return obj;
                });
              }
            }
          } catch (e) {
            console.error("Failed to fetch TI Source Points sheet", e);
          }
        }

        setTiCustomers(fetchedTiData);
        setSourcePoints(fetchedSourcePointsData);
        setTiSourcePoints(fetchedTiSourcePointsData);
        setCustomers(parsed);
      } else {
        // Fallback: Try to fetch as Public CSV
        const url1 = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=Danh%20s%C3%A1ch%20t%E1%BB%95ng`;
        const url2 = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=Danh%20s%C3%A1ch%20kh%C3%A1ch%20h%C3%A0ng%20%C4%91%E1%BA%BFn%2001/06/2026`;
        const url3 = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=1131885151`;
        const url4 = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=1880586484`;
        const url5 = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=766458961`;

        try {
          const [text1, text2, text3, text4, text5] = await Promise.all([
            fetch(url1).then(r => r.text()),
            fetch(url2).then(r => r.text()),
            fetch(url3).then(r => r.text()).catch(() => ''),
            fetch(url4).then(r => r.text()).catch(() => ''),
            fetch(url5).then(r => r.text()).catch(() => '')
          ]);

          let parsedMain: Customer[] = [];
          
          Papa.parse(text1, {
            header: false,
            skipEmptyLines: true,
            complete: (results) => {
              const data = results.data as string[][];
              if (data.length > 0) {
                const firstCell = String(data[0][0]).toLowerCase();
                const isHeader = firstCell.includes('mã đơn vị') || firstCell.includes('stt') || firstCell.includes('ma don') || firstCell === '"mã đơn vị"';
                const startIndex = isHeader ? 1 : 0;
                parsedMain = data.slice(startIndex).map(row => parseCustomerData(row));
              }
            }
          });

          let secondSheetMap = new Map<string, Customer>();
          let parsed2: Customer[] = [];
          Papa.parse(text2, {
            header: false,
            skipEmptyLines: true,
            complete: (results) => {
              const data = results.data as string[][];
              if (data.length > 0) {
                const firstCell = String(data[0][0]).toLowerCase();
                const isHeader = firstCell.includes('mã đơn vị') || firstCell.includes('stt') || firstCell.includes('ma don') || firstCell === '"mã đơn vị"';
                const startIndex = isHeader ? 1 : 0;
                parsed2 = data.slice(startIndex).map(row => parseCustomerData(row));
                secondSheetMap = new Map(parsed2.map(c => [c.customerCode, c]));
              }
            }
          });

          let fetchedTiData: any[] = [];
          if (text3) {
            Papa.parse(text3, {
              header: false,
              skipEmptyLines: true,
              complete: (results) => {
                const data = results.data as string[][];
                if (data.length > 0) {
                  let hdIndex = 0;
                  for (let i = 0; i < Math.min(data.length, 5); i++) {
                    if (data[i].some(cell => String(cell).toLowerCase().includes('mã khách'))) {
                      hdIndex = i;
                      break;
                    }
                  }
                  const headers = data[hdIndex].map(h => String(h).toLowerCase().trim());
                  fetchedTiData = data.slice(hdIndex + 1).map(row => {
                    const obj: any = {};
                    headers.forEach((h, idx) => {
                      if (h) {
                        if (obj[h] !== undefined) {
                          obj[`${h}_${idx}`] = row[idx] || '';
                        } else {
                          obj[h] = row[idx] || '';
                        }
                      }
                    });
                    return obj;
                  });
                }
              }
            });
          }

          let fetchedSourcePointsData: any[] = [];
          if (text4) {
            Papa.parse(text4, {
              header: false,
              skipEmptyLines: true,
              complete: (results) => {
                const data = results.data as string[][];
                if (data.length > 0) {
                  let hdIndex = 0;
                  for (let i = 0; i < Math.min(data.length, 5); i++) {
                    if (data[i].some(cell => String(cell).toLowerCase().includes('dchi_ddo') || String(cell).toLowerCase().includes('ma_tram') || String(cell).toLowerCase().includes('địa chỉ'))) {
                      hdIndex = i;
                      break;
                    }
                  }
                  const headers = data[hdIndex].map(h => String(h).toLowerCase().trim());
                  fetchedSourcePointsData = data.slice(hdIndex + 1).map(row => {
                    const obj: any = {};
                    headers.forEach((h, idx) => {
                      if (h) {
                        if (obj[h] !== undefined) {
                          obj[`${h}_${idx}`] = row[idx] || '';
                        } else {
                          obj[h] = row[idx] || '';
                        }
                      }
                    });
                    return obj;
                  });
                }
              }
            });
          }

          let fetchedTiSourcePointsData: any[] = [];
          if (text5) {
            Papa.parse(text5, {
              header: false,
              skipEmptyLines: true,
              complete: (results) => {
                const data = results.data as string[][];
                if (data.length > 0) {
                  let hdIndex = 0;
                  for (let i = 0; i < Math.min(data.length, 5); i++) {
                    if (data[i].some(cell => String(cell).toLowerCase().includes('ma_ddo') || String(cell).toLowerCase().includes('mã điển đo') || String(cell).toLowerCase().includes('mã thiết bị'))) {
                      hdIndex = i;
                      break;
                    }
                  }
                  const headers = data[hdIndex].map(h => String(h).toLowerCase().trim());
                  fetchedTiSourcePointsData = data.slice(hdIndex + 1).map(row => {
                    const obj: any = {};
                    headers.forEach((h, idx) => {
                      if (h) {
                        if (obj[h] !== undefined) {
                          obj[`${h}_${idx}`] = row[idx] || '';
                        } else {
                          obj[h] = row[idx] || '';
                        }
                      }
                    });
                    return obj;
                  });
                }
              }
            });
          }

          const firstSheetMap = new Map<string, Customer>();
          parsedMain.forEach(c => {
            if (c.customerCode) firstSheetMap.set(c.customerCode, c);
          });

          if (secondSheetMap.size > 0 && parsedMain.length > 0) {
            let enrichedMain = parsedMain.map(c => {
              let isReplaced = false;
              let changes: Record<string, { old: string, new: string }> = {};
              let status: 'new' | 'existing' = 'new';

              if (c.customerCode && secondSheetMap.has(c.customerCode)) {
                status = 'existing';
                const c2 = secondSheetMap.get(c.customerCode)!;
                isReplaced = String(c2.inspectionExpiry).trim() !== String(c.inspectionExpiry).trim();

                const fieldsToCompare: (keyof Customer)[] = ['deviceNumber', 'customerName', 'priceString'];
                fieldsToCompare.forEach(key => {
                  const val1 = String(c[key] || '').trim();
                  const val2 = String(c2[key] || '').trim();
                  if (val1 !== val2) {
                    changes[key] = { old: val2, new: val1 };
                  }
                });
              }

              return { ...c, isReplaced, changes, status };
            });
            
            const removedCustomers = parsed2
              .filter(c2 => c2.customerCode && !firstSheetMap.has(c2.customerCode))
              .map(c2 => ({ ...c2, status: 'removed' as const }));

            parsedMain = [...enrichedMain, ...removedCustomers];
          }

          setTiCustomers(fetchedTiData);
          setSourcePoints(fetchedSourcePointsData);
          setTiSourcePoints(fetchedTiSourcePointsData);
          setCustomers(parsedMain);
          setLoading(false);

        } catch (err: any) {
          console.error(err);
          setError("Không thể tải dữ liệu. Hãy đảm bảo File Google Sheet đã được Mở quyền chia sẻ thành 'Bất kỳ ai có liên kết' (Public) hoặc bạn phải Đăng nhập.");
          setLoading(false);
          setCustomers([]);
        }
        return;
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while fetching data');
    } finally {
      if (accessToken) setLoading(false);
    }
  }, [accessToken]);

  return {
    customers,
    tiCustomers,
    sourcePoints,
    tiSourcePoints,
    loading,
    error,
    fetchCustomers
  };
}
