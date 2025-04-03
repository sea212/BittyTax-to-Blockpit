const fs = require('fs');
const path = require('path');
const yargs = require('yargs');
const { aggregateXlsxFiles } = require('./convert'); // Adjust the path if necessary
const yaml = require('js-yaml');

// Set up command line arguments
const argv = yargs
  .usage('Usage: $0 [options] <inputFiles..>')
  .option('o', {
    alias: 'output',
    describe: 'Output XLSX file name',
    type: 'string',
    demandOption: false // Optional parameter
  })
  .help('h')
  .alias('h', 'help')
  .argv;

// Check for mandatory input files
if (argv._.length === 0) {
  console.error('Error: At least one input XLSX file is required.');
  process.exit(1);
}

// Load mapping configuration from mapping.yaml
const mappingFilePath = path.join(__dirname, 'mapping.yaml');
let mappingConfig;

try {
  mappingConfig = yaml.load(fs.readFileSync(mappingFilePath, 'utf8'));
} catch (error) {
  console.error('Error loading mapping.yaml:', error.message);
  process.exit(1);
}

// Get input files and output file name
const inputFiles = argv._;
const outputFileName = argv.output || 'aggregated_output.xlsx'; // Default output file name

// Invoke the aggregation function
aggregateXlsxFiles(inputFiles, outputFileName, mappingConfig)
  .then(result => {
    console.log(`Aggregation complete. Output file: ${result}`);
  })
  .catch(error => {
    console.error('Error during aggregation:', error.message);
  }); 