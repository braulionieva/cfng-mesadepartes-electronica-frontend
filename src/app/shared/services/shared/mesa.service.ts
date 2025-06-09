import { Injectable } from '@angular/core';
import { DomainType } from '@shared/types/auth/domain-type';
import { ApiBaseService } from '../global/api-base.service';
import { Observable } from 'rxjs';
import { ProfileRegistration } from '@shared/interfaces/personal-data/profile-registration';
import { DocumentoCargo } from '@shared/interfaces/documento/documento-cargo';

@Injectable({
  providedIn: 'root'
})
export class MesaService {

  private readonly mesaKey: DomainType = 'mesa';

  constructor(private readonly apiBase: ApiBaseService) { }

  registerProfile(idIdentify: string, body: ProfileRegistration): Observable<any> {
    return this.apiBase.post(this.mesaKey, `denuncia/perfil/${idIdentify}`, body);
  }

  registerDocumento(idDocumento: number, body: DocumentoCargo): Observable<any> {
    return this.apiBase.put(this.mesaKey, `documento/${idDocumento}`, body);
  }

  getComplaintData(idComplaint: string): Observable<any> {
    return this.apiBase.get(this.mesaKey, `denuncia/${idComplaint}`);
  }

  saveComplaintData(idComplaint: string, dataPreliminar: string): Observable<any> {
    let body = { dataPreliminar }
    return this.apiBase.post(this.mesaKey, `denuncia/${idComplaint}`, body);
  }

  getPreview(idComplaint: string, data: string): Observable<any> {
    let body = { data }
    return this.apiBase.post(this.mesaKey, `cargo/preliminar/${idComplaint}`, body);
  }

  deleteComplaint(idComplaint: string): Observable<any> {
    return this.apiBase.delete(this.mesaKey, `denuncia/${idComplaint}`);
  }

  getDocumentType(): Observable<any> {
    return this.apiBase.get('maestros', `catalogo/grupo/tipoDocumentoMesaParte`)
  }

  /*getConditions(): Observable<any> {
    return this.apiBase.get('maestros', `verifications/CondicionesMesaParte`)
  }*/

  generateNewComplaint(body: Object): Observable<any> {
    return this.apiBase.post(this.mesaKey, `v1/e/denuncia`, body)
  }

  identificarDenunciaDuplicada(body: Object): Observable<any> {
    return this.apiBase.post(this.mesaKey, `v1/e/denuncia/duplicidadDenuncia`, body)
  }

  getRegistrarVerificacion(body: Object): Observable<any> {
    return this.apiBase.post(this.mesaKey, `v1/e/codigoverificacion/`, body)
  }

  getVerificacionCodigo(body: Object): Observable<any> {
    return this.apiBase.put(this.mesaKey, `v1/e/codigoverificacion/verificar`, body)
  }

  getSedesGrupoAleatorio(body: Object): Observable<any> {
    return this.apiBase.post(this.mesaKey, `v1/e/sgf/consultar-grupo-aleatorio`, body)
  }

}

