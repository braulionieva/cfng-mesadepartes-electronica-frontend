import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, Validators, FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
//primeng
import { MessagesModule } from "primeng/messages";
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from "primeng/button";
import { RadioButtonModule } from 'primeng/radiobutton';
import { DropdownModule } from 'primeng/dropdown';
import { AutoCompleteModule } from 'primeng/autocomplete';

//mpfn
import { CmpLibModule, validNames, ctrlErrorMsg } from "ngx-mpfn-dev-cmp-lib";
import {
  iUser,
  iTrashCan
} from "ngx-mpfn-dev-icojs-regular";
//interfaces
import { FnIcon } from 'ngx-mpfn-dev-cmp-lib/lib/shared/interfaces/fn-icon';
//slugs
import { SLUG_ENTITY, SLUG_DOCUMENT_TYPE } from "@shared/helpers/slugs";
import { Subscription, lastValueFrom } from 'rxjs';
import { MaestrosService } from '@shared/services/shared/maestros.service';
import { ValidationService } from '@shared/services/shared/validation.service';
import { MessageService } from 'primeng/api';
import { SLUG_OTHER } from '../../../../shared/helpers/slugs';
import { ValidationSunat } from '@shared/interfaces/validation/ValidationSunat';
import { Prefills } from '@modules/complaint/interfaces/EntityInvolved';
import { PDFDocument } from 'pdf-lib'
import { noQuotes } from '@shared/utils/utils';
import { ToastModule } from 'primeng/toast';
import { CryptService } from '@shared/services/global/crypt.service';
import { ENDPOINTS_MICROSERVICES, LOCALSTORAGE } from '@environments/environment';
import { ValidarInputDirective } from '@core/directives/validar-input.directive';
import { Entidad } from '@shared/interfaces/complaint/complaint-registration';
import { FileUploadComponent } from '@shared/components/file-upload/file-upload.component';
import { Helpers, IValidacionDocumento } from '@shared/helpers/helpers';
import { ComplaintPayloadBuilderService } from "@modules/complaint/services/complaint-payload-builder.service";
const { DENUNCIA_KEY } = LOCALSTORAGE;
interface AutoCompleteCompleteEvent {
  originalEvent: Event;
  query: string;
}

@Component({
  selector: 'complaint-entity-data',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, RadioButtonModule, ButtonModule, DropdownModule, CmpLibModule,
    DividerModule, AutoCompleteModule, MessagesModule, ToastModule, ValidarInputDirective, FileUploadComponent
  ],
  providers: [MessageService,
  ],
  templateUrl: './entity-data.component.html',
  styleUrls: ['./entity-data.component.scss'],
})

export class EntityDataComponent implements OnInit, OnDestroy {

  @Input() recoveredData: Entidad | null = null
  @Output() formChanged = new EventEmitter<Object>();
  @Input() public documentTypes = []
  public documentTypesRepresentation = [];
  @Input() sumTotalBytesFiles: number = 0;

  deleteURL: string = `${ENDPOINTS_MICROSERVICES.MS_REPOSITORIO}`
  url: string = `${ENDPOINTS_MICROSERVICES.MS_REPOSITORIO}cargar-comprimido`

  /****************/
  /*  CONSTANTES  */
  /****************/

  protected tipoOrigenArr = [
    { id: 'PER', value: 'Peruano' },
    { id: 'EXT', value: 'Extranjero' }
  ];

  private readonly docsPersonaID = {
    peruano: [1, 7, 8, 11], //3,
    extranjero: [4, 5, 6, 13, 14] //16
  };

  /***************/
  /*  VARIABLES  */
  /***************/

  public iUser: FnIcon = iUser as FnIcon
  public iTrashCan: FnIcon = iTrashCan as FnIcon
  public files = []
  public previousFiles = []
  public entidades: Entidad[] = [];

  public searchingRuc: boolean = false
  public rucFounded: boolean = false
  public disableRuc: boolean = true;


  public newEntidad: boolean = true
  public tmpEntidad: Entidad;

  private amountAnexo: number = 0;
  private sumaTotalFolios: number = 0;

  //util
  public noQuotes = noQuotes
  public validaToken
  public denunciaToken
  public suscriptions: Subscription[] = []


  public loadingData: boolean = false


  //autocomplete
  formGroup: FormGroup | undefined;
  suggestions: any[] | undefined;

  /**********/
  /*  FORM  */
  /**********/

