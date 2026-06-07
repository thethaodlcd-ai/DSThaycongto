const target = "https://docs.google.com/spreadsheets/d/1eAoUT8U-vRVU8RBF8TrdvFoZmRiEzRR1Tnq3oiwgia0/export?format=csv&gid=0";
fetch(target)
  .then(r => r.text())
  .then(t => {
    const lines = t.split('\n');
    let thay2026 = 0;
    let han2026 = 0;
    let han2026_and_thay2026 = 0;
    for(let i=1; i<lines.length; i++) {
       const row = lines[i].split(',');
       if(row.length > 12) {
          const han = row[8]; // Hạn kiểm định
          const treo = row[12]; // Ngày treo tháo
          const kiem = row[7]; // Ngày kiểm định
          
          let isHan2026 = han && han.includes('2026');
          let isThay2026 = (treo && treo.includes('2026')) || (kiem && kiem.includes('2026'));
          
          if(isHan2026) han2026++;
          if(isThay2026) thay2026++;
          if(isHan2026 && isThay2026) han2026_and_thay2026++;
       }
    }
    console.log({ han2026, thay2026, han2026_and_thay2026 });
  });
