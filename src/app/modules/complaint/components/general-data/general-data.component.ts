import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CmpLibModule, onlyLetterNumberDash } from "ngx-mpfn-dev-cmp-lib";
import { RadioButtonModule } from 'primeng/radiobutton';
import { CalendarModule } from "primeng/calendar";
import { ProfileType } from "@shared/helpers/dataType";
import { SLUG_PROFILE } from '@shared/helpers/slugs';
import { formatDate, getValidString, noQuotes } from '@shared/utils/utils';
import { DatosGeneralesPJPNP } from '@shared/interfaces/complaint/complaint-registration';
import { MaestrosService } from '@shared/services/shared/maestros.service';
import { Subscription } from 'rxjs';
import { CheckboxModule } from 'primeng/checkbox';
import { ENDPOINTS_MICROSERVICES, LOCALSTORAGE } from '@environments/environment';
import { CryptService } from '@shared/services/global/crypt.service';
import { ValidarInputDirective } from '@core/directives/validar-input.directive';
import { FileUploadComponent } from '@shared/components/file-upload/file-upload.component';
import { TokenService } from "@shared/services/auth/token.service";
import { DropdownModule } from "primeng/dropdown";
import { DateMaskModule } from "@shared/directives/date-mask.module";
import { TooltipModule } from "primeng/tooltip";
import { Item } from '@shared/interfaces/documento/item';
import { tipoDatoGenerales } from 'src/app/constantes/constante';
import { checkTouchUi } from '@shared/utils/touchui';
import { SetNumericInputCalendarModule } from '@shared/directives/set-numeric-input-calendar.module';

const { DENUNCIA_KEY } = LOCALSTORAGE;
@Component({
  selector: 'complaint-general-data',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, CmpLibModule, RadioButtonModule,
    CalendarModule, CheckboxModule, ValidarInputDirective, FileUploadComponent, DropdownModule, DateMaskModule, TooltipModule,
    SetNumericInputCalendarModule
  ],
  templateUrl: './general-data.component.html'
})
export class GeneralDataComponent implements OnInit {
  @Input() public profileID: ProfileType;
  @Input() public recoveredData: DatosGeneralesPJPNP | null = null

  @Output() public formChanged = new EventEmitter<Object>();
  @Output() public fechaDenunciaChanged = new EventEmitter<Date>();
  @Output() public filesChanged = new EventEmitter<boolean>();

  deleteURL: string = `${ENDPOINTS_MICROSERVICES.MS_REPOSITORIO}`
  url: string = `${ENDPOINTS_MICROSERVICES.MS_REPOSITORIO}cargar-comprimido`


  public formInitialized: boolean = false
  public loadingData: boolean = false

  public protectiveMeasure: boolean = false

  public riskTypesList = []
  public violenceTypesList = []

  public riskTypeName: string
  public violenceTypeName: string[]

  public subscriptions: Subscription[] = []

  public files = []
  public previousFiles = []

  public showExpedient: boolean = false;
  public expedientOptions = [
    { label: 'NO', value: false },
    { label: 'SI', value: true }
  ];
  public rucFounded: boolean = false

  private readonly amountMedidaProteccion: number = 0;
  private readonly amountAnexo: number = 0;
  public sumTotalBytesFiles: number = 0;
  private readonly amountRepresentanteLegal: number = 0;
  public maxDate: Date = new Date()

  protected tipoDatoGenerales = tipoDatoGenerales

  /***************/
  /*  VARIABLES  */
  /***************/

  public form: FormGroup;

  //utils
  public noQuotes = noQuotes;
  public validaToken
  public denunciaToken
  public validaKeyToken

  public tmpProfile: ProfileType = SLUG_PROFILE.CITIZEN;

  public departments = []
  public provinces = []
  public districts = []
  public juzgados = []
  public dependenciasPoliciales = []
  public varDepto = ''
  public isDisabledJuzgado: boolean = true
  public isDisabledDependenciaPolicial: boolean = true
  protected colegioAbogados: Item[] = []
  protected fieldsCZStatus: boolean = false;

  protected touchUiEnabled: boolean = false

