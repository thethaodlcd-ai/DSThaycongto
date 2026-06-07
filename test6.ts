async function run() {
  const url1 = "https://docs.google.com/spreadsheets/d/1eAoUT8U-vRVU8RBF8TrdvFoZmRiEzRR1Tnq3oiwgia0/gviz/tq?tqx=out:csv&sheet=Danh%20sách%20tổng";
  const url2 = "https://docs.google.com/spreadsheets/d/1eAoUT8U-vRVU8RBF8TrdvFoZmRiEzRR1Tnq3oiwgia0/gviz/tq?tqx=out:csv&sheet=Danh%20sách%20khách%20hàng%20đến%2001/06/2026";
  
  const text1 = await fetch(url1).then(r => r.text());
  const text2 = await fetch(url2).then(r => r.text());
  
  console.log("Sheet 1 length:", text1.length, "starts with:", text1.substring(0, 50));
  console.log("Sheet 2 length:", text2.length, "starts with:", text2.substring(0, 50));
}
run();
