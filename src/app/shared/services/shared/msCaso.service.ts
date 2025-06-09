import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from '@shared/services/global/api-base.service';
import { DomainType } from '@shared/types/auth/domain-type';

@Injectable({
  providedIn: 'root'
})
export class MsCasoService {
  private readonly casoKey: DomainType = 'mesa';

  constructor(private readonly apiBase: ApiBaseService) { }

  consultCase(caseNumber: string, tipoDocumento: number, numeroIdentificacion: string): Observable<any> {
    return this.apiBase.get(this.casoKey, `v1/e/caso/${caseNumber}/tipoDocumento/${tipoDocumento}/persona/${numeroIdentificacion}`)
  }

}
