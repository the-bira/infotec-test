import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ILoginDto, ILoginResponse } from '@aivacol/shared/dist';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private apiUrl = 'http://localhost:3000';
  private tokenKey = 'aivacol_token';

  constructor(private http: HttpClient) { }

  login(credentials: ILoginDto): Observable<ILoginResponse> {
    return this.http.post<ILoginResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap(response => {
        if (response && response.access_token) {
          localStorage.setItem(this.tokenKey, response.access_token);
        }
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getNickname(): string | null {
    const token = this.getToken();
    if (!token) return null;
    const decoded = this.decodeToken(token);
    return decoded ? decoded.nickname : null;
  }

  getTenantId(): string | null {
    const token = this.getToken();
    if (!token) return null;
    const decoded = this.decodeToken(token);
    return decoded ? decoded.tenantId : null;
  }

  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      const decodedPayload = atob(payload);
      return JSON.parse(decodedPayload);
    } catch (error) {
      console.error('Error decoding token', error);
      return null;
    }
  }
}
