import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
//primeng
import { MessagesModule } from "primeng/messages";
import { ButtonModule } from "primeng/button";
import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
//pdf viewer
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { Denuncia } from '@shared/interfaces/complaint/complaint-registration';
import { ProgressBarModule } from 'primeng/progressbar';
import { TokenService } from '@shared/services/auth/token.service';
import { LOCALSTORAGE } from '@environments/environment';
import { CryptService } from '@shared/services/global/crypt.service';
import {
  SLUG_CONFIRM_RESPONSE, SLUG_DOCUMENT, SLUG_DOCUMENT_TYPE,
  SLUG_EXTENSION_ARCHIVO, SLUG_ORIGEN, SLUG_PROFILE, SLUG_TYPE_INGRESO, SLUG_VERIFICADO, TIPO_ACCION_ESTADO
} from '@shared/helpers/slugs';
import { ProfileType } from '@shared/helpers/dataType';
import { Subscription } from 'rxjs';
import { TracingService } from '@modules/tracing/tracing.service';


import { AppendService } from "@modules/append/append.service";
import { StorageService } from "@shared/services/storage.service";
import { AlertComponent } from "@shared/components/alert/alert.component";
import { ConfirmedRegisterModal } from '../confirmed-register-modal.component';

const { DENUNCIA_KEY, NOMBRE_DOCUMENTO_KEY } = LOCALSTORAGE
@Component({
  standalone: true,
  selector: 'app-document-preview',
  templateUrl: './document-preview.component.html',
  imports: [
    CommonModule, MessagesModule, ButtonModule, ProgressBarModule, PdfViewerModule, DynamicDialogModule, AlertComponent
  ],
  styles: [`
    .visor-background {
      width: 100%;
      background-color: #e8e8e880;
    }

    .visor-pdf {
      width: 100%;
      height: 1135px;
    }
  `],
  providers: [DialogService]
})
export class DocumentPreviewComponent implements OnInit {
  /***************/
  /*  VARIABLES  */
  /***************/
  private readonly sumaTotalFolios: number = 0;
  public completeName: string = ''
  private readonly cellPhone: string = ''
  private readonly numeroDni: string = ''
  private readonly email: string = ''
  private readonly subsana: boolean = false
  //private codigoDocumentoEscritoPadre: string = null
  //private codigoDocumentoObservado: string = null
  public documentoObservado: any;
  dataPresentarDocumento: any = null
  public urlPdf: string = ''
  public data: Denuncia = null;
  public files: any = null;
  public filesInvestigacion: any = null;

  public messages = [{
    severity: 'warn',
    //isVerification: true,
    detail: this.warnMessage
  }];
  validaToken
  public caseData: any
  public suscriptions: Subscription[] = []
  public refModal: DynamicDialogRef;

  public loading: boolean = true

  public complaintId: string
  public tmpProfile: ProfileType = SLUG_PROFILE.CITIZEN

  public policeUnit: string = ''
  public judicialUnit: string = ''

  public crime: string = ''
  //public prosecutors = prosecutors

  public previewData: any = null

  public documentName: string = ''

  public isWithAbogado: boolean = false

  /*****************/
  /*  CONSTRUCTOR  */

  /*****************/
  constructor(
    private readonly router: Router,
    private readonly dialogService: DialogService,
    private readonly tokenService: TokenService,
    private readonly cryptService: CryptService,
    private readonly trackingService: TracingService,
    private readonly appendService: AppendService,
    private readonly storageService: StorageService
  ) {

    let valida = localStorage.getItem(LOCALSTORAGE.VALIDATE_KEY);
    this.validaToken = JSON.parse(this.cryptService.decrypt(valida));

    if (this.validaToken.registrado) {
      this.router.navigate(['presentar-documento/datos-documento'])
    }
    else {
      this.caseData = this.validaToken.case
      this.subsana = this.validaToken.subsana
      this.numeroDni = this.validaToken.personaNatural.dni
      this.cellPhone = this.validaToken.cellPhone
      this.email = this.validaToken.email
      this.documentoObservado = this.validaToken.documentoObservado
    }
  }

