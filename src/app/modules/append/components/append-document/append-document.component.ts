import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

//primeng
import { MessagesModule } from 'primeng/messages';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextareaModule } from 'primeng/inputtextarea';

//mpfn
//utils
import { CmpLibModule, ctrlErrorMsg, onlyNumbers } from 'ngx-mpfn-dev-cmp-lib';
import { Router } from '@angular/router';
import { formatDate, formatDateString, noQuotes } from '@shared/utils/utils';

import { ENDPOINTS_MICROSERVICES, LOCALSTORAGE } from '@environments/environment';

import { AppendService } from '@modules/append/append.service';
import { StepsModule } from 'primeng/steps';
import { TokenService } from '@shared/services/auth/token.service';
import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { CryptService } from '@shared/services/global/crypt.service';
import { IdentificacionDocumento } from '@shared/interfaces/documento/identificacion-documento';
import { MaestrosService } from '@shared/services/shared/maestros.service';
import { ProfileType } from '@shared/helpers/dataType';
import { SLUG_PROFILE, SLUG_TYPE_TRAMITE } from '@shared/helpers/slugs';
import { RadioButtonModule } from 'primeng/radiobutton';
import { PDFDocument } from 'pdf-lib';
import { DocumentVerificationModal } from '../completed-process/document-verification-modal.component';

import { Subscription } from 'rxjs';
import { StorageService } from '@shared/services/storage.service';
import { ValidarInputDirective } from '@core/directives/validar-input.directive';
import { FileUploadComponent } from "@shared/components/file-upload/file-upload.component";

//OLA
const { VALIDATE_KEY } = LOCALSTORAGE;

@Component({
  selector: 'app-append-document',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MessagesModule,
    ButtonModule,
    RadioButtonModule,
    DividerModule,
    DropdownModule,
    StepsModule,
    InputTextareaModule,
    DynamicDialogModule,
    CmpLibModule,
    ValidarInputDirective,
    FileUploadComponent
  ],
  templateUrl: './append-document.component.html',
  providers: [DialogService],
})
export class AppendDocumentComponent implements OnInit {
  flagContarPaginas: boolean = false;
  private sumaTotalFolios: number = 0;
  public codigoCaso: string;
  public idCaso: string;
  public validLength: boolean = false;
  public documentoObservado: any;
  public anexoCount: any = 0;

  public observationsCount: any = 0;
  isEditable: boolean = false;
  deleteURL: string = `${ENDPOINTS_MICROSERVICES.MS_REPOSITORIO}`
  url: string = `${ENDPOINTS_MICROSERVICES.MS_REPOSITORIO}cargar-comprimido`
  public files = [];
  public filesInvestigacion = [];
  tipoTramite: any = [];
  public suscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.clearDocumentForm();
    this.cancelAttachments();
    this.getDocumentType();
    this.getTipoTramite();

    // Intentamos obtener los archivos del token primero
    this.files = this.validaToken.files ?? [];
    this.filesInvestigacion = this.validaToken.filesInvestigacion ?? [];

    // Si no hay archivos en el token, intentamos obtenerlos del servicio
    if (!this.filesInvestigacion?.length) {
      this.filesInvestigacion = this.appendService.filesInvestigacion ?? [];
    }

