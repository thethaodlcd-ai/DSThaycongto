import { readFileSync } from 'fs';

async function run() {
  try {
    const csv1 = await fetch('https://docs.google.com/spreadsheets/d/1eAoUT8U-vRVU8RBF8TrdvFoZmRiEzRR1Tnq3oiwgia0/export?format=csv&gid=0').then(res => res.text());
    const csv2 = await fetch('https://docs.google.com/spreadsheets/d/1eAoUT8U-vRVU8RBF8TrdvFoZmRiEzRR1Tnq3oiwgia0/export?format=csv&gid=1').then(res => res.text());
    const csv3 = await fetch('https://docs.google.com/spreadsheets/d/1eAoUT8U-vRVU8RBF8TrdvFoZmRiEzRR1Tnq3oiwgia0/export?format=csv&gid=2').then(res => res.text());
    
    console.log("CSV 1 Length:", csv1.length);
    console.log("CSV 1 Header:", csv1.split('\n')[0]);
    console.log("CSV 2 Length:", csv2.length);
    if(csv2.length < 500) console.log(csv2);
    console.log("CSV 3 Length:", csv3.length);
  } catch(e) {
    console.error(e);
  }
}
run();
