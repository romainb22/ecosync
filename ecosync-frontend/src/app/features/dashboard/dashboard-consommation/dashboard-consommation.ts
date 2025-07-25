import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCard } from '@angular/material/card';
import { MatChip } from '@angular/material/chips';
import { MatIcon } from '@angular/material/icon';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { CSVDataImporter } from '../../../core/services/csv-export.service';
import { DataService, SensorData } from '../../../core/services/data.service';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-dashboard-consommation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTableModule,
    NgChartsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCard,
    MatChip,
    NgxMaterialTimepickerModule,
    MatIcon
  ],
  templateUrl: './dashboard-consommation.html',
  styleUrls: ['./dashboard-consommation.css']
})
export class DashboardConsommationComponent implements OnInit {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  dataSource: SensorData[] = [];
  displayedColumns = ['timestamp', 'sensorName', 'temperature', 'humidity', 'co2'];

  sensors: string[] = [];
  filteredData: SensorData[] = [];
  selectedSensor = '';
  chartType: 'line' | 'bar' | 'radar' = 'line';
  selectedMetric: 'temperature' | 'humidity' | 'co2' = 'temperature';
  limit?: number;

  thresholds = {
    temperature: 26,
    humidity: 60,
    co2: 800
  };

  startDateOnly?: Date;
  endDateOnly?: Date;
  startTime: string = '00:00';
  endTime: string = '23:59';