  /****************/
  /*  LIFE CYCLE  */
  /****************/
  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Get user info
    const personaNatural = this.tokenService.getItemValidateToken('personaNatural')
    personaNatural && (this.completeName = `${personaNatural.nombres} ${personaNatural.apellidoPaterno} ${personaNatural.apellidoMaterno}`)

    // Obtener archivos del token
    this.files = this.tokenService.getItemValidateToken('files')
    this.filesInvestigacion = this.tokenService.getItemValidateToken('filesInvestigacion')

    // Obtener el perfil seleccionado actual
    const profile = this.tokenService.getItemValidateToken('typeProfile')
    if (profile !== '') {
      this.tmpProfile = profile as ProfileType
    }
    // Obtener la dependencia policial
    if (this.tmpProfile === SLUG_PROFILE.PNP) {

      const dependencia = this.tokenService.getItemValidateToken('policeUnit')
      dependencia && (this.policeUnit = dependencia)
    }

    // Obtener la dependencia judicial
    if (this.tmpProfile === SLUG_PROFILE.PJ) {
      const dependencia = this.tokenService.getItemValidateToken('judicialUnit')
      dependencia && (this.judicialUnit = dependencia)
    }

    // Obtener si fue ingresada por abogado
    const isWithAbogado = this.tokenService.getItemValidateToken('isWithAbogado')
    isWithAbogado && (this.isWithAbogado = isWithAbogado)

