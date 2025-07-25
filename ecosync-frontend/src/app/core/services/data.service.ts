import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface SensorData {
  timestamp: string;
  sensorName: string;
  temperature: number;
  humidity: number;
  co2: string;
}

export interface SensorDataRecord {
  sensorName: string;
  temperature: number;
  humidity: number;
  co2: string;
}

@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly apiUrl = 'http://localhost:3000/api/data';
  private readonly apiUrlImport = 'http://localhost:3000/api/data/import';

  constructor(private http: HttpClient) {}

  getAll(): Observable<SensorData[]> {
    return this.http.get<SensorData[]>(this.apiUrl).pipe(
      tap(data => console.log('💾 Données reçues :', data))
    );
  }

  getFiltered(start: string, end: string, limit?: number): Observable<SensorData[]> {
    let params: any = { start, end };
    if (limit) params.limit = limit;

    return this.http.get<SensorData[]>(this.apiUrl, { params });
  }
  postOneFile(input: SensorData[]): Observable<string> {
    return this.http.post<string>(this.apiUrlImport, { input });
  }
}
