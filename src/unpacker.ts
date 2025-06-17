import * as path from 'path';
import { RepomixParser } from './parser';
import { FileWriter } from './fileWriter';
import { UnpackOptions, UnpackResult, ParseProgress } from './types';
import ora from 'ora';
import chalk from 'chalk';

export class RepomixUnpacker {
  private parser: RepomixParser;
  private writer: FileWriter;

  constructor() {
    this.parser = new RepomixParser();
    this.writer = new FileWriter();
  }

  async unpack(options: UnpackOptions): Promise<UnpackResult> {
    const result: UnpackResult = {
      filesCreated: 0,
      directoriesCreated: 0,
      errors: [],
      skipped: []
    };

    // Validate input file
    const validation = await this.parser.validateRepomixFile(options.inputFile);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid Repomix file');
    }

    // Validate output directory
    const outputValidation = await this.writer.validateOutputDirectory(options.outputDir);
    if (!outputValidation.valid) {
      throw new Error(outputValidation.error || 'Invalid output directory');
    }

    // Create spinner for progress
    const spinner = options.verbose ? null : ora('Parsing Repomix file...').start();

    try {
      // Parse the file
      const fileEntries = await this.parser.parseFile(
        options.inputFile,
        options.verbose ? this.createProgressLogger() : undefined
      );

      if (spinner) {
        spinner.text = `Found ${fileEntries.length} files to extract`;
      } else if (options.verbose) {
        console.log(chalk.blue(`Found ${fileEntries.length} files to extract`));
      }

      // Process each file
      for (let i = 0; i < fileEntries.length; i++) {
        const entry = fileEntries[i];
        
        if (spinner) {
          spinner.text = `Extracting ${i + 1}/${fileEntries.length}: ${entry.path}`;
        } else if (options.verbose) {
          console.log(chalk.gray(`Extracting: ${entry.path}`));
        }

        try {
          await this.writer.writeFile(entry, options.outputDir, options.dryRun);
          result.filesCreated++;
        } catch (error) {
          const errorMsg = `Failed to write ${entry.path}: ${error instanceof Error ? error.message : String(error)}`;
          result.errors.push(errorMsg);
          
          if (options.verbose) {
            console.error(chalk.red(errorMsg));
          }
        }
      }

      // Get directory count
      result.directoriesCreated = this.writer.getCreatedDirectoriesCount();

      if (spinner) {
        spinner.succeed(chalk.green('Extraction completed successfully!'));
      }

      // Print summary
      this.printSummary(result, options);

    } catch (error) {
      if (spinner) {
        spinner.fail(chalk.red('Extraction failed'));
      }
      throw error;
    }

    return result;
  }

  private createProgressLogger(): (progress: ParseProgress) => void {
    return (progress: ParseProgress) => {
      const fileInfo = progress.currentFile ? ` (processing: ${progress.currentFile})` : '';
      console.log(chalk.gray(`Parsed ${progress.currentLine} lines${fileInfo}`));
    };
  }

  private printSummary(result: UnpackResult, options: UnpackOptions): void {
    console.log('\n' + chalk.bold('Summary:'));
    console.log(chalk.green(`✓ Files ${options.dryRun ? 'to be created' : 'created'}: ${result.filesCreated}`));
    console.log(chalk.green(`✓ Directories ${options.dryRun ? 'to be created' : 'created'}: ${result.directoriesCreated}`));
    
    if (result.errors.length > 0) {
      console.log(chalk.red(`✗ Errors: ${result.errors.length}`));
      if (options.verbose) {
        result.errors.forEach(error => {
          console.log(chalk.red(`  - ${error}`));
        });
      }
    }

    if (result.skipped.length > 0) {
      console.log(chalk.yellow(`⚠ Skipped: ${result.skipped.length}`));
    }

    if (!options.dryRun) {
      console.log(chalk.blue(`\nOutput directory: ${path.resolve(options.outputDir)}`));
    }
  }
}