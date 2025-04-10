import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { bittytaxToBlockpit } from 'components/convert';
import { MappingConfig } from 'types';

// Set up command line arguments
const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 [options] <inputFiles..>')
  .option('o', {
    alias: 'output',
    describe: 'Output XLSX file name',
    type: 'string',
    demandOption: false // Optional parameter
  })
  .option('c', {
    alias: 'config',
    describe: 'Path to custom mapping configuration file in JSON format',
    type: 'string',
    demandOption: false // Optional parameter
  })
  .help('h')
  .alias('h', 'help')
  .parseSync();

// Check for mandatory input files
if (argv._.length === 0) {
  console.error('Error: At least one input XLSX file is required.');
  process.exit(1);
}

let mappingConfig: MappingConfig | undefined;

if (argv.config) {
  try {
    const configFilePath = path.resolve(argv.config as string);
    const fileContents = fs.readFileSync(configFilePath, 'utf8');
    mappingConfig = JSON.parse(fileContents) as MappingConfig;
  } catch (error) {
    console.error(`Error reading configuration file ${argv.config}:`, (error as Error).message);
    process.exit(1);
  }
}

try {  
  // Get input files and output file name
  const inputFilePaths = argv._.map(String);
  const outputFileName = argv.output as string || 'blockpit_transactions.xlsx'; // Default output file name
  
  // Read input XLSX files into workbooks
  const workbooks: XLSX.WorkBook[] = [];
  
  for (const filePath of inputFilePaths) {
    try {
      // Load workbook with cell dates enabled
      const workbook = XLSX.readFile(filePath, { cellDates: true });
      workbooks.push(workbook);
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, (error as Error).message);
    }
  }
  
  if (workbooks.length === 0) {
    console.error('No valid XLSX files were provided.');
    process.exit(1);
  }
  
  // Aggregate the workbooks
  const resultWorkbook = bittytaxToBlockpit(workbooks, mappingConfig);
  
  // Write the result to file
  const writeOpts = { 
    bookType: 'xlsx' as const, 
    cellDates: true, 
    dateNF: 'yyyy-mm-dd hh:mm:ss'
  };
  
  XLSX.writeFile(resultWorkbook, outputFileName, writeOpts);
  console.log(`Aggregation complete. Output file: ${outputFileName}`);
  console.log('\nWant to support my work? https://haraldheckmann.de/donate');
  
} catch (error) {
  console.error('Error processing files:', (error as Error).message);
  process.exit(1);
} 