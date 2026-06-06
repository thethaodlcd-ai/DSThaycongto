import { useState, useCallback } from 'react';
import { Customer, parseCustomerData } from '../types/customer';
import Papa from 'papaparse';

const SPREADSHEET_ID = '1eAoUT8U-vRVU8RBF8TrdvFoZmRiEzRR1Tnq3oiwgia0';

export function useGoogleSheets(accessToken: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [periodicCodes, setPeriodicCodes] = useState<string[]>([]);

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
        const firstSheetTitle = metaData.sheets[0].properties.title;

        const dataRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(firstSheetTitle)}!A2:AA`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!dataRes.ok) {
          throw new Error(`Failed to fetch spreadsheet data: ${dataRes.statusText}`);
        }

        const rawData = await dataRes.json();
        
        if (rawData.values && Array.isArray(rawData.values)) {
          const parsed = rawData.values.map((row: any[]) => parseCustomerData(row));
          setCustomers(parsed);
        } else {
          setCustomers([]);
        }

        // Fetch periodic replacements
        const periodicSheet = metaData.sheets?.find((s: any) => s.properties.sheetId === 1140784872);
        if (periodicSheet) {
          const periodicRes = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(periodicSheet.properties.title)}!A2:A`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (periodicRes.ok) {
            const periodicData = await periodicRes.json();
            if (periodicData.values && Array.isArray(periodicData.values)) {
              setPeriodicCodes(periodicData.values.map((row: any[]) => row[0]).filter(Boolean));
            }
          }
        }
      } else {
        // Fallback: Try to fetch as Public CSV
        const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv`;
        const periodicCsvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=1140784872`;

        Papa.parse(periodicCsvUrl, {
          download: true,
          header: false,
          skipEmptyLines: true,
          complete: (results) => {
            const data = results.data as string[][];
            if (data.length > 0) {
              setPeriodicCodes(data.map(row => row[0]).filter(Boolean));
            }
          }
        });

        Papa.parse(csvUrl, {
          download: true,
          header: false,
          skipEmptyLines: true,
          complete: (results) => {
            // First row might be header
            const data = results.data as string[][];
            if (data.length > 0) {
              // Check if first row is header by looking at first cell
              const firstCell = String(data[0][0]).toLowerCase();
              const isHeader = firstCell.includes('mã đơn vị') || firstCell.includes('stt') || firstCell.includes('ma don') || firstCell === 'mã đơn vị';
              const startIndex = isHeader ? 1 : 0;
              const parsed = data.slice(startIndex).map(row => parseCustomerData(row));
              setCustomers(parsed);
              setLoading(false);
            } else {
              setCustomers([]);
              setLoading(false);
            }
          },
          error: (err: any) => {
            console.error(err);
            setError("Không thể tải dữ liệu. Hãy đảm bảo File Google Sheet đã được Mở quyền chia sẻ thành 'Bất kỳ ai có liên kết' (Public) hoặc bạn phải Đăng nhập.");
            setLoading(false);
          }
        });
        return; // Papa.parse is async and handles our loading state internally
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
    fetchCustomers,
    periodicCodes
  };
}
