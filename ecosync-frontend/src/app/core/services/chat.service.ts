import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
  isRead: boolean;
  fileUrl?: string;
  fileType?: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly apiUrl = 'http://localhost:3000/messages';

  constructor(private http: HttpClient) {}

  getMessages(friendId: number): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/${friendId}`);
  }

  sendMessage(receiverId: number, content: string, fileUrl?: string, fileType?: string) {
    return this.http.post<Message>(`${this.apiUrl}/`, { receiverId, content, fileUrl, fileType });
  }

  getLastMessages(limit: number = 5): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/last?limit=${limit}`);
  }

  uploadFile(formData: FormData) {
    return this.http.post<{ fileUrl: string, fileType: string }>(`${this.apiUrl}/upload`, formData);
  }
}