  /*****************/
  /*  CONSTRUCTOR  */
  /*****************/
  constructor(
    private readonly maestrosService: MaestrosService,
    private readonly cryptService: CryptService,
    private readonly tokenService: TokenService,
  ) {

   }

  @HostListener('window:resize', ['$event'])
  onResize(event: UIEvent): void {
    this.touchUiEnabled = checkTouchUi(window.innerWidth)
  }

  /****************/
  /*  LIFE CYCLE  */
  /****************/

  ngOnInit(): void {

    this.touchUiEnabled = checkTouchUi(window.innerWidth)

    this.getDepartments()
    this.form = this.createFreshForm()
    let valida = localStorage.getItem(LOCALSTORAGE.VALIDATE_KEY);
    this.validaToken = JSON.parse(this.cryptService.decrypt(valida));
    this.form.get('datosContacto').setValue("DNI: " + this.validaToken?.validateIdentity.numeroDni + " - " + this.validaToken?.personaNatural.nombres + " " + this.validaToken?.personaNatural.apellidoPaterno + " " + this.validaToken?.personaNatural.apellidoMaterno)

    let denuncia = localStorage.getItem(LOCALSTORAGE.DENUNCIA_KEY);
    if (denuncia) {
      this.denunciaToken = JSON.parse(this.cryptService.decrypt(denuncia));
      if (this.denunciaToken.archivoPerfil !== undefined && this.denunciaToken.archivoPerfil.anexos !== undefined) {
        this.files = this.denunciaToken.archivoPerfil.anexos;
        this.previousFiles = this.denunciaToken.archivoPerfil.anexos;
        this.saveInfo();
        this.filesChanged.emit(this.files.length > 0);
      }
    }

    // Obtener el perfil seleccionado actual
    const profile = this.tokenService.getItemValidateToken('typeProfile');
    if (profile !== '') this.tmpProfile = profile as ProfileType;
  }


  get labelTableArchivos(): string {
    if (this.tmpProfile === 4) {
      return this.recoveredData?.medidaProteccion
        ? 'Expediente de medidas de protección'
        : 'Expediente';
    }
    return 'Informe Policial';
  }

  ngDoCheck() {
    if (this.files.length !== this.previousFiles.length && !this.loadingData) {
      this.previousFiles = [...this.files]
      this.saveInfo(true)
    }
  }

  /*****************/
  /*  GET METHODS  */
  /*****************/

  get isPNPProfile(): boolean {
    return SLUG_PROFILE.PNP === this.profileID
  }

  get isPJProfile(): boolean {
    return SLUG_PROFILE.PJ === this.profileID
  }

  get isCZProfile(): boolean {
    return SLUG_PROFILE.CITIZEN === this.profileID
  }

  get esTipoDatoGeneralAbogado(): boolean {
    return this.validaToken.ciudadano?.denunciaAbogado
  }

  public cleanSearch(): void {
    this.rucFounded = false
    this.form.get('documentNumber').setValue('')
    this.form.get('documentNumber').markAsUntouched()
    this.form.get('businessName').setValue('')
  }

  /****************/
  /*  RISK TYPES  */
  /****************/

  public getRiskTypes(): void {
    this.subscriptions.push(
      this.maestrosService.getRiskTypes().subscribe({
        next: resp => {
          if (resp && resp.code === 200) {
            this.riskTypesList = resp.data
          }
        }
      })
    )
  }

  /********************/
  /*  VIOLENCE TYPES  */
  /********************/

  public getViolenceTypes(): void {
    this.subscriptions.push(
      this.maestrosService.getViolenceTypes().subscribe({
        next: resp => {
          if (resp && resp.code === 200) {
            this.violenceTypesList = resp.data
          }
        }
      })
    )
  }

  /****************/
  /*  DEPARTMENTS  */
  /****************/

  public getDepartments(): void {
    this.departments = []
    this.subscriptions.push(
      this.maestrosService.getDepartments().subscribe({
        next: resp => {
          if (resp.code && resp.code === 200) {
            this.departments = resp.data
            this.departments.sort((x, y) => x.nombre.localeCompare(y.nombre));
          }
        }
      })
    );
  }

