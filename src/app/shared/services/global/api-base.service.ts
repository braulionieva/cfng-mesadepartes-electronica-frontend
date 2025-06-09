import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DOMAIN_API_MANAGER, ENDPOINTS_MICROSERVICES } from '@environments/environment';
import { DomainType } from '@shared/types/auth/domain-type';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

@Injectable({
  providedIn: 'root',
})
export class ApiBaseService {

  constructor(private readonly http: HttpClient) { }

  postAuth(path: string, body: string, httpHeaders: Object): Observable<any> {
    return this.http.post(`${this.getDomain('auth')}${path}`, body, httpHeaders);
  }

  post(domain: DomainType, path: string, body: object): Observable<any> {
    return this.http.post(`${this.getDomain(domain)}${path}`, body, httpOptions);
  }

  get(domain: DomainType, path: string, options?: any): Observable<any> {
    return this.http.get(`${this.getDomain(domain)}${path}`, options || httpOptions);
  }

  put(domain: DomainType, path: string, body: object): Observable<any> {
    return this.http.put(`${this.getDomain(domain)}${path}`, body, httpOptions);
  }

  delete(domain: DomainType, path: string): Observable<any> {
    return this.http.delete(`${this.getDomain(domain)}${path}`, httpOptions);
  }

  postPreliminarCargo(domain: DomainType, path: string, body: object): Observable<any> {
    return this.http.post(`${this.getDomain(domain)}${path}`, body, httpOptions);
  }

  postMultiPart(url: string, body: object): Observable<any> {
    return this.http.post(url, body);
  }
  getDomain(domain: DomainType): string {
    return {
      'auth': DOMAIN_API_MANAGER,
      'maestros': ENDPOINTS_MICROSERVICES.MS_MAESTROS,
      'persona': ENDPOINTS_MICROSERVICES.MS_PERSONA,
      'mesa': ENDPOINTS_MICROSERVICES.MS_MESA,
      'documento': ENDPOINTS_MICROSERVICES.MS_DOCUMENTO,
      'repositorio': ENDPOINTS_MICROSERVICES.MS_REPOSITORIO
    }[domain]
  }


}