    if (this.router.url.includes('realizar-denuncia')) {
      // Get complaint id
      this.complaintId = this.tokenService.getItemValidateToken('complaintId')
      // Validate if exist complaint information
      this.validate()
    } else {
      this.initPresentarDocumento()
    }
  }

  /*****************/
  /*  GET METHODS  */
  /*****************/

  get isComplaintProcess(): boolean {
    return this.router.url.includes('realizar-denuncia')
  }

  get title(): string {
    return (
      this.isComplaintProcess
        ? 'Confirmación de denuncia'
        : 'Confirmación de registro'
    )
  }

  get subtitle(): string {
    return (
      this.isComplaintProcess
        ? 'Por favor revise los datos de la denuncia antes de registrarlo.'
        : 'Por favor revise los datos del documento antes de registrarlo.'
    )
  }

  get warnMessage(): string {
    return (
      this.isComplaintProcess
        ? 'Cuando registre la denuncia se le asignará un número de caso, una fiscalia y despacho que gestionará su denuncia.'
        : 'Cuando se genere el documento se le asignará un número de documento.'
    )
  }

  get buttonTxt(): { confirm: string, cancel: string } {
    return (
      this.isComplaintProcess
        ? { confirm: 'Registrar denuncia', cancel: 'Regresar' }
        : { confirm: 'Registrar documento', cancel: 'Regresar ' }
    )
  }

  /**************************/
  /*  VALIDATE INFORMATION  */
  /**************************/

  public async validate(): Promise<void> {

    if (localStorage.getItem(DENUNCIA_KEY)) {
      this.data = JSON.parse(this.cryptService.decrypt(localStorage.getItem(DENUNCIA_KEY)))
      localStorage.removeItem(DENUNCIA_KEY)

      return;
    }
    this.router.navigate(['/realizar-denuncia/datos-denuncia'])
  }


  obtenerPreCargoDocumento(data: any) {
    let perfilDocumento = this.subsana === true ? SLUG_TYPE_INGRESO.OBSERVED : SLUG_TYPE_INGRESO.NEW

    this.appendService.obtenerPreCargoDocumento(data, `${perfilDocumento}-${this.tmpProfile}`, SLUG_ORIGEN.MPE).subscribe({
      next: (resp) => {
        this.getUrl(String(resp))
      },
      error: (error) => {
        this.getUrl(String(error.error.text));
      },
    });
  }

  get documentNumber(): string {
    const { prefix, number, counter } = this.appendService.numberDocumentForm.value
    return `${prefix}-${number}-${counter}`
  }

  /******************/
  /*  PROFILE TYPE  */
  /******************/
  public getProfileType(profile: ProfileType): string {
    let type: string = ''
    switch (profile) {
      case SLUG_PROFILE.CITIZEN:
        type = 'MPE-CIUDADANO';
        break;
      case SLUG_PROFILE.PNP:
        type = 'MPE-POLICÍA NACIONAL';
        break;
      case SLUG_PROFILE.PJ:
        type = 'MPE-PODER JUDICIAL';
        break;
      default:
        type = 'MPE-ENTIDAD';
        break;
    }
    return type
  }

  /*****************************************/
  /*  CONFIRM OR GO BACK TO PREVIOUS STEP  */
  /*****************************************/
  public previousStep(): void {
    this.router.navigate(['presentar-documento/datos-documento'])
  }
  /*************/
  /*  CONFIRM  */
  /*************/
  public nextStep(): void {
    this.confirmGeneration()
  }

  public confirmGeneration(): void {

    this.refModal = this.dialogService.open(ConfirmedRegisterModal, {
      showHeader: false,
      contentStyle: { 'max-width': '672px', 'padding': '0' },
      data: { name: this.completeName }
    })

    this.refModal.onClose.subscribe((option) => {
      if (option === SLUG_CONFIRM_RESPONSE.OK) {
        this.generateComplaint()
      }
    })
  }

  public generateComplaint() {
    this.storageService.createItem(NOMBRE_DOCUMENTO_KEY, JSON.stringify(this.dataPresentarDocumento));

    this.router.navigate(['presentar-documento/documentos-registrados']);
  }

  /************/
  /*  OTHERS  */
  /************/
  public getUrl(dataB64: string): void {
    if (dataB64) {
      const base64 = dataB64.replace(/\s/g, '');
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const file = new Blob([byteArray], { type: 'application/pdf' });

      this.loading = false;
      this.urlPdf = URL.createObjectURL(file);
    }
  }


  public getCurrentDate(): string {
    const fechaHora = new Date();
    const opcionesFecha = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    };

    const opcionesHora = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }

    return `${fechaHora.toLocaleString('es-ES', opcionesFecha as Intl.DateTimeFormatOptions)} ${fechaHora.toLocaleString('es-ES', opcionesHora as Intl.DateTimeFormatOptions)}`;
  }


  /**
   * Entrada para preparar datos y precarga del documento.
   */
  private initPresentarDocumento(): void {
    const archivos = this.collectArchivos();
    this.dataPresentarDocumento = this.buildDataPresentarDocumento(archivos);
    this.obtenerPreCargoDocumento(this.dataPresentarDocumento.reporte);
  }

  /**
   * Construye el listado de archivos principal y adjuntos.
   */
  private collectArchivos(): any[] {
    const archivos: any[] = [];

    if (this.files?.length) {
      archivos.push(this.mapFilePrincipal(this.files[0]));
    }

    if (this.filesInvestigacion?.length) {
      this.filesInvestigacion.forEach(f => archivos.push(this.mapFileAdjunto(f)));
    }

    return archivos;
  }

  private mapFilePrincipal(file: any): any {
    const sel = this.appendService.selectedAttachmentForm;
    return {
      tipoArchivo: 'principal',
      idTipoDocumento: sel.documentType.codigo,
      nodeId: file.nodeId,
      numeroFolios: file.numeroFolios,
      nombreOriginal: file.nombreOriginal,
      tamanyo: file.tamanyo,
      numeroDocumento: sel.showCodigoDocumento || null,
      nombreTipoDocumento: sel.documentType.nombre
    };
  }

  private mapFileAdjunto(file: any): any {
    return {
      tipoArchivo: 'adjunto',
      nodeId: file.nodeId,
      numeroFolios: file.numeroFolios,
      nombreOriginal: file.nombreOriginal,
      tamanyo: file.tamanyo
    };
  }

  private buildDataPresentarDocumento(archivos: any[]): any {
    const persona = this.validaToken.personaNatural;
    const sel = this.appendService.selectedAttachmentForm;
    const form = this.appendService.currentAttchmentForm;
    const perfilDoc = this.subsana ? SLUG_TYPE_INGRESO.OBSERVED : SLUG_TYPE_INGRESO.NEW;

    return {
      codigoUsuario: persona.dni,
      idTipoOrigen: SLUG_ORIGEN.MPE,
      idTablaDescripcion: this.validaToken.validateIdentity.idTablaDescripcion,
      idPerfil: this.tmpProfile,
      remitente: this.buildRemitente(persona),
      movimiento: this.buildMovimiento(),
      documentoEscrito: {
        idDocumentoEscritoPadre: this.subsana ? this.documentoObservado.idDocumentoEscrito : null,
        numeroCaso: this.caseData.codigoCaso.replaceAll('-', '') || '-',
        idTipoDocumento: sel.documentType.codigo,
        descripcionTipoDocumento: sel.documentType.nombre,
        idExtensionArchivo: SLUG_EXTENSION_ARCHIVO.PDF,
        idCaso: this.caseData.idCaso,
        sumillaDocumento: form.attachedInformation,
        flagMedidasProteccion: sel.isProtection ? '1' : '0',
        idTipoTramiteDocumento: perfilDoc,
        observacionDocumento: form.attachedObservation,
        archivo: archivos
      },
      reporte: this.buildReporte(sel, form, archivos.length)
    };
  }

  private buildRemitente(persona: any): any {
    return {
      idPersona: this.caseData.idPersona,
      idTipoDocumentoIdentidad: SLUG_DOCUMENT_TYPE.DNI,
      apellidoPaterno: persona.apellidoPaterno,
      apellidoMaterno: persona.apellidoMaterno,
      nombre: persona.nombres,
      correoElectronico: this.validaToken.email,
      numeroDocumentoIdentidad: persona.dni,
      flagVerificado: SLUG_VERIFICADO.SI,
      idTipoSujeto: this.tmpProfile
    };
  }

  private buildMovimiento(): any {
    return {
      idCaso: this.caseData.idCaso,
      idDependenciaPoderJudicial: this.caseData.idDependenciaPJudicial,
      idOrganoJudicial: null,
      idAccionEstado: TIPO_ACCION_ESTADO.REGISTRA_DOCUMENTO_DESPACHO,
      idDenuncia: this.caseData.idDenuncia
    };
  }

  private buildReporte(sel: any, form: any, anexoCount: number): any {
    return {
      tipoDocumento: sel.documentType.nombre,
      numeroDocumento: 'POR ASIGNAR',
      codigoDocumentoObservado: this.documentoObservado?.codigoDocumento,
      numeroCaso: this.caseData.codigoCaso,
      distritoFiscal: this.caseData.distritoFiscal,
      especialidad: this.caseData.especialidad,
      motivoIngreso: this.getProfileType(this.tmpProfile),
      fiscalia: this.caseData.fiscalia,
      despacho: this.caseData.despacho,
      fechaIngreso: 'POR ASIGNAR',
      remitente: this.completeName,
      documentoIdentidad: `${SLUG_DOCUMENT.DNI} - ${this.numeroDni}`,
      tipoParte: this.caseData.tipoParteSujeto?.toUpperCase(),
      documentoPresentado: `${sel.documentType.nombre} - ${sel.showCodigoDocumento || 'S/N'}`,
      numeroFolios: this.files[0].numeroFolios,
      asunto: form.attachedInformation,
      observaciones: form.attachedObservation,
      dependenciaJud: this.judicialUnit || '-',
      medidaProteccion: sel.isProtection ? 'SI' : 'NO',
      entidad: this.caseData.razonSocial,
      representante: `${this.caseData.nombresRepresentante} ${this.caseData.paternoRepresentante} ${this.caseData.maternoRepresentante}`,
      dependenciaPol: this.policeUnit || '-',
      anexo: anexoCount
    };
  }



}