  public changeDepartment(id: string, form: string): void {
    this.varDepto = id;
    if (id !== null) {
      const department = this.departments.find(x => x.codigo === id)
      if (department) {
        this.form.controls['province'].reset()
        this.form.controls['province'].enable()
        this.form.controls['district'].reset()
        this.form.controls['district'].disable()

        if (form == 'juzgado') {
          this.form.controls['juzgado'].reset()
          this.form.controls['juzgado'].disable()
          this.isDisabledJuzgado = true
        }

        if (form == 'policia') {
          this.form.controls['dependenciaPolicial'].reset()
          this.form.controls['dependenciaPolicial'].disable()
          this.isDisabledDependenciaPolicial = true
        }

        this.getProvinces(department.codigo)
      }
    }
  }

  /***************/
  /*  PROVINCES  */
  /***************/

  public getProvinces(departmentId: string): void {
    this.provinces = []
    this.subscriptions.push(
      this.maestrosService.getProvinces(departmentId).subscribe({
        next: resp => {
          if (resp.code && resp.code === 200) {
            this.provinces = resp.data
            this.provinces.sort((x, y) => x.nombre.localeCompare(y.nombre));
          }
        }
      })
    )
  }

  public changeProvince(provinceId: string): void {
    if (provinceId !== null) {
      this.form.controls['district'].reset()
      this.form.controls['district'].enable()
      this.getDistricts(this.varDepto, provinceId)
    }
  }

  /***************/
  /*  DISTRICTS  */
  /***************/

  public getDistricts(departmentId: string, provinceId: string): void {
    this.districts = []
    this.subscriptions.push(
      this.maestrosService.getDistricts(departmentId, provinceId).subscribe({
        next: resp => {
          if (resp.code && resp.code === 200) {
            this.districts = resp.data
            this.districts.sort((x, y) => x.nombre.localeCompare(y.nombre));
          }
        }
      })
    )
  }

  public changeDistrict(id: string, form: string) {
    if (id !== null) {
      const district = this.districts.find(x => x.codigo === id)
      if (district) {
        const department = this.form.controls['department'].value;
        const province = this.form.controls['province'].value;

        if (form == 'juzgado') {
          this.form.controls['juzgado'].reset()
          this.form.controls['juzgado'].disable()
          this.isDisabledJuzgado = true
          this.getJuzgados(department + province + district.codigo)
        }

        if (form == 'policia') {
          this.form.controls['dependenciaPolicial'].reset()
          this.form.controls['dependenciaPolicial'].disable()
          this.isDisabledDependenciaPolicial = true
          this.getDependenciasPoliciales(department + province + district.codigo)
        }
      }
    }
  }

  /***************/
  /*  JUZGADOS   */
  /***************/

  public getJuzgados(coUbigeo: string): void {
    this.juzgados = []
    this.subscriptions.push(
      this.maestrosService.getJuzgados(coUbigeo).subscribe({
        next: resp => {
          if (resp.code && resp.code === 200) {
            this.juzgados = resp.data
            this.juzgados.sort((x, y) => x.descEntidad.localeCompare(y.descEntidad));
            if (this.juzgados.length > 0 && this.form) {
              this.form.controls['juzgado'].enable()
              this.isDisabledJuzgado = false
            }
          }
        }
      })
    )
  }


  /***************************/
  /*  DEPENDENCIA POLICIAL   */
  /***************************/

  public getDependenciasPoliciales(coUbigeo: string): void {
    this.dependenciasPoliciales = []
    this.subscriptions.push(
      this.maestrosService.getDependenciasPoliciales(coUbigeo).subscribe({
        next: resp => {
          if (resp.code && resp.code === 200) {
            this.dependenciasPoliciales = resp.data
            this.dependenciasPoliciales.sort((x, y) => x.nombre.localeCompare(y.nombre));
            if (this.dependenciasPoliciales.length > 0 && this.form) {
              this.form.controls['dependenciaPolicial'].enable()
              this.isDisabledDependenciaPolicial = false
            }
          }
        }
      })
    )
  }

