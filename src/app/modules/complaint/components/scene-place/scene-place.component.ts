import { AfterViewInit, Component, OnDestroy, OnInit, Output, EventEmitter, Input, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from "primeng/calendar";
import { CmpLibModule, ctrlErrorMsg } from "ngx-mpfn-dev-cmp-lib";
import { Map, tileLayer, Marker, LatLng } from 'leaflet';
import { GeoService } from '@shared/services/geo.service';
import { Subscription, debounceTime, lastValueFrom } from 'rxjs';
import { MaestrosService } from '@shared/services/shared/maestros.service';
import { formatTime, noQuotes, quitarTildes, formatDate } from '@shared/utils/utils';
import { isAfter, isBefore, isSameDay, isValid, parse, set } from 'date-fns';
import { LugarHecho, SedeGrupoAleatorioSgf } from '@shared/interfaces/complaint/complaint-registration';
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
import { MesaService } from "@shared/services/shared/mesa.service";
import { ScenePlaceModalComponent } from "@modules/complaint/components/scene-place/modal/scene-place-modal.component";
import { DialogService } from "primeng/dynamicdialog";
import { IpService } from "@shared/services/global/ip.service";
import { ConstanteSgf } from "../../../../constantes/ConstanteSgf";
import { ClientInfoUtil } from '@shared/utils/client-info';
import { SetNumericInputCalendarModule } from '@shared/directives/set-numeric-input-calendar.module';
import { TokenService } from '@shared/services/auth/token.service';

const { DENUNCIA_KEY } = LOCALSTORAGE;

@Component({
  selector: 'complaint-scene-place',
  standalone: true,
  imports: [
    CommonModule, MessagesModule, FormsModule, ReactiveFormsModule, DropdownModule, CalendarModule,
    CmpLibModule, DateMaskModule, AlertComponent, ToastModule, TooltipModule, ValidarInputDirective,
    SetNumericInputCalendarModule
  ],
  templateUrl: './scene-place.component.html',
  styleUrls: ['./scene-place.component.scss'],
  providers: [MessageService]
})
export class ScenePlaceComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() recoveredData: LugarHecho | null = null;
  @Input() fechaPolicial: Date = null;
  @Output() formChanged = new EventEmitter<Object>();

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
  private ip: string = '';

  public noQuotes = noQuotes;
  public formInitialized: boolean = false
  public validaToken

  public loadingData: boolean = false
  public flagMapa: boolean = true
  public isDisabledSedesGrupoAleatorio: boolean = true;

  public grupoAleatorioSgfSelected: SedeGrupoAleatorioSgf | null = null;

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
  }]

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
    private readonly dialogService: DialogService,
    private readonly ipService: IpService
  ) { }

  /****************/
  /*  LIFE CYCLE  */
  /****************/

  ngOnInit(): void {

    this.getDepartments()

    this.getRoads()

    this.getSites()

    this.buildForm()

    this.ipService.getIp().subscribe(resp => {
      this.ip = resp.ip;
    });

  }

  private clickMapa = false;

  ngAfterViewInit(): void {
    if (this.map) return;
    this.map = new Map('map').setView([-12.05145781025591, -77.0280674167715], 17);
    tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    this.map.on('click', (event) => {
      this.flagMapa = true;
      this.clickMapa = true;

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

      //desencripta y obtiene la data
      this.validaToken = JSON.parse(this.cryptService.decrypt(valida));

      // ← CAMBIO: Asignación segura ANTES del FormGroup
      this.grupoAleatorioSgfSelected = this.validaToken.lugarHecho?.grupoAleatorioSgfSelected ?? null;

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
        // ← CAMBIO: Usar operador seguro
        sedeGrupoAleatorio: new FormControl({
          value: this.grupoAleatorioSgfSelected?.idGrupoAleatorio || '',
          disabled: true
        }, []),
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
      // ← CAMBIO: Asegurar que se mantiene null
      this.grupoAleatorioSgfSelected = null;

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
        sedeGrupoAleatorio: new FormControl({ value: '', disabled: true }, [])
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
    if (this.currentMarker) {
      this.map.removeLayer(this.currentMarker)
      this.currentMarker = null;
    }

    this.flagMapa = false

    this.getDireccion(latLng)
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

        const isOnlyCountryData = Object.keys(respAdress).length === 2
          && respAdress?.country === "Perú"
          && respAdress?.country_code === "pe";

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
        }

        else {
          this.resetMap(
            `La dirección seleccionada se encuentra fuera de la jurisdicción del Ministerio Público - Fiscalía de la Nación. Por favor, ingrese una dirección dentro del territorio peruano.`
          );

          return;
        }

        this.loadcontrols(resp).then(respLoadControls => {
          if (respLoadControls) {
            this.currentMarker = new Marker(latLng).addTo(this.map)
            this.form.controls['latitude'].setValue(latLng.lat)
            this.form.controls['longitude'].setValue(latLng.lng)

            this.flyToPlace('', true)
          }

          this.clickMapa = false;
        });
      },
      error: err => {
        // manejar error si quieres
        console.error(err);
      }
    });
  }


  private resetMap(message: string) {
    this.map.removeLayer(this.currentMarker)
    this.fieldDeptamento.reset();
    this.fieldProvincia.reset();
    this.fieldDestrito.reset();
    this.fieldDireccion.reset();
    this.fieldTipoVia.reset();

    this.form.controls['latitude'].reset()
    this.form.controls['longitude'].reset()

    this.messageService.add({
      severity: 'warn',
      detail: message
    })
  }

  private normalizeString(str: string): string {
    return str
      .normalize('NFD')                 // Descompone caracteres acentuados en base + tilde
      .replace(/[\u0300-\u036f]/g, '')  // Elimina los caracteres de tilde
      .toLowerCase();
  }

  private extraerTipoVia(lugar: string): string {
    const tiposVia = ['avenida', 'calle', 'jirón', 'jiron', 'pasaje', 'parque', 'ovalo'];

    if (!lugar) return lugar;

    const palabras = lugar.trim().split(/\s+/);

    if (palabras.length === 0) return lugar;

    const primeraPalabra = this.normalizeString(palabras[0]);

    const viaSeleccionada = this.tiposVias.find(x =>
      this.normalizeString(x.nombre) === primeraPalabra
    );

    if (viaSeleccionada != null)
      this.form.get('tipoVia')?.setValue(viaSeleccionada.id);

    const tiposViaNormalizados = tiposVia.map(t => this.normalizeString(t));

    if (tiposViaNormalizados.includes(primeraPalabra)) {
      return palabras.slice(1).join(' ');
    }

    return lugar;
  }



  async loadcontrols({ address, display_name }: any): Promise<boolean> {
    // obtenemos la descripcion y el codigo del departamento, si la region es callao el departamento es callao, ya que el api trae 'lima metropolitana'.
    // Y si la region no es callao de obtiene el departamento del 'state'.
    const desDep = address.region?.toUpperCase() === 'CALLAO' ? 'CALLAO' : address.state?.toUpperCase();
    const codDep = this.departments.find(e => e.nombre === quitarTildes(desDep))?.codigo ?? null;

    if (codDep == null) {
      this.enableAndResetProvDist();
      return false
    }

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
    const provincias = await lastValueFrom(this.maestrosService.getProvincesLegacy(codDep));
    this.provinces = provincias.data;

    const codProv = this.provinces.find(e => e.nombre.replace(' ', '') === quitarTildes(desProv))?.codigo ?? null;
    this.fieldProvincia.setValue(codProv);

    if (codDep == null || codProv == null) {
      this.form.controls['tipoVia'].reset();
      this.form.controls['address'].reset();
      return false
    }

    this.enableAndResetDist();

    // cargamos los distritos.
    const distritos = await lastValueFrom(this.maestrosService.getDistrictsLegacy(codDep, codProv));
    this.districts = distritos.data;

    const codDis = this.districts.find(e => e.nombre.replaceAll(' ', '').includes(quitarTildes(desDis?.toUpperCase())))?.codigo ?? null;

    if (codDis == null) {
      this.form.controls['tipoVia'].reset();
      this.form.controls['address'].reset();
      return false
    }

    this.fieldDestrito.setValue(codDis);

    // seteamos la direccion
    this.fieldDireccion.setValue(this.extraerTipoVia(direccion));

    return true;
  }

  /****************/
  /*  DEPARMENTS  */
  /****************/

  public getDepartments(): void {
    this.departments = []
    this.suscriptions.push(
      this.maestrosService.getDepartmentsLegacy().subscribe({
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
    this.sedesGrupoAleatorio = [];
    this.varDepto = id;

    if (this.map != null && this.currentMarker != null)
      this.map.removeLayer(this.currentMarker)

    if (id !== null) {
      const timeout = this.loadingData ? 500 : 0;
      setTimeout(() => {
        const department = this.departments.find(x => x.codigo === id)
        if (department) {
          this.form.controls['province'].reset()
          this.form.controls['province'].enable()
          this.form.controls['district'].reset()
          this.form.controls['district'].disable()
          this.form.controls['tipoVia'].reset();
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
    this.sedesGrupoAleatorio = [];

    if (departmentId == null)
      return;

    this.suscriptions.push(
      this.maestrosService.getProvincesLegacy(departmentId).subscribe({
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
      this.form.controls['tipoVia'].reset();
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

    this.form.controls['tipoVia'].reset();
    this.form.controls['address'].reset()

    this.form.controls['sedeGrupoAleatorio'].reset()
    this.form.controls['sedeGrupoAleatorio'].disable()
  }

  /***************/
  /*  DISTRICTS  */
  /***************/

  public getDistricts(departmentId: string, provinceId: string): void {
    this.districts = []
    this.sedesGrupoAleatorio = [];

    if (departmentId == null || provinceId == null)
      return;

    this.suscriptions.push(
      this.maestrosService.getDistrictsLegacy(departmentId, provinceId).subscribe({
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


  private buildPlace(): string[] {
    let place = ["Perú"];

    const isEmptyOrNull = (value: string | null | undefined): boolean =>
      value == null || value.trim() === '';

    const formControls = this.form;

    // Mapeamos los campos a sus arrays correspondientes para buscar la descripción
    const lookupMap = {
      department: this.departments,
      province: this.provinces,
      district: this.districts
    } as const;

    const fields = ['department', 'province', 'district'] as const;

    fields.forEach(field => {
      const value = formControls.get(field)?.value;

      if (!isEmptyOrNull(value)) {
        const lookupArray = lookupMap[field];
        const found = lookupArray.find(item => item.codigo === value);

        if (found)
          place.push(found.nombre);
        else
          place.push(value);
      }
    });

    return place;
  }




  public changeDistrict(id: string) {
    if (this.currentMarker) {
      this.map.removeLayer(this.currentMarker)
      this.currentMarker = null;
    }

    this.form.controls['tipoVia'].reset();
    this.form.controls['address'].reset()

    if (id !== null) {
      const district = this.districts.find(x => x.codigo === id)
      this.place = this.place.slice(-3)


      if (!this.clickMapa)
        this.flyToPlace(district?.nombre, this.coordsRegistered)


      this.clickMapa = false;
      this.flagMapa = true
      this.getSedesGrupoAleatorio();
    }
  }

  private enableAndResetDist(): void {
    this.form.controls['district'].reset()
    this.form.controls['district'].enable()

    this.form.controls['tipoVia'].reset();
    this.form.controls['address'].reset()
  }

  public changeSedeGrupoAleatorio(idGrupoAleatorio: string): void {
    if (idGrupoAleatorio && this.sedesGrupoAleatorio.length > 0) {
      // Buscar el objeto completo basado en el ID seleccionado
      this.grupoAleatorioSgfSelected = this.sedesGrupoAleatorio.find(
        sede => sede.idGrupoAleatorio.toString() === idGrupoAleatorio.toString()
      );
    } else {
      this.grupoAleatorioSgfSelected = null;
    }
  }

  /****************/
  /*    SEDES     */
  /****************/

  /*****
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
   *****/
  /*****
  public getSedesGrupoAleatorio(): void {
    // Obtener información del cliente dinámicamente
    const clientInfo = this.getClientInfo();

    // Obtener el distrito seleccionado del formulario
    const selectedDistrict = this.form.get('district')?.value;
    const data = this.form.getRawValue();
    const ubigeo=data.department + data.province + data.district

    // Si no hay distrito seleccionado, no hacer la petición
    if (!ubigeo) {
      console.warn('No se puede obtener sedes: distrito no seleccionado');
      return;
    }

    const requestData = {
      "clienteIp": this.ip,
      "clienteBrowser": clientInfo.clienteBrowser,
      "clienteHttpUserAgent": clientInfo.clienteHttpUserAgent,
      "clienteTypeBrowser": clientInfo.clienteTypeBrowser,
      "clienteVersionBrowser": clientInfo.clienteVersionBrowser,
      "coVDptoGeografica": data.department,
      "coVProvGeografica": data.province,
      "coVDistGeografica": data.district,
      "ubigeo": ubigeo
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
          } else {
            this.showErrorModal(3);
          }
        },
        error: resp => {
          this.showErrorModal(3);
        }
      })
    );
  }
   *****/

  tokenService = inject(TokenService);


  public getSedesGrupoAleatorio(): void {
    // Obtener información del cliente dinámicamente




    const clientInfo = ClientInfoUtil.getClientInfo();

    // Obtener el distrito seleccionado del formulario
    const data = this.form.getRawValue();
    const ubigeo = data.department + data.province + data.district

    // Si no hay distrito seleccionado, no hacer la petición
    if (!ubigeo) {
      console.warn('No se puede obtener sedes: distrito no seleccionado');
      return;
    }

    const profile = this.tokenService.getItemValidateToken('personaNatural');

    const requestData = {
      // clienteIp: this.ip,
      clienteIp: this.ip ?? clientInfo.clienteIp,
      clienteUsuario: profile.dni ?? '',

      clienteBrowser: clientInfo.clienteBrowser,
      clienteHttpUserAgent: clientInfo.clienteHttpUserAgent,
      clienteTypeBrowser: clientInfo.clienteTypeBrowser,
      clienteVersionBrowser: clientInfo.clienteVersionBrowser,
      coVDptoGeografica: data.department,
      coVProvGeografica: data.province,
      coVDistGeografica: data.district,
      ubigeo: ubigeo
    };

    this.sedesGrupoAleatorio = [];

    this.suscriptions.push(
      this.mesaService.getSedesGrupoAleatorio(requestData).subscribe({
        next: resp => {
          if (!this.isHttpSuccess(resp)) {
            this.showErrorModal(3);
            return;
          }

          const codigoRespuesta = resp.data.codigo?.trim() ?? '';

          switch (codigoRespuesta) {
            case ConstanteSgf.SUCCESS:
              this.procesarSedes(resp.data.listaSedeGrpAleatorio);
              break;

            case ConstanteSgf.NO_DATA_EXISTS:
              this.handleNoDataResponse();
              break;

            default:
              this.handleOtherErrorCodes(codigoRespuesta);
              break;
          }
        },
        error: () => this.showErrorModal(3)
      })
    );
  }

  private isHttpSuccess(resp: any): boolean {
    return resp.codigo && resp.codigo === 200;
  }

  private procesarSedes(lista: any[]): void {
    if (lista && lista.length > 0) {
      this.sedesGrupoAleatorio = lista;

      if (lista.length === 1) {
        this.setGrupoUnico(lista[0].idGrupoAleatorio);
      } else {
        this.setGruposMultiples(lista);
      }
    } else {
      this.handleNoDataResponse();
    }
  }

  private setGrupoUnico(idGrupo: string): void {
    this.form.get('sedeGrupoAleatorio')?.setValue(idGrupo);
    this.isDisabledSedesGrupoAleatorio = true;
  }

  private setGruposMultiples(lista: any[]): void {
    this.sedesGrupoAleatorio.sort((x, y) => x.deSedeGeo.localeCompare(y.deSedeGeo));
    this.isDisabledSedesGrupoAleatorio = false;
    this.form.get('sedeGrupoAleatorio')?.enable();
  }


  private handleNoDataResponse(): void {
    // Resetear sedes y deshabilitar el dropdown
    this.sedesGrupoAleatorio = [];
    this.isDisabledSedesGrupoAleatorio = true;
    this.form.get('sedeGrupoAleatorio')?.disable();
    this.form.get('sedeGrupoAleatorio')?.setValue('');

    // Mostrar mensaje informativo (opcional)
    /*****this.messageService.add({
      severity: 'info',
      detail: 'No existen sedes referenciales disponibles para el distrito seleccionado'
    });*****/

    this.showErrorModal(4);
  }

  /**
   * Maneja otros códigos de error del servicio SGF
   */
  private handleOtherErrorCodes(codigoRespuesta: string): void {
    console.warn(`Código de respuesta SGF no válido: ${codigoRespuesta}`);

    // Resetear sedes
    this.sedesGrupoAleatorio = [];
    this.isDisabledSedesGrupoAleatorio = true;
    this.form.get('sedeGrupoAleatorio')?.disable();
    this.form.get('sedeGrupoAleatorio')?.setValue('');

    // Mostrar modal de error (case 3) con reintentos limitados
    if (this.countReintentos >= 2) {
      this.showErrorModal(2);
    } else {
      this.showErrorModal(1);
    }
    this.countReintentos++;
  }

  showErrorModal(errorType: number) {
    const ref = this.dialogService.open(ScenePlaceModalComponent, {
      showHeader: false,
      contentStyle: { 'max-width': '670px', padding: '0px' },
      data: {
        errorType: errorType
      }
    });

    ref?.onClose.subscribe((retry: boolean) => {
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
      if (this.currentMarker != null)
        return;

      this.place = this.buildPlace();

      this.geoService.searchPlace(this.place.join(', '))
        .pipe(debounceTime(1000))
        .subscribe(res => {

          if (Array.isArray(res)) {
            if (res.length == 0)
              return;

            const { lat, lon } = res[0]

            if (newFly) {
              this.map.flyTo([this.form.get('latitude').value, this.form.get('longitude').value], 17)
              this.coordsRegistered = false
              return
            }
            this.map.flyTo([lat, lon], 17)
          }

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
          grupoAleatorioSgfSelected: this.grupoAleatorioSgfSelected,
        },
        /*****grupoAleatorioSgfSelected: this.grupoAleatorioSgfSelected,*****/
        /*****grupoAleatorioSgfSelected: data.sedeGrupoAleatorio,*****/
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