  public form: FormGroup = new FormGroup({})

  public paisArrOriginal: any[] = [];
  public paisArrActual: any[] = [];
  private readonly PERU_ID = 102;

  public documentTypesOriginal: any[] = [];

  protected validacionDocumento: IValidacionDocumento = { id: 15, min: 0, max: 0, tipo: '' };

  private isRecoveredFromStorage: boolean = false;

  /*****************/
  /*  CONSTRUCTOR  */
  /*****************/

  constructor(
    private readonly fb: FormBuilder,
    private readonly maestrosService: MaestrosService,
    private readonly validationService: ValidationService,
    private readonly messageService: MessageService,
    private readonly cryptService: CryptService,
    private readonly payloadBuilder: ComplaintPayloadBuilderService,
  ) { }


  /****************/
  /*  LIFE CYCLE  */
  /****************/

  ngOnInit(): void {
    this.buildForm()
    let valida = localStorage.getItem(LOCALSTORAGE.VALIDATE_KEY);
    this.validaToken = JSON.parse(this.cryptService.decrypt(valida));
    this.form.get('procuradorDatos').setValue("DNI: " + this.validaToken?.validateIdentity.numeroDni + " - " + this.validaToken?.personaNatural.nombres + " " + this.validaToken?.personaNatural.apellidoPaterno + " " + this.validaToken?.personaNatural.apellidoMaterno);

    let denuncia = localStorage.getItem(LOCALSTORAGE.DENUNCIA_KEY);
    if (denuncia) {
      this.isRecoveredFromStorage = true;
      this.denunciaToken = JSON.parse(this.cryptService.decrypt(denuncia));
      this.form.get('docRepresentacionTipo').setValue(this.denunciaToken.entidad.archivoPerfil.docRepresentacionTipo);
      this.form.get('docRepresentacionNumero').setValue(this.denunciaToken.entidad.archivoPerfil.docRepresentacionNumero);
      if (this.denunciaToken.entidad !== undefined && this.denunciaToken.entidad.archivoPerfil !== undefined && this.denunciaToken.entidad.archivoPerfil.anexos !== undefined) {
        this.files = this.denunciaToken.entidad.archivoPerfil.anexos;
        this.previousFiles = this.denunciaToken.entidad.archivoPerfil.anexos;
        this.saveInfo();
      }
    }

    this.getDocumentTypes()
    this.getDocumentRepresentationType()
    this.getNationalities();
  }

  ngDoCheck() {
    if (this.files.length !== this.previousFiles.length && !this.loadingData) {
      this.previousFiles = [...this.files]
      this.saveInfo(true)
    }
  }
  ngOnDestroy(): void {
    this.suscriptions.forEach(s => s.unsubscribe());
  }


  onFilesChanged(newFiles: any[]): void {
    this.files = newFiles;
    this.previousFiles = [...newFiles];
    this.saveInfo(true);
  }


  /**********/
  /*  FORM  */
  /**********/

  private buildForm(): void {
    if (this.hasDenuncia()) {
      this.setupFormWithDenuncia();
    } else {
      this.setupEmptyForm();
    }
  }

  private hasDenuncia(): boolean {
    return !!localStorage.getItem(DENUNCIA_KEY);
  }

  private setupFormWithDenuncia(): void {
    const raw = localStorage.getItem(DENUNCIA_KEY);
    this.validaToken = JSON.parse(this.cryptService.decrypt(raw));
    // Definición común de controles:
    const controls = this.commonControls({
      ruc: this.validaToken.entidad?.ruc,
      businessName: this.validaToken.entidad?.razonSocial,
      documentType: this.validaToken.entidad.procurador?.documentType,
      procuratorDNI: this.validaToken.entidad.procurador?.dni,
      procuratorName: this.validaToken.entidad.procurador?.nombre,
      procuradorApellidoPaterno: this.validaToken.entidad.procurador?.apellidoPaterno,
      procuradorApellidoMaterno: this.validaToken.entidad.procurador?.apellidoMaterno,
    });

    this.form = this.fb.group(controls);
    this.crearEntidad();
    this.saveInfo();
  }

  private setupEmptyForm(): void {
    // Mismos controles, pero sin valor inicial
    this.form = this.fb.group(this.commonControls());
  }