  /*****************/
  /*  CREATE FORM  */
  /*****************/

  public createFreshForm(): FormGroup {
    if (this.isPNPProfile) {
      return this.createPNPFreshForm();
    } else if (this.isCZProfile) {
      return this.createCZFreshForm();
    } else {
      return this.createPJFreshForm();
    }
  }

  public createPNPFreshForm(): FormGroup {
    if (localStorage.getItem(DENUNCIA_KEY)) {
      let valida = localStorage.getItem(LOCALSTORAGE.DENUNCIA_KEY);
      this.validaToken = JSON.parse(this.cryptService.decrypt(valida));
      const ubigeo = this.validaToken.policia.ubigeo;
      this.form = new FormGroup({
        policeReportNumber: new FormControl(this.validaToken.policia.numeroInformePolicial, [Validators.required]),
        codigoCip: new FormControl(this.validaToken.policia.codigoCip, [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(8),
          Validators.pattern(onlyLetterNumberDash)]),
        efectivoPolicial: new FormControl(''),
        datosContacto: new FormControl(''),
        fechaPolicial: new FormControl('', [Validators.required]),
        department: new FormControl(ubigeo.slice(0, 2), [Validators.required]),
        province: new FormControl(ubigeo.slice(2, 4), [Validators.required]),
        district: new FormControl(ubigeo.slice(4, 6), [Validators.required]),
        dependenciaPolicial: new FormControl(this.validaToken.policia.dependenciaPolicial, [Validators.required]),
        anexoComisaria: new FormControl(this.validaToken.policia.anexoComisaria),
        numeroPartePolicial: new FormControl(this.validaToken.policia.numeroPartePolicial, [Validators.required]),
      })
      let validakey = localStorage.getItem(LOCALSTORAGE.VALIDATE_KEY);
      this.validaKeyToken = JSON.parse(this.cryptService.decrypt(validakey));
      this.form.get('datosContacto').setValue("DNI: " + this.validaKeyToken?.validateIdentity.numeroDni + " - " + this.validaKeyToken?.personaNatural.nombres + " " + this.validaKeyToken?.personaNatural.apellidoPaterno + " " + this.validaKeyToken?.personaNatural.apellidoMaterno)

      // Cargar provincias, distritos y dependencias policiales
      this.getProvinces(ubigeo.slice(0, 2));
      this.getDistricts(ubigeo.slice(0, 2), ubigeo.slice(2, 4));
      this.getDependenciasPoliciales(ubigeo);

      //this.saveInfo()
      this.form.valueChanges.subscribe(() => this.saveInfo())
      return this.form
    } else {
      this.form = new FormGroup({
        policeReportNumber: new FormControl('', [Validators.required]),
        codigoCip: new FormControl('', [Validators.required,
        Validators.minLength(6),
        Validators.maxLength(8),
        Validators.pattern(onlyLetterNumberDash)]),
        efectivoPolicial: new FormControl(''),
        datosContacto: new FormControl(''),
        fechaPolicial: new FormControl('', [Validators.required]),
        department: new FormControl(null, [Validators.required]),
        province: new FormControl({ value: null, disabled: true }, [Validators.required]),
        district: new FormControl({ value: null, disabled: true }, [Validators.required]),
        dependenciaPolicial: new FormControl({ value: null, disabled: true }, [Validators.required]),
        anexoComisaria: new FormControl(''),
        numeroPartePolicial: new FormControl('', [Validators.required]),
      })
      this.form.valueChanges.subscribe(() => this.saveInfo())
      return this.form
    }
  }

  public createPJFreshForm(): FormGroup {
    return localStorage.getItem(DENUNCIA_KEY)
      ? this.buildPJFormFromToken()
      : this.buildEmptyPJForm();
  }

  private buildPJFormFromToken(): FormGroup {
    this.loadTokenData();
    const ubigeo = this.extractUbigeo();
    const fechaDenuncia = this.extractFechaDenuncia();

    const form = this.initPJFormGroup(ubigeo, fechaDenuncia);
    this.loadUbigeoLookups(ubigeo);
    this.applyMedidaProteccionDefaults();
    this.subscribeDateFormatting(form);
    this.saveAndWatch(form);

    return form;
  }

