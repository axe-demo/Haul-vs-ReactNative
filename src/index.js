import "@babel/register";

import fs from 'fs-extra';

import testcases from './cases';

async function run() {
  let results = {};
  for (var key in testcases) {
    results[key] = await testcases[key]();
  }
  return results;
}

run().then(res => {
  // Merge results into a file
  let data;
  try { data = JSON.parse(fs.readFileSync('_results.json'), 'utf-8'); } catch (e) { data = {} }
  for (var key in res) {
    data[key] = data[key] || {};
    for (var packager in res[key]) {
      data[key][packager] = data[key][packager] || {};
      for (var column in res[key][packager]) {
        data[key][packager][column] = data[key][packager][column] || [];
        data[key][packager][column].push(res[key][packager][column]);
      }
    }
  }

  fs.writeFileSync('_results.json', JSON.stringify(data, null, 2), 'utf-8');

  // Update README.md
  let readme = fs.readFileSync('README.md', 'utf-8');
  const resultsHeader = '## Benchmark Results';
  const tableHeader = '\n\n' + resultsHeader + '\n\n' +
    '| Case | Packager | Average Time (s) |\n' +
    '| --- | --- | --- |\n';
  let tableRows = '';

  for (var key in data) {
    for (var packager in data[key]) {
      let times = [];
      for (var column in data[key][packager]) {
        times = times.concat(data[key][packager][column]);
      }
      const avg = times.length ? (times.reduce((a, b) => a + b, 0) / times.length).toFixed(3) : 'N/A';
      tableRows += `| ${key} | ${packager} | ${avg} |\n`;
    }
  }

  const newContent = tableHeader + tableRows;
  if (readme.indexOf(resultsHeader) !== -1) {
    readme = readme.replace(new RegExp(resultsHeader + '[\\s\\S]*'), newContent);
  } else {
    readme += newContent;
  }
  fs.writeFileSync('README.md', readme, 'utf-8');

}, (...a) => console.log('Error', ...a));


