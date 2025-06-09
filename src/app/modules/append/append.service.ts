import { Injectable } from '@angular/core';
import { ApiBaseService } from '@shared/services/global/api-base.service';

import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppendService {

  constructor(
    private readonly apiBase: ApiBaseService
  ) {
    this.loadSessionStorage()
  }
  /**
   * ESTADOS
   */
  private _currentCase: any = {}
  private _currentDocument: any = {}
  private _currentAttachmentForm: any = {}
  private _selectedAttachmentForm: any = {}
  private _numberDocumentForm: any = {}
  private _precargo: any = {}
  private _filesInvestigacion: any[] = []

  /**
   * GETTERS
   */
  get currentCase(): any {
    return this._currentCase
  }

  get currentAttchmentForm(): any {
    return this._currentAttachmentForm;
  }
  get selectedAttachmentForm(): any {
    return this._selectedAttachmentForm;
  }

  get currentDocument(): any {
    return this._currentDocument;
  }

  get numberDocumentForm(): any {
    return this._numberDocumentForm;
  }

  get precargo(): any {
    return this._precargo
  }

  get filesInvestigacion(): any[] {
    return this._filesInvestigacion;
  }

  /**
   * SETTERS
   */
  public saveCaseFound(caseFound: any): void {
    this._currentCase = caseFound;
    sessionStorage.setItem('currentCase', JSON.stringify(caseFound))

  }

  public saveAttachmentForm(attached: any): void {
    this._currentAttachmentForm = attached;
    sessionStorage.setItem('attachmentForm', JSON.stringify(attached));
  }
  public saveSelectedAttachmentForm(selected: any): void {
    this._selectedAttachmentForm = selected;
    sessionStorage.setItem('selectedAttachmentForm', JSON.stringify(selected));
  }
  public saveNumberDocumentForm(numberDocument: any): void {
    this._numberDocumentForm = numberDocument;
    sessionStorage.setItem('numberDocumentForm', JSON.stringify(numberDocument));
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

  public saveFilesInvestigacion(files: any[]): void {
    this._filesInvestigacion = files;
    sessionStorage.setItem('filesInvestigacion', JSON.stringify(files));
  }

  /**
   * CARGA DE INFORMACIÓN
   */
  private loadSessionStorage(): void {
    if (!sessionStorage.getItem('currentCase')) return
    this._currentCase = JSON.parse(sessionStorage.getItem('currentCase'))

    if (!sessionStorage.getItem('attachmentForm')) return
    this._currentAttachmentForm = JSON.parse(sessionStorage.getItem('attachmentForm'))

    if (!sessionStorage.getItem('selectedAttachmentForm')) return
    this._selectedAttachmentForm = JSON.parse(sessionStorage.getItem('selectedAttachmentForm'))

    if (!sessionStorage.getItem('precargo')) return
    this._precargo = JSON.parse(sessionStorage.getItem('precargo'))

    if (!sessionStorage.getItem('document')) return
    this._currentDocument = JSON.parse(sessionStorage.getItem('document'))

    if (!sessionStorage.getItem('filesInvestigacion')) return
    this._filesInvestigacion = JSON.parse(sessionStorage.getItem('filesInvestigacion'))
  }

  public clearTracingStorage(): void {
    sessionStorage.removeItem('currentCase');
    sessionStorage.removeItem('attachmentForm');
    sessionStorage.removeItem('precargo');
    sessionStorage.removeItem('document');
  }
  public clearDocumentStorage(): void {
    // Removemos items específicos en lugar de limpiar
    sessionStorage.removeItem('currentAttchmentForm');
    sessionStorage.removeItem('attachmentForm');
    sessionStorage.removeItem('selectedAttachmentForm');
    sessionStorage.removeItem('numberDocumentForm');
    sessionStorage.removeItem('precargo');
    sessionStorage.removeItem('document');
  }

  public clearAllStorage(): void {
    sessionStorage.clear();
  }

  /**
   * API PARA GENERACION DE PDF
   */
  obtenerPreCargoDocumento(body: any, tipoTramite: any, tipoOrigen: number): Observable<any> {
    return this.apiBase.post('documento', `v1/t/pdf/documento/precargo/${tipoTramite}/${tipoOrigen}`, body);
  }
  guardarPresentarDocumento(body: any): Observable<any> {
    return this.apiBase.post('mesa', `v1/e/documento/registrar`, body)
  }
  validarDocumentoObservado(body: any): Observable<any> {
    return this.apiBase.post('mesa', `v1/e/documento/validarobservado`, body);
  }
  public getPreview(body: Object): Observable<any> {
    return this.apiBase.post('documento', `t/documento/vistaprevia/b64`, body)
  }

  public getVisorPdf(body: Object): Observable<any> {
    return this.apiBase.post('documento', `t/documento/vistaprevia/b64`, body)
  }

  public getPreliminarCargo(body: Object): Observable<any> {
    return this.apiBase.postPreliminarCargo('documento', `t/documento/vistaprevia/b64`, body)
  }

  public registrarDocumento(body: Object): Observable<any> {
    return this.apiBase.post('mesa', `v1/e/documento/registrar`, body)
  }

  public consultarDocumento(codigoDocumento: string): Observable<any> {
    return this.apiBase.get('mesa', `v1/e/documento/consultar/${codigoDocumento}`)
  }
  guardarDocumentoRepositorio(data: any): Observable<any> {
    return this.apiBase.post('repositorio', `cargar`, data);
  }
}