  private buildEmptyPJForm(): FormGroup {
    const form = this.initEmptyPJFormGroup();
    this.saveAndWatch(form);
    return form;
  }

  /** Helpers abajo... */

  private loadTokenData(): void {
    const raw = localStorage.getItem(DENUNCIA_KEY);
    this.validaToken = JSON.parse(this.cryptService.decrypt(raw));
  }

  private extractUbigeo(): string {
    const juz = this.validaToken.juzgado ?? {};
    return juz.ubigeo ?? '';
  }

  private extractFechaDenuncia(): Date | null {
    const d = this.validaToken.juzgado?.fechaDenuncia;
    return d ? this.getDate(d) : null;
  }

  private initPJFormGroup(ubigeo: string, fechaDen: Date | null): FormGroup {
    const juz = this.validaToken.juzgado ?? {};
    const fg = new FormGroup({
      nroExpediente: new FormControl(this.validaToken.nroExpediente, [
        Validators.required,
        Validators.pattern('^[a-zA-Z0-9K/-]*$')
      ]),
      riskType: new FormControl(this.validaToken.medidaProteccion?.idTipoRiesgo ?? null),
      violenceType: new FormControl(this.validaToken.medidaProteccion?.idsTipoViolencia ?? []),
      expedient: new FormControl(this.validaToken.medidaProteccion),
      datosContacto: new FormControl(''),
      department: new FormControl(ubigeo.slice(0, 2), [Validators.required]),
      province: new FormControl(ubigeo.slice(2, 4), [Validators.required]),
      district: new FormControl(ubigeo.slice(4, 6), [Validators.required]),
      juzgado: new FormControl({ value: juz.coEntidad ?? null, disabled: true }, [Validators.required]),
      fechaDenuncia: new FormControl(fechaDen, [Validators.required]),
    });

    this.showExpedient = fg.get('expedient').value;
    return fg;
  }

  private initEmptyPJFormGroup(): FormGroup {
    const fg = new FormGroup({
      nroExpediente: new FormControl('', [
        Validators.required,
        Validators.pattern('^[a-zA-Z0-9K/-]*$')
      ]),
      riskType: new FormControl(null),
      violenceType: new FormControl([]),
      expedient: new FormControl(null),
      datosContacto: new FormControl(''),
      department: new FormControl(null, [Validators.required]),
      province: new FormControl({ value: null, disabled: true }, [Validators.required]),
      district: new FormControl({ value: null, disabled: true }, [Validators.required]),
      juzgado: new FormControl({ value: null, disabled: true }, [Validators.required]),
      fechaDenuncia: new FormControl(null, [Validators.required]),
    });

    this.showExpedient = false;
    return fg;
  }

  private loadUbigeoLookups(ubigeo: string): void {
    if (!ubigeo) return;
    this.getProvinces(ubigeo.slice(0, 2));
    this.getDistricts(ubigeo.slice(0, 2), ubigeo.slice(2, 4));
    this.getJuzgados(ubigeo);
  }

  private applyMedidaProteccionDefaults(): void {
    const mp = this.validaToken.medidaProteccion;
    if (!mp) return;
    this.riskTypeName = mp.tipoRiesgo;
    this.violenceTypeName = mp.tiposViolencia;
  }

  private subscribeDateFormatting(form: FormGroup): void {
    form.get('fechaDenuncia').valueChanges.subscribe(date => {
      if (!date) return;
      form.get('fechaDenuncia')
        .setValue(date, { emitEvent: false });
    });
  }

  private saveAndWatch(form: FormGroup): void {
    this.form = form;
    form.valueChanges.subscribe(() => this.saveInfo());
  }



  /***********************/
  /*  GET VIOLENCE NAME  */
  /***********************/

