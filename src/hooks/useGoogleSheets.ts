import { useState, useCallback } from 'react';
import { Customer, parseCustomerData } from '../types/customer';
import Papa from 'papaparse';

const SPREADSHEET_ID = '1eAoUT8U-vRVU8RBF8TrdvFoZmRiEzRR1Tnq3oiwgia0';

export function useGoogleSheets(accessToken: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);

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
                const secondSheetExpiryMap = new Map<string, string>();
                rawData2.values.forEach((r: any[]) => {
                  const custCode = String(r[10] || '').trim();
                  const expiry = String(r[8] || '').trim();
                  if (custCode) {
                    secondSheetExpiryMap.set(custCode, expiry);
                  }
                });
                
                parsed = parsed.map(c => ({
                  ...c,
                  isReplaced: !!c.customerCode && secondSheetExpiryMap.has(c.customerCode) && secondSheetExpiryMap.get(c.customerCode) !== String(c.inspectionExpiry).trim()
                }));
              }
            }
          } catch (e) {
            console.error("Failed to fetch second sheet for comparison", e);
          }
        }

        setCustomers(parsed);
      } else {
        // Fallback: Try to fetch as Public CSV
        const url1 = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=Danh%20s%C3%A1ch%20t%E1%BB%95ng`;
        const url2 = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=Danh%20s%C3%A1ch%20kh%C3%A1ch%20h%C3%A0ng%20%C4%91%E1%BA%BFn%2001/06/2026`;

        try {
          const [text1, text2] = await Promise.all([
            fetch(url1).then(r => r.text()),
            fetch(url2).then(r => r.text())
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

          let secondSheetExpiryMap = new Map<string, string>();
          Papa.parse(text2, {
            header: false,
            skipEmptyLines: true,
            complete: (results) => {
              const data = results.data as string[][];
              if (data.length > 0) {
                const firstCell = String(data[0][0]).toLowerCase();
                const isHeader = firstCell.includes('mã đơn vị') || firstCell.includes('stt') || firstCell.includes('ma don') || firstCell === '"mã đơn vị"';
                const startIndex = isHeader ? 1 : 0;
                const parsed2 = data.slice(startIndex).map(row => parseCustomerData(row));
                secondSheetExpiryMap = new Map(parsed2.map(c => [c.customerCode, c.inspectionExpiry]));
              }
            }
          });

          if (secondSheetExpiryMap.size > 0 && parsedMain.length > 0) {
            parsedMain = parsedMain.map(c => ({
              ...c,
              isReplaced: !!c.customerCode && secondSheetExpiryMap.has(c.customerCode) && secondSheetExpiryMap.get(c.customerCode) !== c.inspectionExpiry
            }));
          }

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
    loading,
    error,
    fetchCustomers
  };
}