  /**
   * Devuelve la configuración de todos los FormControl,
   * aceptando valores por defecto si se pasan en `prefills`.
   */
  private commonControls(prefills: Prefills = {}) {
    return {
      ruc: [prefills.ruc ?? '', [Validators.required]],
      businessName: [prefills.businessName ?? '', [Validators.required]],
      documentType: [prefills.documentType ?? null, [Validators.required]],
      procuratorDNI: [prefills.procuratorDNI ?? ''],
      procuratorName: [prefills.procuratorName ?? '', [Validators.required, Validators.pattern(validNames)]],
      procuradorApellidoPaterno: [prefills.procuradorApellidoPaterno ?? '', [Validators.required, Validators.pattern(validNames)]],
      procuradorApellidoMaterno: [prefills.procuradorApellidoMaterno ?? ''],
      procuradorDatos: [''],
      docRepresentacionTipo: ['', [Validators.required]],
      docRepresentacionNumero: ['', [Validators.required]],
      origen: ['PER'],
      pais: [{ value: this.PERU_ID, disabled: true }, [Validators.required]]
    };
  }


  get validForm(): boolean {
    if (this.entidades.length === 0) {
      return false;
    }

    if (this.isRecoveredFromStorage && this.entidades[0].ruc) {
      return true;
    }

    const hasValidEntity = this.entidades.length > 0 && this.entidades[0].ruc;
    const hasValidForm = this.form.get('procuratorName').valid
      && this.form.get('procuradorApellidoPaterno').valid
      && this.form.get('ruc').valid
      && this.form.get('businessName').valid
      && this.form.get('documentType').valid
      && this.sumTotalBytesFiles > 0;

    return hasValidEntity && hasValidForm;
  }

  get disabledBtn(): boolean {
    return !this.validForm
  }

  // Nueva validación específica para el botón agregar
  get canAddEntity(): boolean {
    if (!this.newEntidad) {
      return false;
    }

    const hasValidRuc = this.form.get('ruc').valid && this.rucFounded;
    const hasValidBusinessName = this.form.get('businessName').valid;
    const hasValidProcurator = this.form.get('procuratorName').valid
      && this.form.get('procuradorApellidoPaterno').valid;
    const hasValidDocument = this.form.get('documentType').valid;
    const hasValidRepresentationDoc = this.form.get('docRepresentacionTipo').valid
      && this.form.get('docRepresentacionNumero').valid;
    const hasValidFile = this.sumTotalBytesFiles > 0;

    return hasValidRuc
      && hasValidBusinessName
      && hasValidProcurator
      && hasValidDocument
      && hasValidRepresentationDoc
      && hasValidFile;
  }

  /*****************/
  /*  GET METHODS  */
  /*****************/
  public getDocumentRepresentationType(): void {
    this.maestrosService.getCaseDocumentTypes().subscribe({
      next: (resp) => {
        if (resp && resp.code === 200) {
          // Carta → "14" - Escrito → "21" - Expediente → "20" - Informe → "23" - Resolución → "16"
          const codigosFiltrar = ['16', '14', '20', '21', '23'];

          const resultadoFiltrado = resp.data.filter((item) =>
            codigosFiltrar.includes(item.codigo)
          );

          this.documentTypesRepresentation = resultadoFiltrado;
        }
      },
    });
  }

  public getDocumentTypes(): void {
    const origen = this.form?.get('origen')?.value;
    const origenID = origen == 'EXT' ? 1 : 0;

    this.maestrosService.getDocumentTypes(origenID).subscribe({
      next: resp => {
        if (resp && resp.code === 200) {
          this.documentTypesOriginal = resp.data.map(
            (d) => ({ id: d.id, nombre: d.nombre.toUpperCase() }));

          const origen = this.form?.get('origen').value;
          const docsID = (origen === 'EXT') ? this.docsPersonaID.extranjero : this.docsPersonaID.peruano;

          this.documentTypes = this.documentTypesOriginal
            .filter(document => docsID.includes(document.id));
        }
      }
    })
  }

  get isProcuratorOffice(): boolean {
    return SLUG_ENTITY.PROCURADURIA === this.form.controls['entityType'].value
  }

  get isCEM(): boolean {
    return SLUG_ENTITY.CEM === this.form.controls['entityType'].value
  }

  get otherProcuradoria(): boolean {
    return this.isProcuratorOffice && this.form.get('procuratorOffice').value === SLUG_OTHER.PROCURADURIA
  }

  get otherCem(): boolean {
    return this.isCEM && this.form.get('cem').value === SLUG_OTHER.CEM
  }