  public getViolenceNames(): string[] | null {
    let result: string[] = []
    const data = this.form.get('violenceType').value
    if (data !== null) {
      data.forEach(v => {
        const violence = this.violenceTypesList.find(x => x.id === v)
        violence && result.push(getValidString(violence.nombre))
      });
    }
    if (result.length == 0) {
      result = this.violenceTypeName
    }

    return result.length > 0 ? result : null
  }

  /***************/
  /*  SAVE INFO  */
  /***************/

  public saveInfo(force: boolean = false): void {
    if (this.loadingData || !this.form) return;

    const data = this.form.getRawValue();
    this.emitFechaDenuncia(data.fechaDenuncia);

    const files = this.formatFiles();
    const descEntidad = this.getJuzgadoDesc(data.juzgado);

    // Construimos un request base común
    const baseReq = this.buildBaseRequest(data, files, descEntidad);

    let request = baseReq
    // Adaptamos según perfil
    if (this.profileID === SLUG_PROFILE.PNP) request = this.buildPNPRequest(baseReq, data)
    if (this.profileID === SLUG_PROFILE.PJ) request = this.buildPJRequest(baseReq, data)

    if (force) request.force = true;
    this.formChanged.emit(request);
  }

  private emitFechaDenuncia(fecha: Date): void {
    if (fecha) this.fechaDenunciaChanged.emit(fecha);
  }

  private formatFiles(): any[] {
    return this.files.map(f => ({
      tipoArchivo: f.tipoArchivo,
      nodeId: f.nodeId,
      numeroFolios: f.numeroFolios,
      idTipoCopia: null,
      numeroDocumento: null,
      nombreOriginal: f.nombreOriginal,
      tamanyo: f.tamanyo
    }));
  }

  private getJuzgadoDesc(cod: string): string {
    return this.juzgados.find(j => j.codEntidad === cod)?.descEntidad ?? null;
  }

  private getDependenciaPolicialDesc(cod: string): string {
    return this.dependenciasPoliciales.find(d => d.id === cod)?.nombre ?? null;
  }

  private buildBaseRequest(data: any, files: any[], desc: string): any {
    const descDependencia = this.getDependenciaPolicialDesc(data.dependenciaPolicial);
    return {
      numeroInformePolicial: getValidString(data.policeReportNumber),
      codigoCip: getValidString(data.codigoCip),
      fechaPolicial: data.fechaPolicial ? formatDate(data.fechaPolicial) : null,
      nroExpediente: getValidString(data.nroExpediente),
      medidaProteccion: null,
      archivoPerfil: { anexos: files },
      juzgado: this.profileID === SLUG_PROFILE.PJ ? {
        ubigeo: data.department + data.province + data.district,
        coEntidad: data.juzgado,
        fechaDenuncia: data.fechaDenuncia ? formatDate(data.fechaDenuncia) : null,
        descEntidad: desc
      } : undefined,
      policia: this.profileID === SLUG_PROFILE.PNP ? {
        codigoCip: getValidString(data.codigoCip),
        numeroInformePolicial: getValidString(data.policeReportNumber),
        ubigeo: data.department + data.province + data.district,
        dependenciaPolicial: data.dependenciaPolicial,
        descDependenciaPolicial: descDependencia,
        anexoComisaria: data.anexoComisaria,
        numeroPartePolicial: data.numeroPartePolicial
      } : undefined,
      fechaCambio: this.profileID === SLUG_PROFILE.PNP
        ? !!data.fechaPolicial
        : undefined,
      ciudadano: this.profileID === SLUG_PROFILE.CITIZEN ? {
        denunciaAbogado: data.denunciaAbogado,
        idColegioAbogado: data.idColegioAbogado,
        numeroColegiatura: data.numeroColegiatura,
        numeroDenuncia: data.numeroDenuncia,
      } : undefined
    };
  }

  private buildPNPRequest(base: any, data: any): any {
    base.nroExpediente = null;
    return base;
  }

  private buildPJRequest(base: any, data: any): any {
    if (data.riskType != null && data.expedient) {
      base.medidaProteccion = {
        idTipoRiesgo: data.riskType,
        tipoRiesgo: this.riskTypesList.find(x => x.id === data.riskType)?.nombre
          ?? this.riskTypeName,
        idsTipoViolencia: data.violenсeType?.length ? data.violenceType : null,
        tiposViolencia: this.getViolenceNames(),
        archivoPerfil: { anexos: this.formatFiles() }
      };
    }
    return base;
  }

