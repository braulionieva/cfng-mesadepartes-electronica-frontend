import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

//primeng
import { MessagesModule } from "primeng/messages";
import { ButtonModule } from "primeng/button";
import { ProgressBarModule } from 'primeng/progressbar';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { TracingService } from '@modules/tracing/tracing.service';

import { formatDate, formatDateString } from '@shared/utils/utils';

import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ConfirmToCancelComplaintModal } from '@modules/complaint/components/complaint-data/confirm-cancel-complaint-modal/confirm-cancel-complaint-modal.component';
import { ProfileType } from '@shared/helpers/dataType';
import { SLUG_ENTITY, SLUG_PROFILE, getProfile } from '@shared/helpers/slugs';
import { TokenService } from '@shared/services/auth/token.service';
import { VIEW_GENERATED_COMPLAINT_MINUTES } from '@environments/environment';
import { RequestDocumento } from '@shared/interfaces/documento/request-documento';
import { Item } from '@shared/interfaces/documento/item';
import { Archivo } from '@shared/interfaces/documento/archivo';
import { MesaService } from '@shared/services/shared/mesa.service';
import { Entidad } from '@shared/interfaces/complaint/complaint-registration';
import { DocumentoCargo } from '@shared/interfaces/documento/documento-cargo';
import { AlertComponent } from '@shared/components/alert/alert.component';

const JASPER = {
  [SLUG_PROFILE.CITIZEN]: 'http://172.16.111.112:8081/repositorio/resources/publico/carpeta/plantilla/jasper/v1_cargo_ingreso_doc_ciudadano.jasper',
  [SLUG_PROFILE.PNP]: 'http://172.16.111.112:8081/repositorio/resources/publico/carpeta/plantilla/jasper/v1_cargo_ingreso_doc_pnp.jasper',
  [SLUG_PROFILE.PJ]: 'http://172.16.111.112:8081/repositorio/resources/publico/carpeta/plantilla/jasper/v1_cargo_ingreso_doc_pj.jasper',
  [SLUG_PROFILE.ENTITY]: 'http://172.16.111.112:8081/repositorio/resources/publico/carpeta/plantilla/jasper/v1_cargo_ingreso_doc_entidad.jasper'
}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    MessagesModule,
    NgxExtendedPdfViewerModule,
    ProgressBarModule,
    DynamicDialogModule,
    AlertComponent
  ],
  templateUrl: './completed-process.component.html',
  providers: [DialogService]
})
export class CompletedProcessComponent implements OnInit, OnDestroy {
  public messages = [
    {
      severity: 'success',
      detail: this.successMessage
    },
    {
      severity: 'warn',
      detail: this.timeMessage
    }
  ];
  public policeUnit: string = ''
  public judicialUnit: string = ''
  public tmpProfile: ProfileType = SLUG_PROFILE.CITIZEN;

  public completeName: string = ''
  public pdfURL: string = ''
  public refModal: DynamicDialogRef;
  public email: string = 'example@email.com'
  public loading: boolean = true
  public countdownInterval;
  public remainingTime: number = 0
  public documentName: string = ''
  public currentAttchmentForm: any;
  public selectedAttachmentForm: any;