  /***********************/
  /* SEARCH RAZON SOCIAL */
  /***********************/
  searchPadronSunat(event: AutoCompleteCompleteEvent) {
    this.getPadronSunat(event.query)
  }

  public async getPadronSunat(nombreEmpresa: string): Promise<void> {
    let request: ValidationSunat = {
      razonSocial: nombreEmpresa
    };
    try {
      const body = Object.fromEntries(
        Object.entries(request).filter(([_, valor]) => valor !== null)
      ) as ValidationSunat;

      this.suggestions = await lastValueFrom(this.validationService.getPadronSunatPorRazon(body));
    } catch (error) {
      console.error(error);
    }
  }

  /********************/
  /*    SEARCH RUC    */
  /********************/

  public searchRUC(): void {
    this.searchingRuc = true;
    this.rucFounded = false;

    this.suscriptions.push(
      this.validationService.getPadronSunatPorRuc(this.form.get('ruc').value).subscribe({
        next: resp => {
          this.searchingRuc = false;
          if (resp) {
            this.rucFounded = true;
            this.form.get('businessName').setValue(resp[0].razonSocial);
          } else {
            this.searchingRuc = false;
            this.messageService.add({
              severity: 'warn',
              detail: 'No se encontró la razón social para el RUC ingresado.'
            });
          }
        },
        error: (error) => {
          this.searchingRuc = false;
          // RUC no existe - HTTP 422
          if (error.status === 422 && error.error?.code === '42202009') {
            this.messageService.add({
              severity: 'warn',
              detail: 'El Nº de RUC ingresado NO existe'
            });
          }
          // Servicio no disponible
          else if ([0, 404, 500, 502, 503, 504].includes(error.status)) {
            this.messageService.add({
              severity: 'error',
              summary: 'Servicio no disponible',
              detail: 'El servicio del SUNAT no se encuentra disponible en este momento. Por favor inténtelo nuevamente más tarde o acérquese a una Mesa Única de Partes.',
              sticky: true
            });
          }
          // Otros errores
          else {
            this.messageService.add({
              severity: 'error',
              detail: 'Ocurrió un error al consultar el RUC. Por favor intente nuevamente.'
            });
          }
        }
      })
    );
  }

  public cleanSearch(): void {
    this.rucFounded = false;
    this.form.get('ruc').setValue('');
    this.form.get('ruc').markAsUntouched();
    this.form.get('businessName').setValue('');
    this.form.get('businessName').markAsUntouched();
  }

  public cleanProcurator(): void {
    this.form.get('procuratorDNI').setValue('')
    this.form.controls['procuratorDNI'].reset()
    this.form.get('procuratorName').setValue('')
    this.form.controls['procuratorName'].reset()
    this.form.get('procuradorApellidoPaterno').setValue('')
    this.form.controls['procuradorApellidoPaterno'].reset()
    this.form.get('procuradorApellidoMaterno').setValue('')
  }

  public cleanDocumentoRepresentacion(): void {
    this.form.get('docRepresentacionTipo').setValue('')
    this.form.controls['docRepresentacionTipo'].reset()
    this.form.get('docRepresentacionNumero').setValue('')
    this.form.controls['docRepresentacionNumero'].reset()
    this.files = []
  }

  /*************************/
  /*    DELETE ENTIDAD     */
  /*************************/

  public deleteEntidad(id: string): void {
    this.entidades = [];
    this.isRecoveredFromStorage = false;
    this.cancelEdition();
    this.form.reset({
      origen: 'PER',
      pais: { value: this.PERU_ID, disabled: true }
    });
    this.form.get('pais').disable();
    this.cleanSearch();
    this.cleanProcurator();
    this.cleanDocumentoRepresentacion();
    this.files = [];
    this.previousFiles = [];
    this.sumTotalBytesFiles = 0;
    this.formChanged.emit({ entidad: null });
  }

  /************************/
  /*    CANCEL EDITION    */
  /************************/

  public cancelEdition(): void {
    this.newEntidad = true
    this.tmpEntidad = undefined
  }

  /*************************/
  /*    CREAR ENTIDAD     */
  /*************************/

  public async crearEntidad(): Promise<void> {

    const data = this.form.getRawValue();

    this.entidades.push({
      idTipoEntidad: SLUG_ENTITY.JURIDICA,
      idProcuradoria: SLUG_ENTITY.JURIDICA,
      idCentroEmergencia: 0,
      ruc: data.ruc,
      nombreEntidad: '',
      razonSocial: data.businessName,
      representanteLegal: '',
      procurador: null,
      direccion: null,
      archivoPerfil: null,
      totalPaginas: 0,
    })

    this.tmpEntidad = undefined;
    this.newEntidad = false;

    this.saveInfo()
  }

