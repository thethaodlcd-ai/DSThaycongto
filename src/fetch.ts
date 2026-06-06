import https from 'https';

https.get('https://docs.google.com/spreadsheets/d/1eAoUT8U-vRVU8RBF8TrdvFoZmRiEzRR1Tnq3oiwgia0/export?format=csv&gid=0', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, (res2) => {
            let data2 = '';
            res2.on('data', chunk => data2 += chunk);
            res2.on('end', () => console.log(data2.split('\n').slice(0, 3).join('\n')));
        });
    } else {
        console.log(data.split('\n').slice(0, 3).join('\n'));
    }
  });
});
