import { Injectable } from '@angular/core';
import { ApiBaseService } from '@shared/services/global/api-base.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TracingService {
  constructor(private readonly apiBase: ApiBaseService) {
    this.loadSessionStorage();
  }

  /**
   * ESTADOS
   */
  private _currentCase: any = {};
  private _currentDocument: any = {};
  private _currentAttachmentForm: any = {};
  private _currentAttachmentFormHechos: any = {}
  private _precargo: any = {};

  /**
   * GETTERS
   */
  get currentCase(): any {
    return this._currentCase;
  }

  get currentAttchmentForm(): any {
    return this._currentAttachmentForm;
  }

  get currentDocument(): any {
    return this._currentDocument;
  }

  get precargo(): any {
    return this._precargo;
  }

  get currentAttachmentFormHechos(): any {
    return this._currentAttachmentFormHechos;
  }

  /**
   * SETTERS
   */
  public saveCaseFound(caseFound: any): void {
    this._currentCase = caseFound;
    sessionStorage.setItem('currentCase', JSON.stringify(caseFound));
    //localStorage.setItem(LOCALSTORAGE.VALIDATE_KEY, this.cryptService.encrypt(JSON.stringify(validation)))
  }

  public saveAttachmentForm(attached: any): void {
    this._currentAttachmentForm = attached;
    sessionStorage.setItem('attachmentForm', JSON.stringify(attached));
  }

  public saveAttachmentFormHechos(attached: any): void {
    this._currentAttachmentFormHechos = attached;
    sessionStorage.setItem('attachmentFormHechos', JSON.stringify(attached));
  }

  public saveDocument(document: any): void {
    this._currentDocument = document;
    sessionStorage.setItem('document', JSON.stringify(document));
  }

  public savePrecargo(payload: any): void {
    this._precargo = payload;
    sessionStorage.setItem('precargo', JSON.stringify(payload));
  }

  public saveCargo(payload: any): void {
    this._precargo = payload;
    sessionStorage.setItem('cargo', JSON.stringify(payload));
  }

  /**
   * CARGA DE INFORMACIÓN
   */
  private loadSessionStorage(): void {
    if (!sessionStorage.getItem('currentCase')) return;
    this._currentCase = JSON.parse(sessionStorage.getItem('currentCase'));

    if (!sessionStorage.getItem('attachmentForm')) return;
    this._currentAttachmentForm = JSON.parse(
      sessionStorage.getItem('attachmentForm')
    );

    if (!sessionStorage.getItem('precargo')) return;
    this._precargo = JSON.parse(sessionStorage.getItem('precargo'));
    if (!sessionStorage.getItem('document')) return;
    this._currentDocument = JSON.parse(sessionStorage.getItem('document'));
  }

  public clearTracingStorage(): void {
    sessionStorage.removeItem('currentCase');
    sessionStorage.removeItem('attachmentForm');
    sessionStorage.removeItem('precargo');
    sessionStorage.removeItem('document');
  }

  /**
   * API PARA GENERACION DE PDF
   */
  public getPreview(body: Object, idPerfil: number): Observable<any> {
    return this.apiBase.post('documento', `v1/t/pdf/seguimiento/cargo/${idPerfil}`, body)
  }

  public getVisorPdf(body: Object): Observable<any> {
    return this.apiBase.post('documento', `t/documento/vistaprevia/b64`, body);
  }

  public getPreliminarCargo(body: Object, idPerfil: number): Observable<any> {
    return this.apiBase.postPreliminarCargo(
      'documento',
      `v1/t/pdf/denuncia/precargo/${idPerfil}/1`,
      body
    );
  }
}