  public getDate(value: string | Date | null): Date | null {
    if (!value) return null;

    // Si ya es una fecha, retornarla
    if (value instanceof Date) return value;

    // Si es string en formato dd/mm/yyyy
    if (typeof value === 'string' && value.includes('/')) {
      const [day, month, year] = value.split('/').map(Number);
      return new Date(year, month - 1, day);
    }

    // Si es string en formato ISO
    if (typeof value === 'string') {
      return new Date(value);
    }

    return null;
  }



  /******************* */
  onFilesChanged(newFiles: any[]): void {
    this.files = newFiles;
    this.previousFiles = [...newFiles];
    this.saveInfo(true);
    this.filesChanged.emit(this.files.length > 0);
  }

  public errorMsg(field: string): string {
    if (!this.form) {
      return null;
    }
    const control = this.form.get(field);
    if (control && control.invalid && (control.dirty || control.touched)) {
      if (control.errors?.['required']) {
        return 'Este campo es requerido';
      }
    }
    return null;
  }

  /** CITIZEN */
  private createCZFreshForm(): FormGroup {
    this.getColegioAbogados();
    return localStorage.getItem(DENUNCIA_KEY)
      ? this.buildCZFormFromToken()
      : this.buildEmptyCZForm();
  }

  private buildCZFormFromToken(): FormGroup {
    this.loadTokenData();
    const form = this.initCZFormGroup();
    this.fieldsCZStatus = this.esTipoDatoGeneralAbogado
    this.saveAndWatch(form);
    return form
  }

  private initCZFormGroup(): FormGroup {
    const fr = new FormGroup({
      datosContacto: new FormControl('', [Validators.required]),
      denunciaAbogado: new FormControl(this.validaToken.ciudadano.denunciaAbogado),
      idColegioAbogado: new FormControl(this.validaToken.ciudadano.idColegioAbogado),
      numeroColegiatura: new FormControl(this.validaToken.ciudadano.numeroColegiatura),
      numeroDenuncia: new FormControl(this.validaToken.ciudadano.numeroDenuncia),
    });
    setTimeout(() => { this.controlEstadoAbogado(this.esTipoDatoGeneralAbogado) }, 0)
    return fr
  }

  private buildEmptyCZForm(): FormGroup {
    const form = this.initEmptyCZFormGroup();
    this.saveAndWatch(form);
    return form;
  }

  private initEmptyCZFormGroup(): FormGroup {
    return new FormGroup({
      datosContacto: new FormControl(''),
      denunciaAbogado: new FormControl(false),
      idColegioAbogado: new FormControl({ value: null, disabled: true }),
      numeroColegiatura: new FormControl(null),
      numeroDenuncia: new FormControl(null),
    });
  }

  protected alCambiarDenunciaAbogado(tipoAbogado: boolean): void {
    this.form.get('idColegioAbogado').reset()
    this.form.get('numeroColegiatura').reset()
    this.controlEstadoAbogado(tipoAbogado)
  }

  private controlEstadoAbogado(habilitar: boolean): void {
    this.fieldsCZStatus = habilitar
    if (habilitar) {
      this.form.get('idColegioAbogado').enable()
      this.form.get('idColegioAbogado').setValidators([Validators.required])
      this.form.get('numeroColegiatura').setValidators([Validators.required, Validators.maxLength(6), Validators.minLength(5)])
    } else {
      this.form.get('idColegioAbogado').disable()
      this.form.get('idColegioAbogado').setValidators(null)
      this.form.get('numeroColegiatura').setValidators(null)
    }
  }

  private getColegioAbogados(): void {
    this.colegioAbogados = []
    this.subscriptions.push(
      this.maestrosService.getColegioAbogados().subscribe({
        next: resp => {
          if (resp.code && resp.code === 200) {
            this.colegioAbogados = resp.data
          }
        }
      })
    )
  }

}
