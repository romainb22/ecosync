import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class MessagesService {
  private readonly apiUrl = 'http://localhost:3000';
  unreadCount$ = new BehaviorSubject<number>(0);
  private pollingStarted = false; // ⚡️ protection contre multi-polling

  constructor(private http: HttpClient) {}

  getUnreadCount() {
    return this.http.get<{ count: number }>(`${this.apiUrl}/messages/unread-count`);
  }

  pollUnreadCount() {
    if (this.pollingStarted) return; // important!
    this.pollingStarted = true;
    timer(0, 4000) // ← toutes les 4s, ajuste selon tes besoins
      .pipe(
        switchMap(() => this.getUnreadCount())
      )
      .subscribe(res => this.unreadCount$.next(res.count));
  }

  markMessagesAsRead(friendId: number) {
    return this.http.post(`${this.apiUrl}/messages/mark-read`, { friendId });
  }
}
