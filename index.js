const cheerio = require('cheerio');
const fs = require('fs');
const clc = require('cli-color');

// Define custom log functions for different message types
const error = message => console.log(clc.red.bold('(⬣) ' + message));
const info = message => console.log(clc.cyan.bold('(i) ' + message));
const success = message => console.log(clc.green.bold('(✓) ' + message));

// Initialize an empty data array
let data = [];

try {
  info('Reading HTML file...');
  // Read the HTML file
  const HTML = fs.readFileSync('./HTML/James.docx.html', 'utf8');
  success('HTML file read successfully.');

  info('Loading HTML content using Cheerio...');
  // Load the HTML content using Cheerio
  const $ = cheerio.load(HTML);
  let reference;

  // Loop through paragraphs with class 'c2'
  $('p.c2').each((i, elem) => {
    info(`Extracting data from paragraph ${i + 1}...`);
    // Extract the reference (e.g., "1:1")
    let referenceElm = $(elem).find('span.c1');
    let referenceMatch = /\d+:\d+/;
    let referenceMatches = referenceElm.text().match(referenceMatch);

    if (referenceMatches) {
      reference = referenceMatches[0];
    }

    // Extract commentary text and source
    let commentaryElm = $(elem).find('span.c0');
    let commentary = commentaryTextToTextAndSource(commentaryElm.text().split(':')[1] ? commentaryElm.text().split(':')[1].trim() : '');
    let commentaryAuthor = commentaryElm.text().split(':')[0] ? commentaryElm.text().split(':')[0].trim() : '';

    // Check if both text and source are not empty
    if (commentary.text !== '' && commentary.source !== '') {
      data.push({
        chapter: reference.split(':')[0],
        verse: reference.split(':')[1],
        text: commentary.text,
        source: commentary.source,
        author: commentaryAuthor
      });
      success('Data extracted successfully.');
    } else {
      info('No valid data found in this paragraph.');
    }
  });

  info('Writing the extracted data to a JSON file...');
  // Write the extracted data to a JSON file
  fs.writeFileSync('./data.json', JSON.stringify(data, null, 2));
  success('Data extraction and JSON file writing completed successfully!');
} catch (err) {
  error('An error occurred: ' + err.message);
}

// Helper function to split commentary text and source
function commentaryTextToTextAndSource(text) {
  let lastPeriod = text.lastIndexOf('.');
  let textWithoutLastPeriod = text.substring(0, lastPeriod);
  let secondToLastPeriod = textWithoutLastPeriod.lastIndexOf('.');
  let commentaryText = textWithoutLastPeriod.substring(0, secondToLastPeriod);
  let commentarySource = textWithoutLastPeriod.substring(secondToLastPeriod + 1);

  // Recursively remove any numeric content from the source
  while(/\d+/.test(commentarySource)) {
    commentarySource = commentaryTextToTextAndSource(commentarySource).source.trim();
  }
  return {text: commentaryText.trim(), source: commentarySource.trim()};
}
