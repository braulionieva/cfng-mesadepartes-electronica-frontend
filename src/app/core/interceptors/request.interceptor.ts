import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { catchError, finalize, Observable, switchMap, throwError } from 'rxjs';
import { TokenService } from '@shared/services/auth/token.service';
import { Router } from '@angular/router';
import { AuthService } from '@shared/services/auth/auth.service';
import { CREDENTIALS, AUTOCOMPLETE, BASE_URL } from '@environments/environment';

const { BASIC } = CREDENTIALS

@Injectable()
export class RequestInterceptor implements HttpInterceptor {

  private isRefreshing = false;
  private readonly requestsQueue: HttpRequest<any>[] = [];
  private readonly updateUrlTranslate: string = AUTOCOMPLETE ? '' : BASE_URL

  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly router: Router
  ) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Lista de rutas y endpoints que no requieren token
    const publicRoutes = [
      'idperu/status',
      'verificacion-id-peru',
      'oauth2/token',
      'api.ipify.or',
      'captcha',
      'auth/login-url'
    ];

    // Si la ruta está en la lista de públicas, la dejamos pasar sin token
    if (publicRoutes.some(route => request.url.includes(route))) {
      if (request.url.includes('oauth2/token')) {
        request = request.clone({
          setHeaders: {
            Authorization: `Basic ${BASIC}`,
          }
        });
      }
      return next.handle(request);
    }

    // Para el resto de rutas, aplicamos la lógica normal de token
    request = this.addTokenHeader(request);

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          if (!request.url.includes('oauth2/token')) {
            return this.handle401Error(request, next)
          }
          this.authService.logout()
        }

        return throwError(error);
      })
    );
  }

  private addTokenHeader(request: HttpRequest<any>) {
    let token: string

    token = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJST0JFUlQgWkFDSEFSWSBFU1BJTk9aQSBDRVNQRURFUyIsImlzcyI6Imh0dHA6Ly8xODEuMTc2LjE0NS4xNTU6NzA4My9jZmV0b2tlbi9yZXNvdXJjZXMvdjIvbG9naW5Ub2tlbiIsImlwIjoiMTkyLjE2OC4xLjE0IiwidXN1YXJpbyI6eyJlc3RhZG8iOiIwMSIsImlwIjoiMTkyLjE2OC4xLjE0IiwidXN1YXJpbyI6IjEwNzY0MjY0IiwiaW5mbyI6eyJhcGVsbGlkb1BhdGVybm8iOiJFU1BJTk9aQSIsImVzUHJpbWVyTG9naW4iOmZhbHNlLCJkbmkiOiIxMDc2NDI2NCIsIm5vbWJyZXMiOiJST0JFUlQgWkFDSEFSWSIsImFwZWxsaWRvTWF0ZXJubyI6IkNFU1BFREVTIn0sImNvZERlcGVuZGVuY2lhIjoiNDAwNjAxNDUwNCIsImRlcGVuZGVuY2lhIjoiNMKwIEZJU0NBTElBIFBST1ZJTkNJQUwgUEVOQUwgQ09SUE9SQVRJVkEgREUgVkVOVEFOSUxMQSIsImNvZERlc3BhY2hvIjoiNDAwNjAxNDUwNC0yIiwic2VkZSI6IkNPUlBPUkFUSVZBIiwiZGVzcGFjaG8iOiIywrAgREVTUEFDSE8iLCJjb2RDYXJnbyI6IkZQIiwiY29kU2VkZSI6IjAwMTAwIiwiY2FyZ28iOiJGSVNDQUwgUFJPVklOQ0lBTCIsImNvZERpc3RyaXRvRmlzY2FsIjoiMDA0NyIsImRpc3RyaXRvRmlzY2FsIjoiRElTVFJJVE8gRklTQ0FMIERFIExJTUEgTk9ST0VTVEUiLCJkbmlGaXNjYWwiOiIxMDc2NDI2NCIsImRpcmVjY2lvbiI6IkFBLiBISC4gTE9TIExJQ0VOQ0lBRE9TIE1aLiBWLSAzIExPVEUgMzMgLSBWRU5UQU5JTExBIiwiZmlzY2FsIjoiUk9CRVJUIFpBQ0hBUlkgRVNQSU5PWkEgQ0VTUEVERVMiLCJjb3JyZW9GaXNjYWwiOiJjcmlzb3RnQGhvdG1haWwuY29tIiwiY29kSmVyYXJxdWlhIjoiMDEiLCJjb2RDYXRlZ29yaWEiOiIwMSIsImNvZEVzcGVjaWFsaWRhZCI6IjAxIiwidWJpZ2VvIjoiMDcwMTA2IiwiZGlzdHJpdG8iOiJWRU5UQU5JTExBIiwiY29ycmVvIjoiY3Jpc290Z0Bob3RtYWlsLmNvbSIsInRlbGVmb25vIjoiIiwic2lzdGVtYXMiOlt7ImNvZGlnbyI6IjE0NSIsIm9wY2lvbmVzIjpbIjAyIiwiMDMiLCIwNCIsIjA3IiwiMjEiLCIyMiIsIjIzIiwiMjQiLCIyNSIsIjI2IiwiMjgiLCIzMSIsIjQ2IiwiNTAiXSwicGVyZmlsZXMiOlsiMDMiXX0seyJjb2RpZ28iOiIxNDciLCJvcGNpb25lcyI6W10sInBlcmZpbGVzIjpbIjExIl19LHsiY29kaWdvIjoiMjAwIiwib3BjaW9uZXMiOlsiMjAwLTAxIiwiMjAwLTAzIiwiMjAwLTA0IiwiMjAwLTA2IiwiMjAwLTA5Il0sInBlcmZpbGVzIjpbIjI1IiwiMjkiLCIzMSJdfSx7ImNvZGlnbyI6IjE1NSIsIm9wY2lvbmVzIjpbIjAyIiwiMDQiLCIwNSIsIjA2IiwiMDciLCIwOCIsIjA5Il0sInBlcmZpbGVzIjpbIjIxIl19LHsiY29kaWdvIjoiMjAzIiwib3BjaW9uZXMiOlsiMjAzLTAxIiwiMjAzLTAyIl0sInBlcmZpbGVzIjpbIjY0Il19XX0sImlhdCI6MTYyNTc4NjY5NSwiZXhwIjoxNzgzNTUzMDk1fQ.MYVn7aUf-CWoZaNqRvoCSAUz1t1J3LOsVos2SAQj1orveXvYg1onhCRe9PbRkXBbMQvCZIAt0JgEkLKxzfjmMw'

    let headers: any = { Authorization: `Bearer ${token}` }

    if (!request.url.includes('persona-denuncia') && !request.url.includes('cdn/api/upload') && !request.url.includes('mocha') && !request.url.includes('i18n') && !request.url.includes('openstreetmap')) {
      return request.clone({
        setHeaders: headers,
      });
    }

    if (request.url.includes('i18n')) {
      const newRequest = request.clone({ url: this.updateUrlTranslate + request.url, });
      return newRequest
    }

    return request
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler) {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.authService.login(true).pipe(
        switchMap((response) => {
          const newToken = response.token;
          this.tokenService.save(newToken);
          return next.handle(this.addTokenHeader(request));
        }),
        catchError((error) => {
          this.authService.logout();
          return throwError(error);
        }),
        finalize(() => {
          this.isRefreshing = false;
          this.processPendingRequests(next);
        })
      ).subscribe();
      this.requestsQueue.push(request);
    } else {
      this.requestsQueue.push(request);
    }
    return new Observable<HttpEvent<any>>();
  }

  private processPendingRequests(next: HttpHandler) {
    // Retirar la primera solicitud pendiente
    const requests = this.requestsQueue.splice(0, this.requestsQueue.length);
    // Realizar solicitudes pendientes
    requests.forEach((request) => {
      next.handle(this.addTokenHeader(request)).subscribe();
    });
  }

}
