import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, Output, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { ChartData, ChartOptions } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { CSVDataImporter } from '../../../core/services/csv-export.service';
import { DataService } from '../../../core/services/data.service';

type Metric = 'temperature' | 'humidity' | 'co2';

@Component({
  selector: 'app-generations-history',
  templateUrl: './generations-history.html',
  standalone: true,
  imports: [CommonModule, MatExpansionModule, MatButtonModule, NgChartsModule]
})
export class GenerationsHistoryComponent {
  @ViewChild('historyCanvas') historyCanvasRef!: ElementRef<HTMLCanvasElement>;
  selectedSession: any = null;
  sessions: any[] = [];
  chartData: ChartData<'line' | 'bar' | 'radar'> = { labels: [], datasets: [] };
  chartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: true, labels: { font: { size: 14 } } },
      tooltip: {
        enabled: true,
        mode: 'nearest',
        intersect: false,
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${context.formattedValue}`;
          }
        }
      }
    },
    scales: {
      x: { ticks: { maxRotation: 45, minRotation: 0, autoSkip: true, font: { size: 12 } } },
      y: {
        beginAtZero: false,
        ticks: { font: { size: 12 } },
        title: { display: true, text: 'Valeur', font: { size: 14 } }
      }
    },
    elements: { point: { radius: 3, hoverRadius: 6 }, line: { tension: 0.3 } }
  };

  constructor(
    private dataService: DataService,
    private csvService: CSVDataImporter,
    private cdr: ChangeDetectorRef
  ) {
    this.loadSessions();
  }

  loadSessions() {
    const raw = localStorage.getItem('generationHistory');
    this.sessions = raw ? JSON.parse(raw) : [];
  }

  panelOpened(session: any) {
    this.selectedSession = session;
    this.loadChartData(session);
  }

  clearHistory() {
    localStorage.removeItem('generationHistory');
    this.sessions = [];
    this.selectedSession = null;
  }

  loadChartData(session: any) {
    if (!session) return;
    const metric = session.metric as Metric;
    const color = this.getColorForMetric(metric);
    const start = new Date(session.from);
    const end = new Date(session.to);

    this.chartData = { labels: [], datasets: [] }; // reset

    this.dataService.getFiltered(start.toISOString(), end.toISOString()).subscribe({
      next: (data) => {
        const filtered = data.filter(d => d.sensorName === session.sensor);
        const values = filtered.map(d => Number(d[metric])).filter(v => !isNaN(v));
        const labels = filtered.map(d => new Date(d.timestamp).toLocaleTimeString());
        const max = Math.max(...values);
        const suggestedMax = max + (metric === 'temperature' ? 5 : 10);

        this.chartData = {
          labels,
          datasets: [
            {
              label: this.metricLabel(metric),
              data: values,
              fill: false,
              tension: 0.1,
              borderColor: color,
              backgroundColor: color
            }
          ]
        };

        this.chartOptions = {
          ...this.chartOptions,
          scales: {
            ...this.chartOptions.scales,
            ['y']: {
              ...(this.chartOptions.scales?.['y'] || {}),
              beginAtZero: true,
              suggestedMax: suggestedMax
            }
          }
        };

        this.cdr.detectChanges();
      },
      error: (err) => {
        this.chartData = { labels: [], datasets: [] };
        this.cdr.detectChanges();
      }
    });
  }

  exportZip() {
    const canvas = this.historyCanvasRef?.nativeElement;
    if (!canvas || typeof canvas.toBlob !== 'function') {
      alert("Le canvas n'est pas disponible ou pas prêt !");
      return;
    }
    // Recharger les données brutes de la période sélectionnée et du capteur
    if (!this.selectedSession) return;
    const { from, to, sensor } = this.selectedSession;
    this.dataService.getFiltered(from, to).subscribe({
      next: (data) => {
        const filtered = data.filter(d => d.sensorName === sensor);
        this.csvService.exportChartAsZip(canvas, filtered, 'graphique');
      },
      error: (err) => {
        alert("Erreur lors de la récupération des données à exporter");
      }
    });
  }

  getColorForMetric(metric: string): string {
    switch (metric) {
      case 'temperature': return 'rgb(255, 99, 132)';
      case 'humidity': return 'rgb(54, 162, 235)';
      case 'co2': return 'rgb(75, 192, 75)';
      default: return 'gray';
    }
  }

  metricLabel(metric: string): string {
    switch (metric) {
      case 'temperature': return 'Température (°C)';
      case 'humidity': return 'Humidité (%)';
      case 'co2': return 'CO₂ (ppm)';
      default: return metric;
    }
  }
}
