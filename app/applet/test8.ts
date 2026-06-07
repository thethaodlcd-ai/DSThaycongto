import Papa from 'papaparse';
async function run() {
  const url1 = "https://docs.google.com/spreadsheets/d/1eAoUT8U-vRVU8RBF8TrdvFoZmRiEzRR1Tnq3oiwgia0/gviz/tq?tqx=out:csv&sheet=Danh%20sách%20tổng";
  const url2 = "https://docs.google.com/spreadsheets/d/1eAoUT8U-vRVU8RBF8TrdvFoZmRiEzRR1Tnq3oiwgia0/gviz/tq?tqx=out:csv&sheet=Danh%20sách%20khách%20hàng%20đến%2001/06/2026";
  
  const text1 = await fetch(url1).then(r => r.text());
  const text2 = await fetch(url2).then(r => r.text());
  
  const parsed1 = Papa.parse(text1, { header: true }).data;
  const parsed2 = Papa.parse(text2, { header: true }).data;
  
  const m1 = new Map(parsed1.map((r: any) => [r['Mã khách hàng'], r]));
  const m2 = new Map(parsed2.map((r: any) => [r['Mã khách hàng'], r]));
  let diffExpCountByCus = 0;
  for (let [id, val2] of m2) {
    if (!id) continue;
    const val1 = m1.get(id);
    if (val1 && val1['Hạn kiểm định'] !== val2['Hạn kiểm định']) {
      diffExpCountByCus++;
    }
  }

  const d1 = new Map(parsed1.map((r: any) => [r['số thiết bị'], r]));
  const d2 = new Map(parsed2.map((r: any) => [r['số thiết bị'], r]));
  let diffExpCountByDevice = 0;
  for (let [id, val2] of d2) {
    if (!id) continue;
    const val1 = d1.get(id);
    if (val1 && val1['Hạn kiểm định'] !== val2['Hạn kiểm định']) {
      diffExpCountByDevice++;
    }
  }
  
  console.log("Total diff Hạn kiểm định (by Mã khách hàng):", diffExpCountByCus);
  console.log("Total diff Hạn kiểm định (by số thiết bị):", diffExpCountByDevice);
}
run();