    if (this.files?.length) {
      this.selectedForm.patchValue({
        ...this.appendService.selectedAttachmentForm,
      });
      this.attachmentsForm.patchValue({
        ...this.appendService.currentAttchmentForm,
      });
      this.numberDocumentForm.patchValue({
        ...this.appendService.numberDocumentForm,
      });
    }
  }

  public numberDocumentForm: FormGroup;
  public messages = [
    {
      severity: 'warn',
      detail: 'Adjuntar documento.',
    },
  ];

  public protectionOptions = [
    { label: 'Sí', value: true },
    { label: 'no', value: false },
  ];

  /*public optionsTramite = [
    { label: 'Nuevo documento', value: 1 },
    { label: 'Subsanar observaciones', value: 2 },
  ];
*/
  isObservedDocument = false;
  public attachDocuments = false;
  public noQuotes = noQuotes;


  public searchDocument = {
    data: null,
    loading: false,
  };

  public searchCaseNumber: any
  public searchCase = {
    data: null,
    loading: false,
  };

  public identificacionDocumento = {
    id: null,
    token: null,
  };

  public tmpProfile: ProfileType = SLUG_PROFILE.CITIZEN;
  public searchCaseError: boolean = false;

  public attachmentsForm: FormGroup;
  public selectedForm: FormGroup;
  public attachfile: any = [];

  public documentTypes = [];
  public previousFilesPrincipal = [];
  public previousFilesInvestigacion = [];
  sumTotalBytesFiles: number = 0

  public refModal: DynamicDialogRef;
  identificar: IdentificacionDocumento;
  validaToken: any;
  profileType: any;
  public showProtection;

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly appendService: AppendService,
    private readonly maestrosService: MaestrosService,
    private readonly tokenService: TokenService,
    private readonly dialogService: DialogService,
    private readonly storageService: StorageService,
    private readonly cryptService: CryptService
  ) {
    if (localStorage.getItem(LOCALSTORAGE.VALIDATE_KEY)) {
      let valida = localStorage.getItem(LOCALSTORAGE.VALIDATE_KEY);
      this.validaToken = JSON.parse(this.cryptService.decrypt(valida));

    }
    if (!this.validaToken.case || this.validaToken.case === undefined) {
      return
    }
    this.codigoCaso = this.validaToken.case.codigoCaso;
    this.idCaso = this.validaToken.case.idCaso;
    this.isObservedDocument = this.validaToken.subsana;

    window.scrollTo({ top: 0, behavior: 'smooth' });

    const profile = this.tokenService.getItemValidateToken('typeProfile');
    if (profile !== '') this.tmpProfile = profile as ProfileType;

    if (this.tmpProfile === SLUG_PROFILE.PJ) {

      this.showProtection = true;
    } else {
      this.showProtection = false;
    }
    this.selectedForm = fb.group({
      optionTramite: [
        this.appendService.selectedAttachmentForm.optionTramite,
        [Validators.required],
      ],
      documentType: [
        this.appendService.selectedAttachmentForm.documentType,
        [Validators.required],
      ],
      isProtection: [
        this.appendService.selectedAttachmentForm.isProtection ?? false,
      ],
      showCodigoDocumento: [
        this.appendService.selectedAttachmentForm.showCodigoDocumento ?? 'S/N',
      ],
    });
    this.attachmentsForm = fb.group({
      attachedInformation: [
        this.appendService.currentAttchmentForm.attachedInformation,
        [Validators.required,
        Validators.minLength(100),
        Validators.maxLength(1000)],
      ],
      /* attachedFiles: [
         this.appendService.currentAttchmentForm.attachedFiles,
       ],*/
      attachedObservation: [
        this.appendService.currentAttchmentForm.attachedObservation,
        [Validators.maxLength(1000)],
      ],
      txtNumeroPag: [
        this.appendService.currentAttchmentForm.txtNumeroPag,
      ],
    });

    this.numberDocumentForm = fb.group({
      prefix: [this.appendService.numberDocumentForm.prefix ?? 'D'],
      number: [
        this.appendService.numberDocumentForm.number ?? '',
        [Validators.required],
      ],
      counter: [
        this.appendService.numberDocumentForm.counter ?? '',
        [Validators.required, Validators.pattern(onlyNumbers)],
      ],
    });
  }

  get documentNumber(): string {

    const { number, counter } = this.numberDocumentForm.value;
    let numberCorrect = number.replaceAll('-', "");
    return `D-${numberCorrect}-${counter}`;
  }
  get validAttachmentForm() {

    if (this.isObservedDocument) {
      return (
        this.attachmentsForm.valid &&
        this.selectedForm.valid &&
        this.files?.length > 0
      );
    }
    return (
      this.attachmentsForm.valid &&
      this.files?.length > 0

    );

  }

  errorMsg(ctrlName) {
    return ctrlErrorMsg(this.attachmentsForm.get(ctrlName));
  }

  get SummaryWordsCounter(): number {

    return this.attachmentsForm.get('attachedInformation').value?.trim()
      .length !== 0
      ? this.attachmentsForm
      .value?.length
      .get('attachedInformation')
      : 0;
  }

  get ObservationWordsCounter(): number {

    return this.attachmentsForm.get('attachedObservation').value?.trim()
      .length !== 0
      ? this.attachmentsForm
        .get('attachedObservation')
        .value?.length
      : 0;
  }
  completarCeros(event: any) {
    let numero = parseInt(this.numberDocumentForm.get('counter')?.value)

    this.numberDocumentForm?.patchValue({
      counter: numero ? numero.toString().padStart(5, '0') : ''
    })

  }
  completarSN(event: any) {
    if (this.selectedForm.get('showCodigoDocumento')?.value?.length <= 0) {
      this.selectedForm.get('showCodigoDocumento').setValue('S/N')
    }
  }

  public anexoWordCount(): void {
    let field = this.attachmentsForm.get('attachedInformation').value;
    this.anexoCount = field?.length;

  }

  public observationsWordCount(): void {
    let field = this.attachmentsForm.get('attachedObservation').value;
    this.observationsCount = field?.length;

  }

  public cancelAttachments(): void {
    this.attachDocuments = false;
    this.attachmentsForm?.get('attachedInformation').setValue('');
    this.attachmentsForm?.get('attachedObservation').setValue('');
    this.files = [];
    this.filesInvestigacion = [];
    // No limpiamos el storage aquí para mantener la persistencia
  }

  public nextStep(): void {
    if (this.isObservedDocument) {
      let body = {
        idCaso: this.idCaso,
        codigoDocumento: this.documentNumber
      }

      this.appendService.validarDocumentoObservado(body).subscribe({
        next: (resp) => {
          this.documentoObservado = resp;
          this.nextPreviewStep();
        },
        error: (error) => {

          if (error.error.code == '42202039') {
            this.refModal = this.dialogService.open(DocumentVerificationModal, {
              showHeader: false,
              contentStyle: { 'max-width': '670px', padding: '0px' },
              data: { name: '' },
            });
          } else {
            //this.messageService.add({ severity: 'error', closable : true, detail: "Error de conexión durante el proceso"})
          }
        },
      });
    } else {
      this.nextPreviewStep();
    }
  }

  public nextPreviewStep(): void {
    this.appendService.saveAttachmentForm(this.attachmentsForm.value);
    this.appendService.saveSelectedAttachmentForm(this.selectedForm.value);
    this.appendService.saveNumberDocumentForm(this.numberDocumentForm.value);
    this.appendService.saveFilesInvestigacion(this.filesInvestigacion);

    let valida = localStorage.getItem(LOCALSTORAGE.VALIDATE_KEY);
    this.validaToken = JSON.parse(this.cryptService.decrypt(valida));
    let newValidateToken = {
      ...this.validaToken,
      subsana: this.isObservedDocument,
      numeroFolios: this.files[0]?.numeroFolios ?? 0,
      documentoObservado: this.documentoObservado,
      files: this.files,
      filesInvestigacion: this.filesInvestigacion,
      registrado: false,
    };
    this.tokenService.saveItem(VALIDATE_KEY, JSON.stringify(newValidateToken));

    setTimeout(() => {
      this.appendService.saveAttachmentForm(this.attachmentsForm.value);
      this.attachmentsForm.reset();
      this.selectedForm.reset();
      this.router.navigate(['presentar-documento/confirmacion']);
    }, 1000);
  }

  getTipoTramite(): void {
    this.suscriptions.push(
      this.maestrosService.getCatalogo('ID_N_TIPO_TRAMITE_DOCUMENTO').subscribe({
        next: resp => {
          this.tipoTramite = resp.data
        },
        error: (error) => {
          this.tipoTramite = []
        }
      })
    )
  }

  readFile(file: any) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  }

  async getPagesPdf(file: any) {
    let tipo = file.type;
    if (tipo !== 'application/pdf') return 0;
    const arrayBuffer: any = await this.readFile(file);
    const pdf = await PDFDocument.load(arrayBuffer);
    return pdf.getPages().length;
  }

  async contarPaginasArchivo(file: any) {
    this.sumaTotalFolios = 0;
    let pages = 0;
    await this.getPagesPdf(file)
      .then((res_id: any) => {
        pages = res_id;
      })
      .catch((err) => { });
    this.sumaTotalFolios = this.sumaTotalFolios + pages;
    this.attachmentsForm.get('txtNumeroPag').setValue(this.sumaTotalFolios);
  }

  public formatDate(date: string): string {
    if (!date) return '-';
    return formatDate(new Date(date));
  }

  public formatDateString(date: string): string {
    if (!date) return '-';
    return formatDateString(date);
  }

  public selectTipoTramite(value: number): void {
    if (SLUG_TYPE_TRAMITE.OBSERVED === value) {
      this.isObservedDocument = true;
      this.numberDocumentForm.get('number').setValue(this.codigoCaso);
    } else {
      this.isObservedDocument = false;
    }
  }

  /****************/
  /*  CASE DOCUMENT TYPES  */
  /****************/

  public getDocumentType(): void {
    this.maestrosService.getCaseDocumentTypes().subscribe({
      next: (resp) => {
        if (resp && resp.code === 200) {
          this.documentTypes = resp.data;
        }
      },
    });
  }

  removeDataDocument(): void {
    let valida = localStorage.getItem(LOCALSTORAGE.VALIDATE_KEY);
    this.validaToken = JSON.parse(this.cryptService.decrypt(valida));
    let newValidateToken = {
      ...this.validaToken,
      codigoDocumentoEscritoPadre: null,
      files: null,
      numeroFolios: null,
      subsana: null,
      registrado: false,
      filesInvestigacion: null
    };

    this.tokenService.saveItem(VALIDATE_KEY, JSON.stringify(newValidateToken));
    this.appendService.clearDocumentStorage();
  }

  regresarAppend() {
    this.removeDataDocument();
    this.appendService.clearAllStorage();
    this.router.navigate(['presentar-documento/datos-personales']);
  }

  clearDocumentForm() {
    this.searchCase.data = null;
    this.selectedForm?.reset();
    this.attachmentsForm?.reset();
    this.numberDocumentForm?.reset();
    this.attachmentsForm?.get('attachedInformation')?.setValue('');
    this.attachmentsForm?.get('attachedObservation')?.setValue('');
  }

  /**
   * Maneja el cambio en los archivos desde el componente de carga
   */
  onFilesChangedPrincipal(newFiles: any[]): void {
    this.files = newFiles;
    this.previousFilesPrincipal = [...newFiles];
  }

  onFilesChangedInvestigacion(newFiles: any[]): void {
    this.filesInvestigacion = newFiles;
    this.previousFilesInvestigacion = [...newFiles];
    this.appendService.saveFilesInvestigacion(newFiles);
  }
}