  public getNames(entidad: Entidad): string {
    let name: string = ''
    name = entidad.razonSocial;
    return name;
  }

  /******************/
  /*    AUTOSAVE    */
  /******************/

  public onFormChange(newValues: Object): void {
    this.amountAnexo = 0;

    let anexo = this.entidades[0].archivoPerfil.anexos ? true : false;

    if (anexo) {
      this.entidades[0].archivoPerfil.anexos.forEach(anexo => {
        this.amountAnexo = this.amountAnexo + anexo.tamanyo;

      })
    }

    for (const anexo of this.entidades[0].archivoPerfil.anexos) {
      this.contarPaginasArchivo(anexo.file);
    }


    this.sumTotalBytesFiles = this.amountAnexo;

    if ('force' in newValues) {
      const newData = { ...this.entidades[0] }
      delete newData.force
      this.entidades[0] = { ...newData }
    }

    // Reiniciar el temporizador para esperar nuevamente el período de tiempo configurado
    //clearTimeout(this.timer);
  }

  async contarPaginasArchivo(file: any) {
    this.sumaTotalFolios = 0;
    let pages = 0;
    await this.getPagesPdf(file)
      .then((res_id: any) => {
        pages = res_id
      }).catch(err => { })

    this.sumaTotalFolios = this.sumaTotalFolios + pages;

    this.entidades[0].totalPaginas = this.sumaTotalFolios;
  }

  async getPagesPdf(file: any) {

    let tipo = file.type;

    if (tipo !== "application/pdf") return 0;

    const arrayBuffer: any = await this.readFile(file);
    const pdf = await PDFDocument.load(arrayBuffer);
    return pdf.getPages().length;

  }

  readFile(file: any) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
      reader.readAsArrayBuffer(file);
    });
  }


  /***************/
  /*  SAVE INFO  */
  /***************/

  public saveInfo(force: boolean = false): void {
    if (this.entidades.length > 0) {
      const data = this.form.getRawValue();
      const anexos = this.payloadBuilder.formatFiles(this.files);
      const entidad = this.payloadBuilder.buildEntidadPayload(data, anexos);

      const request: any = { entidad };
      if (force) {
        request.force = true;
      }

      this.formChanged.emit(request);
    }
  }

  /************/
  /*  OTHERS  */
  /************/

  public errorMsg(ctrlName) {
    return ctrlErrorMsg(this.form.get(ctrlName))
  }

  // Nuevo getter para verificar si el RUC es válido
  get isRucValid(): boolean {
    const rucControl = this.form.get('ruc');
    return rucControl && rucControl.valid && rucControl.value && rucControl.value.length === 11;
  }

  protected changeTipoOrigen(origen: string): void {
    const pais = this.form?.get('pais');

    this.paisArrActual = this.getSoloPeru();
    pais?.setValue(this.PERU_ID);
    pais?.disable();

    if (origen !== 'PER') {
      this.paisArrActual = this.getTodosMenosPeru();
      pais?.enable();
    }

    this.getDocumentTypes();
    this.form?.get('procuratorDNI').reset();
  }


  private getNationalities(): void {
    this.maestrosService.getNationalities().subscribe({
      next: resp => {
        this.paisArrOriginal = resp.data;
        this.setPaisPorDefecto();
      }
    });
  }

  private getSoloPeru(): any[] {
    return this.paisArrOriginal.filter(p => p.id == this.PERU_ID);
  }

  private getTodosMenosPeru(): any[] {
    return this.paisArrOriginal.filter(p => p.id !== this.PERU_ID);
  }

  private setPaisPorDefecto(): void {
    this.paisArrActual = this.getSoloPeru();

    const cbo = this.form?.get('pais');
    cbo?.setValue(this.PERU_ID);
    cbo?.disable();
  }

  get isNoDocument(): boolean {
    return this.form.get('documentType').value === SLUG_DOCUMENT_TYPE.SIN_DOCUMENTO;
  }

  protected onTipoDocumento(event: any, formName: string) {
    this.validacionDocumento = Helpers.fnValidacionesTipoDocumento(this.form, event, formName);
  }
}
