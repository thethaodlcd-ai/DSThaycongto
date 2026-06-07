const SPREADSHEET_ID = '1eAoUT8U-vRVU8RBF8TrdvFoZmRiEzRR1Tnq3oiwgia0';
fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?fields=sheets(properties(title))`)
  .then(res => res.text())
  .then(text => console.log(text));