  public itemCurrentCase: any;
  documentoEnvio: RequestDocumento;
  documentSave;
  constructor(
    private readonly router: Router,
    private readonly tracingService: TracingService,
    private readonly dialogService: DialogService,
    private readonly mesaService: MesaService,
    private readonly tokenService: TokenService
  ) {
    this.itemCurrentCase = JSON.parse(sessionStorage.getItem('currentCase'));

    if (sessionStorage.getItem('currentCase')) {
      this.tracingService.currentCase.data = JSON.parse(sessionStorage.getItem('currentCase'))
    }

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  ngOnInit(): void {

    const personaNatural = this.tokenService.getItemValidateToken('personaNatural')
    this.completeName = `${personaNatural.nombres} ${personaNatural.apellidoPaterno} ${personaNatural.apellidoMaterno}`;

    const profile = this.tokenService.getItemValidateToken('typeProfile')

    if (profile !== '') this.tmpProfile = profile as ProfileType

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
    // Get user email.
    const email = this.tokenService.getItemValidateToken('email')

    email && (this.email = email)

    this.tmpProfile = this.tokenService.getItemValidateToken('typeProfile') as ProfileType


    const usuario = this.tokenService.getItemValidateToken('personaNatural')

    this.completeName = `${usuario.nombres} ${usuario.apellidoPaterno} ${usuario.apellidoMaterno}`;

    if (this.router.url.includes('documento-generado')) {
      this.getPDFPreview()
    } else {//documentos-registrados luego de precargo

      this.registrarDocumento()
    }
  }

  ngOnDestroy(): void {
    this.countdownInterval && clearInterval(this.countdownInterval);
    this.tracingService.clearTracingStorage();
  }

  registrarDocumento() {
    let searchCase = this.tracingService.currentCase;
    let atachment = this.tracingService.currentAttchmentForm;
    let document = this.tracingService.currentDocument;

    let itemDespacho: Item = {
      id: searchCase.idDespacho,
      nombre: searchCase.despacho
    };

    let itemFiscalia: Item = {
      id: searchCase.idFiscalia,
      nombre: searchCase.fiscalia
    };
    let itemDistritoFiscal: Item = {
      id: searchCase.idDitritoFiscal,
      nombre: searchCase.ditritoFiscal
    };
    let anexo: Archivo = {
      id: atachment.attachedFiles[0].id,
      descripcion: atachment.attachedInformation
    }
    const [dependencia, anio, numCase] = searchCase.codigoCaso.split('-');

    let documentoEnvio: RequestDocumento = {
      idTipoDocumento: null,
      otroTipo: null,
      asunto: null,
      otroDocumento: null,
      observacionAnexo: atachment.observation,
      esAbogado: false,
      codigoCal: null,
      despacho: itemDespacho,
      fiscalia: itemFiscalia,
      distritoFiscal: itemDistritoFiscal,
      anyoRegistro: anio,
      dependencia: dependencia,
      medidasProteccion: false,
      numeroCaso: numCase,
      numeroInformePolicial: null,
      colegioAbogado: null,
      numeroDocumento: null,
      archivo: [anexo]
    };

    let documentoCargo: DocumentoCargo = {
      documento: documentoEnvio,
      folios: atachment.attachedFiles[0].paginas,
      profile: getProfile(this.tmpProfile),
      especialidad: searchCase.especialidad,
      sumilla: atachment.attachedInformation,
      remitente: this.completeName,
      tipoDocumento: atachment.documentType.descripcion

    }
    this.mesaService.registerDocumento(document.id, documentoCargo).subscribe({
      next: resp => {
        this.documentSave = resp.data
        this.tracingService.saveCargo(resp.data);
      }, error: (error) => {

      }
    })
    this.getPDFRegister();
  }
  /**
   * es proceso de registro de documentos?
   * si no es, es documento de seguimiento generado
   */
  get areRegisteredDocuments(): boolean {
    return this.router.url.includes('documentos-registrados')
  }

  get title(): string {
    return (
      this.areRegisteredDocuments
        ? 'Documentos registrados'
        : 'Documento de seguimiento generado'
    )
  }
  get timeMessage(): string {
    this.itemCurrentCase = JSON.parse(sessionStorage.getItem('currentCase'));
    /*   return (
         this.areRegisteredDocuments
         ? `Por tu seguridad, tienes ${{ remainingTime | date: 'mm:ss' }} min para visualizar el cargo, luego regresaremos a la pantalla principal.`
         : `Por tu seguridad, tienes {{ remainingTime | date: 'mm:ss' }} min para visualizar el cargo, luego regresaremos a la pantalla principal.`

       )*/
    return (
      `Por tu seguridad, tienes min para visualizar el cargo, luego regresaremos a la pantalla principal.`
    )
  }

  get successMessage(): string {
    this.itemCurrentCase = JSON.parse(sessionStorage.getItem('currentCase'));
    return (
      this.areRegisteredDocuments
        ? `Los documentos se han registrado satisfactoriamente al Nro. de caso ${this.itemCurrentCase.codigoCaso}.`
        : `El documento seguimiento del Nro. de caso ${this.itemCurrentCase.codigoCaso} se generó satisfactoriamente.`

    )
  }

  get mainMessage(): string {
    return (
      this.areRegisteredDocuments

        ? `El cargo de ingreso de documento que se presenta será enviado al correo ${this.email}, y también puedes descargarlo aquí: `
        : `El documento de seguimiento del caso que se presenta será enviado al correo ${this.email}, y también puedes descargarlo aquí: `

    )
  }

  get downloadBtnTxt(): string {
    return (
      this.areRegisteredDocuments
        ? 'Descargar cargo'
        : 'Descargar seguimiento'
    )
  }

  get buttonTxt(): { confirm: string, cancel: string } {
    return (
      this.areRegisteredDocuments
        ? { confirm: 'Finalizar y volver al inicio', cancel: 'Anexar otros documentos' }
        : { confirm: 'Finalizar y volver al inicio', cancel: 'Consultar otro caso' }
    )
  }

  get caseFound() {
    return this.itemCurrentCase;
  }

  get isGeneratedDocument() {
    return this.router.url.includes('documento-generado')
  }

  public payloadBody() {
    const parseGuion = (texto: string) => {
      return texto || '-';
    }

    return {
      nroCaso: this.caseFound.codigoCaso,
      distritoFiscal: parseGuion(this.caseFound.distritoFiscalAnterior),
      especialidad: parseGuion(this.caseFound.especialidadAnterior),
      fiscaliaOrigen: parseGuion(this.caseFound.fiscaliaAnterior),
      despacho: parseGuion(this.caseFound.despachoAnterior),
      motivoIngreso: parseGuion(this.caseFound.tipoOrigen),
      fechaIngreso: this.formatDateString(this.caseFound.fechaCreacionDenuncia),
      delitosDenuncia: parseGuion(this.caseFound.delitosDenuncia),
      distritoFiscalActual: parseGuion(this.caseFound.distritoFiscal),
      especialidadActual: parseGuion(this.caseFound.especialidad),
      fiscaliaActual: parseGuion(this.caseFound.fiscalia),
      direccion: parseGuion(this.caseFound.residenciaFiscal),
      despachoActual: parseGuion(this.caseFound.despacho),
      etapaActual: parseGuion(this.caseFound.etapa),
      actoProcesalActual: parseGuion(this.caseFound.actoProcesal),
      ultimoTramite: parseGuion(this.caseFound.tramite),
      fechaTramite: parseGuion(this.formatDateString(this.caseFound.fechaUltimaAsignacion)),
      delitosCaso: parseGuion(this.caseFound.delitosSujeto)
    }
  }

  public getUrl(dataB64: string) {
    const data = dataB64;

    if (data != null) {
      const base64str = data;
      const binary = atob(base64str.replace(/\s/g, ''));
      const len = binary.length;
      const buffer = new ArrayBuffer(len);
      const bytes = new Uint8Array(buffer);

      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      const file = new Blob([bytes], { type: 'application/pdf' });
      this.pdfURL = URL.createObjectURL(file);
      this.startCountDown()
    }
  }

  public getUrl2(dataB64: string) {
    const data = dataB64;

    if (data != null) {
      this.loading = false;
      this.pdfURL = `data:application/pdf;base64,${data}`;
      this.startCountDown()
    }
  }

  public getPDFPreview(): void {
    this.loading = true

    this.tracingService.getPreview(this.payloadBody(), SLUG_PROFILE.CITIZEN).subscribe({
      next: res => {
        this.getUrl2(String(res));
        this.loading = false
      },
      error: error => {
        this.getUrl2(String(error.error.text))
        this.loading = false
      }
    })
  }

  public getPDFRegister(): void {
    let cargos = JSON.parse(sessionStorage.getItem('cargo'));
    this.getUrl(cargos);
    this.loading = false;
  }

  public formatDate(date: string): string {
    if (!date) return '-'
    return formatDate(new Date(date))
  }

  public formatDateString(date: string): string {
    if (!date) return '-'
    return formatDateString(date)
  }

  toCancel() {
    // if(this.router.url.includes('documento-generado'))
    this.router.navigate(['/seguir-denuncia/consultar-caso'])
  }

  toConfirm() {
    // if(this.router.url.includes('documento-generado'))
    this.refModal = this.dialogService.open(ConfirmToCancelComplaintModal, {
      showHeader: false,
      contentStyle: { 'max-width': '600px', 'padding': '0' },
      data: { name: '' }
    })
  }

  downloadPDF() {
    let name = '';

    if (this.router.url.includes('documento-generado')) {
      name = `SEGUIMIENTO DEL CASO ${this.itemCurrentCase?.codigoCaso ?? ''}`;
    } else {
      name = `CARGO DE INGRESO DE DOCUMENTO - ${this.documentName}`;
    }

    const link = document.createElement('a');
    link.href = this.pdfURL;
    link.setAttribute("download", `${name}.pdf`);
    document.body.appendChild(link);
    link.click();
  }

  /********************/
  /*  GET FIRST NAME  */
  /********************/

  public getFirstName(fullname: string): string {
    const names = fullname.split(' ')
    return names.length > 0 ? names[0] : ''
  }

  /***************/
  /*  COUNTDOWN  */
  /***************/

  private startCountDown() {
    // Get remaining time
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + VIEW_GENERATED_COMPLAINT_MINUTES);

    this.calculateDifferencia(expirationDate)

    // Start countdown
    this.countdownInterval = setInterval(() => {
      this.calculateDifferencia(expirationDate)

      if (this.remainingTime <= 0) {
        this.remainingTime = 0;
        this.redirect(true)
      }
    }, 1000);
  }

  private calculateDifferencia(expirationDate: Date) {
    const currentTime = new Date().getTime();

    let difference = expirationDate.getTime() - currentTime;
    this.remainingTime = difference;
  }

  public getProfileType(profile: ProfileType): string {
    let type: string = ''

    switch (profile) {
      case SLUG_PROFILE.CITIZEN: type = 'MPE-CIUDADANO'; break;
      case SLUG_PROFILE.PNP: type = 'MPE-POLICÍA NACIONAL'; break;
      case SLUG_PROFILE.PJ: type = 'MPE-PODER JUDICIAL'; break;
      default: type = 'MPE-ENTIDAD'; break;
    }

    return type
  }

  public getEntityName(entity: Entidad): string {
    if (entity.idTipoEntidad === SLUG_ENTITY.JURIDICA) 
      return entity.razonSocial;

    return entity.nombreEntidad;
  }

  /**************/
  /*  REDIRECT  */
  /**************/
  public redirect(toHome: boolean = false) {
    localStorage.clear()

    if (toHome) {
      this.countdownInterval && clearInterval(this.countdownInterval)
      this.router.navigate(['/'])
    }
  }
}