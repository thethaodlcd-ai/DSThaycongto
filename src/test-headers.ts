import Papa from "papaparse";
fetch('https://docs.google.com/spreadsheets/d/1eAoUT8U-vRVU8RBF8TrdvFoZmRiEzRR1Tnq3oiwgia0/gviz/tq?tqx=out:csv&gid=1131885151')
  .then(res => res.text())
  .then(text => {
    Papa.parse(text, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data;
        if (data.length > 0) {
          let hdIndex = 0;
          for (let i = 0; i < Math.min(data.length, 5); i++) {
            if (data[i].some(cell => String(cell).toLowerCase().includes('mã khách'))) {
              hdIndex = i;
              break;
            }
          }
          const headers = data[hdIndex].map(h => String(h).toLowerCase().trim());
          console.log(headers);
          console.log(data.slice(hdIndex + 1, hdIndex + 4));
        }
      }
    });
  });
