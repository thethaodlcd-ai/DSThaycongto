import Papa from 'papaparse';
async function run() {
  const url1 = "https://docs.google.com/spreadsheets/d/1eAoUT8U-vRVU8RBF8TrdvFoZmRiEzRR1Tnq3oiwgia0/gviz/tq?tqx=out:csv&sheet=Danh%20sách%20tổng";
  const url2 = "https://docs.google.com/spreadsheets/d/1eAoUT8U-vRVU8RBF8TrdvFoZmRiEzRR1Tnq3oiwgia0/gviz/tq?tqx=out:csv&sheet=Danh%20sách%20khách%20hàng%20đến%2001/06/2026";
  
  const text1 = await fetch(url1).then(r => r.text());
  const text2 = await fetch(url2).then(r => r.text());
  
  const parsed1 = Papa.parse(text1, { header: true }).data;
  const parsed2 = Papa.parse(text2, { header: true }).data;
  
  const setA = new Set(parsed1.map((r: any) => r['số thiết bị']).filter(Boolean));
  const setB = new Set(parsed2.map((r: any) => r['số thiết bị']).filter(Boolean));
  
  let replacedCount = 0;
  for (let id of setA) {
    if (!setB.has(id)) replacedCount++;
  }
  
  console.log("Total in Danh sách tổng:", setA.size);
  console.log("Total in Danh sách khách hàng:", setB.size);
  console.log("Difference (A - B):", replacedCount);
}
run();