  chartData: ChartData<'line' | 'bar' | 'radar'> = { labels: [], datasets: [] };
  chartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        labels: {
          font: {
            size: 14
          }
        }
      },
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
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 0,
          autoSkip: true,
          font: {
            size: 12
          }
        }
      },
      y: {
        beginAtZero: false,
        ticks: {
          font: {
            size: 12
          }
        },
        title: {
          display: true,
          text: 'Valeur',
          font: {
            size: 14
          }
        }
      }
    },
    elements: {
      point: {
        radius: 3,
        hoverRadius: 6
      },
      line: {
        tension: 0.3
      }
    }
  };

  private readonly thresholdKey = 'dashboardThresholds';

  constructor(private dataService: DataService, private csvService: CSVDataImporter) {}

  ngOnInit(): void {
    this.loadData();
    this.loadThresholds();
  }

  exportZip() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || typeof canvas.toBlob !== 'function') {
      alert("Le canvas n'est pas disponible ou n'est pas prêt !");
      return;
    }
    this.csvService.exportChartAsZip(canvas, this.filteredData, 'graphique');
  }

  loadData(): void {
    if (this.startDateOnly && this.endDateOnly) {
      const start = new Date(this.startDateOnly);
      const [sh, sm] = this.startTime.split(':').map(Number);
      start.setHours(sh, sm);

      const end = new Date(this.endDateOnly);
      const [eh, em] = this.endTime.split(':').map(Number);
      end.setHours(eh, em);

      this.dataService.getFiltered(start.toISOString(), end.toISOString(), this.limit).subscribe({
        next: (data) => {
          this.dataSource = data;
          this.sensors = Array.from(new Set(data.map(d => d.sensorName).filter(Boolean)));
        },
        error: () => console.error('Erreur chargement données filtrées')
      });
    } else {
      this.dataService.getAll().subscribe({
        next: (data) => {
          this.dataSource = data;
          this.sensors = Array.from(new Set(data.map(d => d.sensorName).filter(Boolean)));
        },
        error: () => console.error('Erreur chargement données complètes')
      });
    }
  }

  loadThresholds(): void {
    if (typeof localStorage === 'undefined') return;

    const saved = localStorage.getItem(this.thresholdKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.thresholds = {
          ...this.thresholds,
          ...parsed
        };
      } catch {
        console.warn('Seuils mal formatés');
      }
    }
  }

  saveThresholds(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(this.thresholdKey, JSON.stringify(this.thresholds));
  }

  getThresholdDataset(metric: 'temperature' | 'humidity' | 'co2'): any[] {
    const threshold = this.thresholds[metric];
    if (!threshold || !this.filteredData.length) return [];

    const labelCount = this.filteredData.length;

    return [
      {
        label: `Seuil (${threshold})`,
        data: Array(labelCount).fill(threshold),
        borderColor: 'rgba(255, 165, 0, 0.6)', // orange
        borderDash: [10, 5],
        fill: false,
        pointRadius: 0
      }
    ];
  }

  generateChart(): void {
    this.filteredData = this.dataSource.filter(d => d.sensorName === this.selectedSensor);

    const values = this.filteredData.map(d => Number(d[this.selectedMetric])).filter(v => !isNaN(v));
    const color = this.getColorForMetric(this.selectedMetric);
    const maxValue = Math.max(...values);
    const margin = {
      temperature: 5,
      humidity: 10,
      co2: 200
    }[this.selectedMetric];

    const yMax = Math.ceil(maxValue + margin);

    this.chartOptions = {
      ...this.chartOptions,
      scales: {
        ...this.chartOptions.scales,
        y: {
          ...this.chartOptions.scales?.['y'],
          beginAtZero: true,
          suggestedMin: 0,
          suggestedMax: yMax,
          ticks: {
            font: { size: 12 }
          },
          title: {
            display: true,
            text: this.metricLabel(this.selectedMetric),
            font: { size: 14 }
          }
        }
      }
    };

    this.chartData = {
      labels: this.filteredData.map(d => new Date(d.timestamp).toLocaleTimeString()),
      datasets: [
        {
          label: this.metricLabel(this.selectedMetric),
          data: values,
          fill: false,
          tension: 0.1,
          borderColor: color,
          backgroundColor: color
        },
        ...(this.getThresholdDataset(this.selectedMetric) || [])
      ]
    };

    this.saveToHistory();
  }

  getColorForMetric(metric: 'temperature' | 'humidity' | 'co2'): string {
    switch (metric) {
      case 'temperature': return 'rgb(255, 99, 132)'; // rouge
      case 'humidity': return 'rgb(54, 162, 235)';    // bleu
      case 'co2': return 'rgb(75, 192, 75)';          // vert
    }
  }

  metricLabel(metric: 'temperature' | 'humidity' | 'co2'): string {
    switch (metric) {
      case 'temperature': return 'Température (°C)';
      case 'humidity': return 'Humidité (%)';
      case 'co2': return 'CO₂ (ppm)';
    }
  }

  resetFilters(): void {
    this.startDateOnly = undefined;
    this.endDateOnly = undefined;
    this.startTime = '00:00';
    this.endTime = '23:59';
    this.selectedSensor = '';
    this.selectedMetric = 'temperature';
    this.chartType = 'line';
    this.filteredData = [];
    this.chartData = { labels: [], datasets: [] };
    this.loadData(); // recharge toutes les données
  }

  hasExceededThreshold(): boolean {
    const threshold = this.thresholds[this.selectedMetric];
    return this.filteredData.some(d => {
      const value = Number(d[this.selectedMetric]);
      return !isNaN(value) && value > threshold;
    });
  }

  exportCSV(): void {
    if (!this.filteredData?.length) return;

    const header = Object.keys(this.filteredData[0]).join(';');
    const rows = this.filteredData.map(row =>
      Object.values(row).join(';')
    );

    const csvContent = [header, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'consommation.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  onSessionSelected(session: { from: string; to: string }) {
    const from = new Date(session.from);
    const to = new Date(session.to);

    this.startDateOnly = from;
    this.endDateOnly = to;

    // Format HH:mm pour startTime et endTime
    const pad = (n: number) => n.toString().padStart(2, '0');
    this.startTime = `${pad(from.getHours())}:${pad(from.getMinutes())}`;
    this.endTime = `${pad(to.getHours())}:${pad(to.getMinutes())}`;

    this.loadData();
  }

  saveToHistory(): void {
    if (!this.startDateOnly || !this.endDateOnly) return;

    const from = new Date(this.startDateOnly);
    const to = new Date(this.endDateOnly);

    // Utiliser les heures fournies si disponibles, sinon valeurs par défaut
    const [sh, sm] = this.startTime ? this.startTime.split(':').map(Number) : [0, 0];
    const [eh, em] = this.endTime ? this.endTime.split(':').map(Number) : [23, 59];

    from.setHours(sh, sm, 0, 0);
    to.setHours(eh, em, 59, 999); // fin de la minute

    const history = JSON.parse(localStorage.getItem('generationHistory') || '[]');

    history.unshift({
      from: from.toISOString(),
      to: to.toISOString(),
      sensor: this.selectedSensor,
      metric: this.selectedMetric,
      chartType: this.chartType
    });

    localStorage.setItem('generationHistory', JSON.stringify(history.slice(0, 20)));
  }
}
