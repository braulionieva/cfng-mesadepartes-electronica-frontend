import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DomainType } from "@shared/types/auth/domain-type";
import { ApiBaseService } from "@shared/services/global/api-base.service";

@Injectable({
  providedIn: 'root'
})
export class IpService {
  private readonly mesaKey: DomainType = 'mesa';

  constructor(private readonly apiBase: ApiBaseService) { }

  getIp(): Observable<any> {
    return this.apiBase.get(this.mesaKey, 'v1/e/util/ip');
  }
}
