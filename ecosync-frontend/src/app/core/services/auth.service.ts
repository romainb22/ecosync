import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API_URL = 'http://localhost:3000/auth';

  // Nouveau : stream d'état utilisateur connecté
  private _user$ = new BehaviorSubject<boolean>(this.isAuthenticated());
  user$ = this._user$.asObservable();

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.API_URL}/login`, { email, password }).pipe(
      tap((response: any) => {
        localStorage.setItem('token', response.token);
        this._user$.next(true); // Notifie tous les listeners
      })
    );
  }

  register(email: string, password: string): Observable<any> {
    return this.http.post(`${this.API_URL}/register`, { email, password }).pipe(
      tap((res: any) => {
        localStorage.setItem('token', res.token);
        this._user$.next(true);
      })
    );
  }

  checkEmail(email: string) {
    return this.http.post<{ exists: boolean, name?: string }>(
      `${this.API_URL}/check-email`, { email }
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    this._user$.next(false); // Notifie déconnexion
  }

  isAuthenticated(): boolean {
    if (!this.isBrowser()) return false;
    return !!localStorage.getItem('token');
  }

  isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }
}
