export interface Denuncia {
  id: string; //id Denuncia
  numeroInformePolicial: string;
  fechaPolicial: string;
  codigoCip: string;
  nroExpediente: string;
  medidaProteccion: MedidaProteccion | null;
  entidad: Entidad | null;
  lugarHecho: LugarHecho | null;
  delito: Delito;
  partesDenunciantes: Involucrado;
  partesAgraviadas: Involucrado;
  partesDenunciadas: Involucrado;
  anexosAsociados: AnexosAsociados;
  force?: boolean;
  totalPaginas: number;
  idPerfil: number;
  duplicada?: number;
  denunciaPreviaRegistrada?: number;
  archivoPerfil?: AnexosAsociados;
  juzgado?: Juzgado;
  policia?: Policia;
}

// Medida Proteccion

export interface MedidaProteccion {
  idTipoRiesgo: number;
  tipoRiesgo: string;
  idsTipoViolencia: number[];
  tiposViolencia: string[];
  anexosAsociados: AnexosAsociados;
}

// Entidad

export interface Entidad {
  idTipoEntidad: number;
  idProcuradoria: number;
  idCentroEmergencia: number;
  ruc: string;
  nombreEntidad: string;
  razonSocial: string;
  representanteLegal: string;
  procurador: Procurador;
  direccion: Domicilio;
  archivoPerfil: AnexosAsociados;
  totalPaginas: number;
  force?: boolean;
}

export interface Procurador {
  origen: string,
  pais: string,
  tipoDocumento: string,
  dni: string,
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
}

// Lugar del Hecho

export interface LugarHecho {
  ubigeo: string;
  fechaHecho: string;
  horaHecho: string;
  longitud: number;
  latitud: number;
  direccion: string;
}

// Delito

export interface Delito {
  hecho: string;
  idEspecialidad: number;
  especialidad: string;
  idDelito: number;
  idDelitoSubgenerico: number;
  idDelitoEspecifico: number;
  delito: string;
  descripcion: string;

}

// Involucrado

export interface Involucrado {
  lqrr?: Lqrr;
  entidad?: EntidadInvolucrada[];
  persona?: Persona[];
}

export interface Lqrr {
  id: string;
}

export interface EntidadInvolucrada {
  id: string;
  idTipoEntidad: number;
  idProcuradoria?: number;
  idCentroEmergencia?: number;
  ruc?: string;
  nombreEntidad?: string;
  razonSocial?: string;
  representanteLegal?: string;
  procurador?: Procurador;
  validado: number;
  correoInstitucion: string;
  nuTelefonoEntidad: string;
}


export interface Persona {
  id: string;
  idTipoPersona: number;
  idTipoDocumento: number;
  numeroDocumento: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  sexo?: string;
  fechaNacimiento?: string;
  edad?: number;
  idGradoInstruccion?: number;
  gradoInstruccion?: string;
  idTipoEstadoCivil?: number;
  idNacionalidad?: number;
  validado: number;
  flCExtranjero: number;
  lugarNacimiento?: string;
  domicilio?: Domicilio;
  direccion?: Direccion[];
  contacto?: Contacto;
  otrosDatos?: OtrosDatos;
  foto?: string;
  esMayorEdad?: boolean;
}

export interface Domicilio {
  ubigeo?: string;
  direccion?: string;
}

export interface Direccion {
  tipoDireccion?: number;
  ubigeo?: string;
  idUbigeoPueblo?: string;
  tipoVia?: string;
  direccionResidencia?: string;
  numeroResidencia?: number;
  codigoPrefijoUrbanizacion?: number;
  descripcionPrefijoDpto?: string;
  nombreUrbanizacion?: string;
  descripcionBloque?: string;
  descripcionInterior?: string;
  descripcionPrefijoBloque?: string;
  descripcionEtapa?: string;
  descripcionManzana?: string;
  descripcionLote?: string;
  descripcionReferencia?: string;
  latitud?: string;
  longitud?: string;
  direccionCompleta?: string;
}

export interface Contacto {
  celularPrincipal?: string;
  correoPrincipal?: string;
  celularSecundario?: string;
  correoSecundario?: string;
}

export interface OtrosDatos {
  ocupacion?: string;
  idTipoDiscapacidad?: string;
  puebloIndigena?: number;
  idLenguaMaterna?: number;
  esRequiereTraductor?: number;
  afroperuvian?: string;
  disability?: string;
  privateLibertad?: string;
  vih?: string;
  worker?: string;
  lgtbiq?: string;
  advocate?: string;
  migrant?: string;
  victim?: string;
  server?: string;
  otrosDetalleProfesionOficio?: string;
}

// Anexos

export interface AnexosAsociados {
  observacion?: string;
  anexos?: Anexos[];
}

export interface Anexos {
  id: string,
  idDocumento: number,
  pagina: number,
  tamayo: number,
  tamanyo: number,
  url: string,
  numeroFolios: number,
  file: File,
}

export interface DatosGeneralesPJPNP {
  numeroInformePolicial: string,
  codigoCip: string,
  nroExpediente: string,
  fechaPolicial: string;
  medidaProteccion: MedidaProteccion | null,
}

export interface Juzgado {
  coEntidad: string,
  descEntidad: string,
  fechaDenuncia: string
  ubigeo: string
}

export interface Policia {
  numeroInformePolicial: string,
  codigoCip: string,
  nroExpediente: string,
  ubigeo: string,
  dependenciaPolicial: string,
  descDependenciaPolicial: string,
  anexoComisaria: string,
  numeroPartePolicial: string
}
