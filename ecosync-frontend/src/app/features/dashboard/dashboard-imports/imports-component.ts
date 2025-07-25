import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { CSVDataImporter } from '../../../core/services/csv-export.service'

@Component({
  selector: 'app-imports-component',
  imports: [
    MatCard,
    MatButton,
    NgIf
  ],
  templateUrl: './imports-component.html',
  standalone: true,
  styleUrl: './imports-component.css'
})

export class ImportsComponent {
  constructor(private csvService: CSVDataImporter) {
  }

  selectedFile: File | null = null;

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  uploadFile() {
    if (!this.selectedFile) return;

    const reader = new FileReader();

    reader.onload = () => {
      const fileContent = reader.result;
      this.csvService.uploadFile(fileContent);
      console.log(fileContent);
    };

    reader.onerror = () => {
      console.error('Erreur lors de la lecture du fichier');
    };
    reader.readAsText(this.selectedFile);
  }

  DownloadSampleCSVImportFile(): void {
    const blob = this.csvService.generateSampleFile()
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sampleImportFile.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
