import { Injectable } from '@angular/core';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { SensorData, DataService } from './data.service';

type CSVType = 'string' | 'number' | 'date';


@Injectable({ providedIn: 'root' })
export class CSVDataImporter {
  headerTypes: any[];
  headers: string[];
  sampleRow: any[];
  columnSeparator: string;
  lineSeparator: string;

  constructor(private dataService: DataService) {
    this.headerTypes = ["date", "number", "number", "number", "string"];
    this.headers = [ 'timestamp', 'temperature', 'humidity', 'co2', 'sensorName' ];
    this.sampleRow = [ new Date("2025-07-18T17:00:24.414408"), 23.1, 51, 376, 'Salon' ];
    this.columnSeparator = ',';
    this.lineSeparator = '\n';
  }
  private isValidType(value: string, expectedType: CSVType): boolean {
    switch (expectedType) {
      case 'number':
        return !isNaN(Number(value));
      case 'date':
        return !isNaN(Date.parse(value));
      case 'string':
        return true;
      default:
        return false;
    }
  }
  generateSampleFile(): Blob {
    const header = this.headers.join(this.columnSeparator);
    const sampleRow = this.sampleRow.join(this.columnSeparator);
    const csvContent = [ header, sampleRow ].join(this.lineSeparator);
    return new Blob([ csvContent ], { type: 'text/csv;charset=utf-8;' });
  }
  validateHeader(headerLine: string): boolean {
    const headers = headerLine.split(this.columnSeparator);
    return headers.length === this.headers.length &&
      headers.every((h, i) => h.trim() === this.headers[i]);
  }
  validateLine(lineContent: string): boolean {
    const fields = lineContent.split(this.columnSeparator);
    return fields.every((field, i) => this.isValidType(field.trim(), this.headerTypes[i]));
  }

  commitFile(lines: string[]): void {
    let allLinesToPost = [];
    for (let line of lines)
    {
      let currentFields = line.split(this.columnSeparator);
      let lineToPost: SensorData = {
        "timestamp" : currentFields[0],
        "temperature" : Number(currentFields[1]),
        "humidity" : Number(currentFields[2]),
        "co2" : currentFields[3],
        "sensorName" : currentFields[4]
      };
      allLinesToPost.push(lineToPost);
    }
    console.log(allLinesToPost)
    this.dataService.postOneFile(allLinesToPost).subscribe({
      next: (result: string) => {
        console.log(`Feedback from backend : ${result}`);
        //We should handle success maybe
      },
      error: () => console.error('Erreur chargement lors du posting')
    });
  }
  uploadFile(fileContent: string | ArrayBuffer | null): boolean {
    if (!fileContent)
    {
      console.warn("File is empty");
      return false;
    }
    //TODO : we should handle this case
    if (fileContent instanceof ArrayBuffer)
    {
      return false;
    }
    const lines = fileContent.split(this.lineSeparator).filter(line => line.trim() !== '');

    if (!this.validateHeader(lines[0])) {
      console.error("L'entête ne contient pas le bon nombre de colonnes ou n'est pas conforme.");
      return false;
    }
    //Header has been validated, we can continue without it.
    lines.splice(0, 1);
    let linesToBeDeleted = [];
    //Iterate over lines in reverse so that we can splice invalid lines
    for (let lineIndex = lines.length - 1; lineIndex >=0 ; lineIndex--) {
      const lineContent = lines[lineIndex];
      if (!this.validateLine(lineContent)) {
        console.error(`La ligne n°${lineIndex} contient une erreur.`);
        lines.splice(lineIndex, 1);
      }
    }
    if (lines.length === 0)
    {
      return false;
    }
    else
    {
      this.commitFile(lines);
      return true;
    }
  }

  exportChartAsZip(canvas: HTMLCanvasElement, data: any[], filenamePrefix = 'graphique') {
    const zip = new JSZip();

    // ➕ PNG
    canvas.toBlob((blob) => {
      if (!blob) return;
      zip.file(`${filenamePrefix}.png`, blob);

      // ➕ CSV
      const header = Object.keys(data[0]).join(';');
      const rows = data.map((row: any) => Object.values(row).join(';'));
      const csvContent = [header, ...rows].join('\n');
      zip.file(`${filenamePrefix}.csv`, csvContent);

      // 📦 Génération ZIP
      zip.generateAsync({ type: 'blob' }).then((zipBlob) => {
        saveAs(zipBlob, `${filenamePrefix}.zip`);
      });
    }, 'image/png');
  }
}
