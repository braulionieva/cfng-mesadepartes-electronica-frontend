import { AfterViewInit, Component, OnDestroy, OnInit, Output, EventEmitter, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';

//primeng
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from "primeng/calendar";
//mpfn
import { CmpLibModule, ctrlErrorMsg } from "ngx-mpfn-dev-cmp-lib";
//utils
import { Map, tileLayer, Marker, LatLng } from 'leaflet';
import { GeoService } from '@shared/services/geo.service';
import { Subscription, lastValueFrom } from 'rxjs';
import { MaestrosService } from '@shared/services/shared/maestros.service';
import { formatTime, noQuotes, quitarTildes, formatDate } from '@shared/utils/utils';
import { isAfter, isBefore, isSameDay, isValid, parse, set } from 'date-fns';
import { LugarHecho } from '@shared/interfaces/complaint/complaint-registration';
import { DateMaskModule } from '@shared/directives/date-mask.module';
import { AlertComponent } from '@shared/components/alert/alert.component';
import { MessagesModule } from "primeng/messages";
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CryptService } from '@shared/services/global/crypt.service';
import { LOCALSTORAGE } from '@environments/environment';
import { TooltipModule } from 'primeng/tooltip';
import { ValidarInputDirective } from '@core/directives/validar-input.directive';
import { es } from 'date-fns/locale';
import {MesaService} from "@shared/services/shared/mesa.service";
import {ScenePlaceModalComponent} from "@modules/complaint/components/scene-place/modal/scene-place-modal.component";
import {DialogService} from "primeng/dynamicdialog";

const { DENUNCIA_KEY } = LOCALSTORAGE;

