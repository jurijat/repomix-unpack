#!/usr/bin/env node

import { Command } from 'commander';
import * as path from 'path';
import chalk from 'chalk';
import { RepomixUnpacker } from './unpacker';
import { UnpackOptions } from './types';
import { promises as fs } from 'fs';

const program = new Command();

program
  .name('repomix-unpack')
  .description('Extract files from a Repomix output file')
  .version('1.0.0')
  .argument('<input-file>', 'Path to the Repomix output file')
  .option('-o, --output <dir>', 'Output directory (default: ./repomix-extracted)', './repomix-extracted')
  .option('-d, --dry-run', 'Show what would be extracted without actually creating files')
  .option('-v, --verbose', 'Enable verbose output')
  .action(async (inputFile: string, options: any) => {
    try {
      // Validate input file exists
      try {
        await fs.access(inputFile);
      } catch {
        console.error(chalk.red(`Error: Input file not found: ${inputFile}`));
        process.exit(1);
      }

      const unpackOptions: UnpackOptions = {
        inputFile: path.resolve(inputFile),
        outputDir: path.resolve(options.output),
        dryRun: options.dryRun || false,
        verbose: options.verbose || false
      };

      console.log(chalk.bold('Repomix Unpacker'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(`Input file: ${chalk.cyan(unpackOptions.inputFile)}`);
      console.log(`Output directory: ${chalk.cyan(unpackOptions.outputDir)}`);
      if (unpackOptions.dryRun) {
        console.log(chalk.yellow('Mode: DRY RUN (no files will be created)'));
      }
      console.log(chalk.gray('─'.repeat(50)));
      console.log();

      const unpacker = new RepomixUnpacker();
      const result = await unpacker.unpack(unpackOptions);

      // Exit with error code if there were errors
      if (result.errors.length > 0) {
        process.exit(1);
      }

    } catch (error) {
      console.error(chalk.red(`\nError: ${error instanceof Error ? error.message : String(error)}`));
      if (options.verbose && error instanceof Error && error.stack) {
        console.error(chalk.gray(error.stack));
      }
      process.exit(1);
    }
  });

program.parse();