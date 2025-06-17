import { promises as fs } from 'fs';
import * as path from 'path';
import { FileEntry } from './types';

export class FileWriter {
  private createdDirectories = new Set<string>();

  async writeFile(entry: FileEntry, outputDir: string, dryRun: boolean = false): Promise<void> {
    const fullPath = path.join(outputDir, entry.path);
    const directory = path.dirname(fullPath);

    if (dryRun) {
      console.log(`[DRY RUN] Would create: ${fullPath}`);
      return;
    }

    // Create directory if it doesn't exist
    await this.ensureDirectory(directory);

    // Write the file
    await fs.writeFile(fullPath, entry.content, 'utf8');
  }

  async ensureDirectory(dirPath: string): Promise<boolean> {
    if (this.createdDirectories.has(dirPath)) {
      return false; // Already created
    }

    try {
      await fs.access(dirPath);
      return false; // Directory already exists
    } catch {
      // Directory doesn't exist, create it
      await fs.mkdir(dirPath, { recursive: true });
      this.createdDirectories.add(dirPath);
      return true; // New directory created
    }
  }

  async validateOutputDirectory(outputDir: string): Promise<{ valid: boolean; error?: string }> {
    try {
      // Check if the path exists
      const stats = await fs.stat(outputDir).catch(() => null);
      
      if (stats && !stats.isDirectory()) {
        return { 
          valid: false, 
          error: `Output path exists but is not a directory: ${outputDir}` 
        };
      }

      // Try to create the directory if it doesn't exist
      if (!stats) {
        await fs.mkdir(outputDir, { recursive: true });
      }

      // Check write permissions by trying to write a temp file
      const testFile = path.join(outputDir, '.repomix-unpack-test');
      try {
        await fs.writeFile(testFile, 'test', 'utf8');
        await fs.unlink(testFile);
      } catch (error) {
        return { 
          valid: false, 
          error: `No write permission in output directory: ${outputDir}` 
        };
      }

      return { valid: true };
    } catch (error) {
      return { 
        valid: false, 
        error: `Error validating output directory: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }

  getCreatedDirectoriesCount(): number {
    return this.createdDirectories.size;
  }

  async cleanupEmptyDirectories(_outputDir: string): Promise<void> {
    // Optional: Remove empty directories after unpacking
    for (const dir of Array.from(this.createdDirectories).reverse()) {
      try {
        const files = await fs.readdir(dir);
        if (files.length === 0) {
          await fs.rmdir(dir);
          this.createdDirectories.delete(dir);
        }
      } catch {
        // Ignore errors during cleanup
      }
    }
  }
}