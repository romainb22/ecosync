import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FriendsService {
  private readonly apiUrl = 'http://localhost:3000';
  pendingRequestsCount$ = new BehaviorSubject<number>(0);

  constructor(private http: HttpClient) {}

  searchUsers(query: string) {
    return this.http.get<{ id: number; email: string }[]>(`${this.apiUrl}/friends/search`, {
      params: { q: query }
    });
  }

  sendFriendRequest(receiverId: number) {
    return this.http.post(`${this.apiUrl}/friends/request`, { receiverId });
  }

  getFriendRequests() {
    return this.http.get<{ id: number, sender: { id: number; email: string } }[]>(`${this.apiUrl}/friends/requests`);
  }

  acceptFriendRequest(requestId: number) {
    return this.http.post(`${this.apiUrl}/friends/accept`, { senderId: requestId });
  }

  rejectFriendRequest(requestId: number) {
    return this.http.post(`${this.apiUrl}/friends/reject`, { senderId: requestId });
  }

  refreshPendingRequestsCount() {
    this.getFriendRequests().subscribe(list => {
      this.pendingRequestsCount$.next(list.length);
    });
  }

  getFriendsList() {
    return this.http.get<{id: number, email: string}[]>(`${this.apiUrl}/friends/list`);
  }
}