@Component({
  selector: 'complaint-scene-place',
  standalone: true,
  imports: [
    CommonModule, MessagesModule, FormsModule, ReactiveFormsModule, DropdownModule, CalendarModule,
    CmpLibModule, DateMaskModule, AlertComponent, ToastModule, TooltipModule, ValidarInputDirective
  ],
  templateUrl: './scene-place.component.html',
  styleUrls: ['./scene-place.component.scss'],
  providers: [MessageService]
})
export class ScenePlaceComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() recoveredData: LugarHecho | null = null;
  @Input() fechaPolicial: Date = null;
  @Output() formChanged = new EventEmitter<Object>();

  /***************/
  /*  VARIABLES  */
  /***************/

  public place: string[] = ['Perú']

  public departments = []

  public provinces = []

  public districts = []

  public sedesGrupoAleatorio = []

  private map: Map;

  public suscriptions: Subscription[] = []

  public currentMarker: Marker;

  public varDepto = '';

  public tiposVias = [];

  public site = [];

  public countReintentos: number = 0;

  //uitls
  public noQuotes = noQuotes;
  public formInitialized: boolean = false
  public validaToken

  public loadingData: boolean = false
  public flagMapa: boolean = true
  public isDisabledSedesGrupoAleatorio: boolean = true;

  public ubigeoInfo = {
    department: '',
    province: '',
    district: ''
  }

  public coordsRegistered: boolean = false
  public maxDate: Date = new Date();
  private _maxDate: Date = new Date();
  public complaintId: string;

  public messages = [{
    severity: 'warn',
    isVerification: false,
    detail: 'De ser posible, indíquenos en el mapa la ubicación donde ocurrió el hecho. ' +
      'Puedes ingresar la dirección exacta manualmente si la recuerdas o utilizar el mapa para ubicar una direccion referencial, o. ' +
      'Ten en cuenta que si seleccionas una ubicación en el mapa, la dirección escrita se actualizará automáticamente según esa selección.'
  }];

  /**********/
  /*  FORM  */
  /**********/

  public form: FormGroup

  /*****************/
  /*  CONSTRUCTOR  */
  /*****************/

  constructor(
    private readonly geoService: GeoService,
    private readonly maestrosService: MaestrosService,
    private readonly messageService: MessageService,
    private readonly cryptService: CryptService,
    private readonly mesaService: MesaService,
    private readonly dialogService: DialogService
  ) { }

  /****************/
  /*  LIFE CYCLE  */
  /****************/

  ngOnInit(): void {

    this.getDepartments()

    this.getRoads()

    this.getSites()

    this.buildForm()

  }

  ngAfterViewInit(): void {
    if (this.map) return;
    this.map = new Map('map').setView([-12.05145781025591, -77.0280674167715], 17);
    tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    this.map.on('click', (event) => {
      const latLng: LatLng = event.latlng;

      this.addMarkerToMap(latLng);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fechaPolicial']?.currentValue) {
      this._maxDate = changes['fechaPolicial'].currentValue;
      this.maxDate = this._maxDate;

      // Si la fecha del hecho es posterior a la fecha policial, resetearla
      const sceneDate = this.form.get('sceneDate').value;
      if (sceneDate && sceneDate > this._maxDate) {
        this.form.get('sceneDate').setValue(null);
      }
    }
  }

  ngOnDestroy(): void {
    this.suscriptions.forEach(s => s.unsubscribe());
  }

  /*****************/
  /*  GET METHODS  */
  /*****************/

  get coordsSelected(): boolean {
    return this.form.get('latitude').value && this.form.get('longitude').value;
  }

  /****************/
  /*  BUILD FORM  */
  /****************/

  buildForm() {
    if (localStorage.getItem(DENUNCIA_KEY)) {
      let valida = localStorage.getItem(LOCALSTORAGE.DENUNCIA_KEY);
      this.validaToken = JSON.parse(this.cryptService.decrypt(valida));
      this.form = new FormGroup({
        department: new FormControl(this.validaToken.lugarHecho.ubigeo.substring(0, 2), [
          Validators.required
        ]),
        province: new FormControl(this.validaToken.lugarHecho.ubigeo.substring(2, 4), [
          Validators.required
        ]),
        district: new FormControl(this.validaToken.lugarHecho.ubigeo.substring(4, 6), [
          Validators.required
        ]),
        address: new FormControl(this.validaToken.lugarHecho.direccion, [
          Validators.required,
          Validators.minLength(10)
        ]),
        tipoVia: new FormControl(this.validaToken.lugarHecho.tipoVia, [
          Validators.required
        ]),
        site: new FormControl('', [
          Validators.required
        ]),
        latitude: new FormControl(this.validaToken.lugarHecho.latitud, []),
        longitude: new FormControl(this.validaToken.lugarHecho.longitud, []),
        sceneDate: new FormControl(this.getDate(this.validaToken.lugarHecho.fechaHecho), [
          Validators.required
        ]),
        sceneHour: new FormControl(this.getHour(this.validaToken.lugarHecho.horaHecho), []),
        sedeGrupoAleatorio: new FormControl({value: '', disabled: true}, []),
      })

      this.setDepartament(this.validaToken.lugarHecho.ubigeo.substring(0, 2));
      this.getProvinces(this.validaToken.lugarHecho.ubigeo.substring(0, 2));
      this.setProvincia(this.validaToken.lugarHecho.ubigeo.substring(2, 4));
      this.getDistricts(this.validaToken.lugarHecho.ubigeo.substring(0, 2), this.validaToken.lugarHecho.ubigeo.substring(2, 4));
      this.setDistrito(this.validaToken.lugarHecho.ubigeo.substring(4, 6));

      this.ngAfterViewInit()
      //this.addMarkerToMap(new LatLng(this.validaToken.lugarHecho.latitud, this.validaToken.lugarHecho.longitud))

      this.saveInfo()

      this.form.valueChanges.subscribe(() => this.saveInfo())
      this.varDepto = '';
    } else {
      this.form = new FormGroup({
        department: new FormControl(null, [
          Validators.required
        ]),
        province: new FormControl(null, [
          Validators.required
        ]),
        district: new FormControl(null, [
          Validators.required
        ]),
        address: new FormControl(''),
        tipoVia: new FormControl('', [
          Validators.required
        ]),
        site: new FormControl('', [
          Validators.required
        ]),
        latitude: new FormControl(null, []),
        longitude: new FormControl(null, []),
        sceneDate: new FormControl('', [
          Validators.required
        ]),
        sceneHour: new FormControl('', []),
        sedeGrupoAleatorio: new FormControl({value: '', disabled: true}, [])
      })

      this.form.get('province').disable()
      this.form.get('district').disable()

      this.form.valueChanges.subscribe(() => this.saveInfo())

      this.varDepto = '';
    }

  }

  public setDepartament(codDepa: string) {
    if (codDepa !== null) {
      this.form.controls['department'].setValue(codDepa);
    }
  }

  public setProvincia(codProv: string) {
    if (codProv !== null) {
      this.form.controls['province'].setValue(codProv);
    }
  }

  public setDistrito(codDisp: string) {
    if (codDisp !== null) {
      this.form.controls['district'].setValue(codDisp);
    }
  }

  /*********/
  /*  MAP  */
  /*********/

  public addMarkerToMap(latLng: LatLng) {
    if (this.currentMarker)
      this.map.removeLayer(this.currentMarker)

    this.flagMapa = false
    this.getDireccion(latLng)
    this.currentMarker = new Marker(latLng).addTo(this.map)
    this.form.controls['latitude'].setValue(latLng.lat)
    this.form.controls['longitude'].setValue(latLng.lng)
  }

  public getDireccion(latLng: LatLng): void {
    this.geoService.buscarDireccion(latLng.lat, latLng.lng).subscribe({
      next: (response) => {
        const resp: any = response;

        if (resp.error) {
          this.resetMap(
            `La dirección seleccionada se encuentra fuera de la jurisdicción del Ministerio Público - Fiscalía de la Nación. Por favor, ingrese una dirección dentro del territorio perauano.`
          );

          return;
        }

        const respAdress = resp.address;
        const isOnlyCountryData = (Object.keys(respAdress).length === 2 && respAdress?.country === "Perú" && respAdress?.country_code === "pe");

        if (isOnlyCountryData) {
          this.resetMap(
            `La dirección seleccionada se encuentra fuera de la jurisdicción del Ministerio Público - Fiscalía de la Nación. Por favor, ingrese el distrito fiscal del puerto donde arriban los denunciantes/agraviados.`
          );

          return;
        }


        let numero = resp.address.house_number ?? '';
        let direccion = resp.address.road ?? '';

        if (resp.address.country_code === 'pe') {
          this.form.controls['address'].setValue(direccion + " " + numero)
        } else {
          this.resetMap(
            `La dirección seleccionada se encuentra fuera de la jurisdicción del Ministerio Público - Fiscalía de la Nación. Por favor, ingrese una dirección dentro del territorio peruano.`
          );

          return;
        }

        this.loadcontrols(resp);
      }
    })
  }

  private resetMap(message: string) {
    this.map.removeLayer(this.currentMarker)
    this.fieldDeptamento.reset();
    this.fieldProvincia.reset();
    this.fieldDestrito.reset();
    this.fieldDireccion.reset();
    this.fieldTipoVia.reset();

    this.messageService.add({
      severity: 'warn',
      detail: message
    })
  }

  async loadcontrols({ address, display_name }: any) {
    // obtenemos la descripcion y el codigo del departamento, si la region es callao el departamento es callao, ya que el api trae 'lima metropolitana'.
    // Y si la region no es callao de obtiene el departamento del 'state'.
    const desDep = address.region?.toUpperCase() === 'CALLAO' ? 'CALLAO' : address.state?.toUpperCase();
    const codDep = this.departments.find(e => e.nombre === quitarTildes(desDep))?.codigo ?? null;

    // obtenemos la descipcion de la provincia
    const desProv = address.region?.toUpperCase().replace(' ', '') ?? desDep;
    // obtenemos la descipcion del distrito.
    let desDis = address.city_district ?? address.suburb ?? address.city ?? address.town ?? address.village;

    desDis = desDis?.replaceAll('-', '').replaceAll(' ', '');
    // obtenemos la direccion
    const direccion = address.road ?? address.neighbourhood ?? display_name?.split(',')?.at(0) ?? null;

    // selecionamos el departamento
    this.fieldDeptamento.setValue(codDep);
    this.enableAndResetProvDist();

    // cargamos sus provincias.
    const provincias = await lastValueFrom(this.maestrosService.getProvinces(codDep));
    this.provinces = provincias.data;

    const codProv = this.provinces.find(e => e.nombre.replace(' ', '') === quitarTildes(desProv))?.codigo ?? null;
    this.fieldProvincia.setValue(codProv);
    this.enableAndResetDist();

    // cargamos los distritos.
    const distritos = await lastValueFrom(this.maestrosService.getDistricts(codDep, codProv));
    this.districts = distritos.data;

    const codDis = this.districts.find(e => e.nombre.replaceAll(' ', '').includes(quitarTildes(desDis?.toUpperCase())))?.codigo ?? null;
    this.fieldDestrito.setValue(codDis);

    // seteamos la direccion
    this.fieldDireccion.setValue(direccion);

  }

  /****************/
  /*  DEPARMENTS  */
  /****************/

  public getDepartments(): void {
    this.departments = []
    this.suscriptions.push(
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

  public changeDepartment(id: string): void {
    this.varDepto = id;
    if (id !== null) {
      const timeout = this.loadingData ? 500 : 0;
      setTimeout(() => {
        const department = this.departments.find(x => x.codigo === id)
        if (department) {
          this.form.controls['province'].reset()
          this.form.controls['province'].enable()
          this.form.controls['district'].reset()
          this.form.controls['district'].disable()
          this.form.controls['address'].reset()
          this.place = ['Perú']
          if (this.flagMapa) {
            this.flyToPlace(department.nombre)
          }
          this.getProvinces(department.codigo)
        }
      }, timeout);
    }
  }

  /***************/
  /*  PROVINCES  */
  /***************/

  public getProvinces(departmentId: string): void {
    this.provinces = []
    this.suscriptions.push(
      this.maestrosService.getProvinces(departmentId).subscribe({
        next: resp => {
          if (resp.code && resp.code === 200) {
            this.provinces = resp.data
            this.provinces.sort((x, y) => x.nombre.localeCompare(y.nombre));
            this.loadingData && this.form.get('province').setValue(this.getUbigeo(2))
          }
        }
      })
    )
  }

  public changeProvince(provinceId: string): void {
    if (provinceId !== null) {
      const province = this.provinces.find(x => x.codigo === provinceId)
      this.form.controls['district'].reset()
      this.form.controls['district'].enable()
      this.form.controls['address'].reset()
      this.place = this.place.slice(-2)
      if (this.flagMapa) {
        this.flyToPlace(province?.nombre)
      }
      this.getDistricts(this.varDepto, provinceId)
    }
  }

  private enableAndResetProvDist(): void {
    this.form.controls['province'].reset()
    this.form.controls['province'].enable()
    this.form.controls['district'].reset()
    this.form.controls['district'].disable()
    this.form.controls['address'].reset()
  }

  /***************/
  /*  DISTRICTS  */
  /***************/

  public getDistricts(departmentId: string, provinceId: string): void {
    this.districts = []
    this.suscriptions.push(
      this.maestrosService.getDistricts(departmentId, provinceId).subscribe({
        next: resp => {
          if (resp.code && resp.code === 200) {
            this.districts = resp.data
            this.districts.sort((x, y) => x.nombre.localeCompare(y.nombre));
            if (this.loadingData) {
              this.form.get('district').setValue(this.getUbigeo(3))
              this.loadingData = false
              this.changeDistrict(this.getUbigeo(3))
            }
          }
        }
      })
    )
  }

  public changeDistrict(id: string) {
    this.form.controls['address'].reset()
    if (id !== null) {
      const district = this.districts.find(x => x.codigo === id)
      this.place = this.place.slice(-3)
      if (this.flagMapa) {
        this.flyToPlace(district?.nombre, this.coordsRegistered)
      }
      this.flagMapa = true
      //this.getSedesGrupoAleatorio();
    }
  }

  private enableAndResetDist(): void {
    this.form.controls['district'].reset()
    this.form.controls['district'].enable()
    this.form.controls['address'].reset()
  }

  /****************/
  /*    SEDES     */
  /****************/

  public getSedesGrupoAleatorio(): void {
    const requestData = {
      "clienteIp": "10.40.121.10",
      "clienteBrowser": "Chrome",
      "clienteHttpUserAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "clienteTypeBrowser": "Desktop",
      "clienteVersionBrowser": "120.0",
      "idDistJudi": "07",
      "tipoIngreso": "PE",
      "idDist": 120143
    };

    this.sedesGrupoAleatorio = [];

    this.suscriptions.push(
      this.mesaService.getSedesGrupoAleatorio(requestData).subscribe({
        next: resp => {
          if (resp.codigo && resp.codigo === 200) {
            switch (resp.data.idEstadoServicio) {
              case 1:
                this.sedesGrupoAleatorio = resp.data.listaSedeGrpAleatorio;
                if (this.sedesGrupoAleatorio.length === 1) {
                  this.form.get('sedeGrupoAleatorio')?.setValue(this.sedesGrupoAleatorio[0].idGrupoAleatorio);
                } else if (this.sedesGrupoAleatorio.length > 1) {
                  this.sedesGrupoAleatorio.sort((x, y) => x.deSedeGeo.localeCompare(y.deSedeGeo));
                  this.isDisabledSedesGrupoAleatorio = false;
                  this.form.get('sedeGrupoAleatorio')?.enable();
                }
                break;
              case 2: //No hay grupos aleatorios para la sede - Mostrar mensaje sin reintentos
              case 3: //codigo diferente a 0000 - Mostrar mensaje sin reintentos
                if(this.countReintentos >= 2){
                  this.showErrorModal(2);
                }else{
                  this.showErrorModal(1);
                }
                this.countReintentos++;
                break;
              case 4: //error de conectividad - Reintentos
                this.showErrorModal(3);
                break;
            }
          }else{
            this.showErrorModal(3);
          }
        },
        error: resp => {
          this.showErrorModal(3);
        }
      })
    );
  }

  showErrorModal(errorType: number) {
    const ref = this.dialogService.open(ScenePlaceModalComponent, {
      showHeader: false,
      contentStyle: { 'max-width': '670px', padding: '0px' },
      data: {
        errorType: errorType
      }
    });

    ref.onClose.subscribe((retry: boolean) => {
      if (retry) {
        this.getSedesGrupoAleatorio();
      }
    });
  }

  /****************/
  /*    ROADS     */
  /****************/

  public getRoads(): void {
    this.tiposVias = []
    this.suscriptions.push(
      this.maestrosService.getRoads().subscribe({
        next: resp => {
          if (resp.code === 200) {
            this.tiposVias = resp.data
          }
        }
      })
    );
  }

  /****************/
  /*    SITES     */
  /****************/

  public getSites(): void {
    this.site = []
    this.suscriptions.push(
      this.maestrosService.getSites().subscribe({
        next: resp => {
          if (resp.codigo && resp.code === 200) {
            this.site = resp.data
          }
        }
      })
    );
  }

  /******************/
  /*  FLY TO PLACE  */
  /******************/

  private flyToPlace(place: string, newFly: boolean = false): void {
    this.place.unshift(place)
    if (!this.loadingData) {
      this.geoService.searchPlace(this.place.join(', '))
        .subscribe(res => {
          const { lat, lon } = res[0]
          if (newFly) {
            this.map.flyTo([this.form.get('latitude').value, this.form.get('longitude').value], 17)
            this.coordsRegistered = false
            return
          }
          this.map.flyTo([lat, lon], 17)
        })
    }
  }

  /***************/
  /*  SAVE INFO  */
  /***************/

  public saveInfo() {
    if (!this.loadingData) {
      const data = this.form.getRawValue()
      this.formChanged.emit({
        lugarHecho: {
          ubigeo: data.department + data.province + data.district,
          fechaHecho: data.sceneDate ? formatDate(data.sceneDate) : null,
          horaHecho: data.sceneHour ? formatTime(data.sceneHour) : null,
          longitud: data.longitude ?? null,
          latitud: data.latitude ?? null,
          direccion: data.address ?? '',
          tipoVia: data.tipoVia ?? null,
        },
        fechaCambio: !!data.sceneDate,
        horaCambio: !!data.sceneHour
      })
    }
  }

  /************/
  /*  OTHERS  */
  /************/

  public getUbigeo(type: number): string {
    let ubigeo = ''
    const { department, province, district } = this.ubigeoInfo
    switch (type) {
      case 1: ubigeo = `${department}`; break
      case 2: ubigeo = `${department}${province}`; break
      default: ubigeo = `${department}${province}${district}`; break
    }
    return ubigeo
  }

  public errorMsg(ctrlName) {
    return ctrlErrorMsg(this.form.get(ctrlName))
  }

  public getDate(value: string): Date {

    if (value === null)
      return null

    const [day, month, year] = value.split('/').map(Number);
    const date = new Date(year, month - 1, day);

    return date
  }

  public getHour(value: string): Date {

    if (value === null)
      return null

    const newTime = new Date();
    const [hours, minutes] = value.split(':').map(Number);
    newTime.setHours(hours);
    newTime.setMinutes(minutes);
    newTime.setSeconds(0);
    newTime.setMilliseconds(0);

    return newTime
  }

  get f() {
    return this.form;
  }

  get fieldDeptamento() {
    return this.f.get('department');
  }

  get fieldProvincia() {
    return this.f.get('province');
  }

  get fieldDestrito() {
    return this.f.get('district');
  }

  get fieldDireccion() {
    return this.f.get('address');
  }

  get fieldTipoVia() {
    return this.f.get('tipoVia');
  }

  protected alCambiarHoraHecho(): void {
    const sceneDate = this.form.controls['sceneDate'].value;
    const sceneHour = this.form.controls['sceneHour'].value;
    const fechaActual = new Date();

    const horaActual = new Date();
    horaActual.setHours(horaActual.getHours(), horaActual.getMinutes(), 0, 0);

    const fechaHoraHecho = set(sceneDate, { hours: sceneHour.getHours(), minutes: sceneHour.getMinutes() });
    const sonIguales = isSameDay(sceneDate, fechaActual);
    const esFechaMenor = isBefore(sceneDate, fechaActual);

    if (sonIguales) {
      if (isAfter(fechaHoraHecho, horaActual)) {
        this.form.get('sceneHour')?.setValue(null);
      } else {
        this.form.get('sceneHour')?.setValue(sceneHour);
      }
    } else if (esFechaMenor) {
      this.form.get('sceneHour')?.setValue(sceneHour);
    } else {
      this.form.get('sceneHour')?.setValue(null);
    }
  }

  protected limpiarHora() {
    this.form.controls['sceneHour'].reset();
  }

  protected validarFecha(event: any) {
    const fechaPolicia: Date = this.fechaPolicial;
    const valorTexto: string = event.target.value;

    // Parsear el texto ingresado como fecha
    const fechaIngresada = parse(valorTexto, 'dd/MM/yyyy', new Date(), { locale: es });

    // Validar si la fecha ingresada es válida
    if (isValid(fechaIngresada)) {
      const esMayor = isAfter(fechaIngresada, fechaPolicia);

      if (esMayor) {
        this.messageService.add({
          severity: 'warn',
          detail: `La fecha del hecho no puede ser posterior a la fecha de la denuncia policial.`
        })
      }
    }
  }
}
