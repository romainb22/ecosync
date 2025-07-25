import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, timer, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ChatSyncService {
  private readonly apiUrl = 'http://localhost:3000';
  public incomingMessages$ = new BehaviorSubject<any[]>([]);

  constructor(private http: HttpClient) {
    // Poll toutes les 3s
    timer(0, 3000).pipe(
      switchMap(() => this.http.get<any[]>(`${this.apiUrl}/messages/last`))
    ).subscribe(msgs => {
      this.incomingMessages$.next(msgs);
    });
  }
}
