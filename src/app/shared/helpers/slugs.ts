import { EntityType } from "./dataType";

export const SLUG_CATALOGO = Object.freeze({

  DOCUMENTO: 210,
  ESCRIT0: 2

})

export const SLUG_VERIFICADO = Object.freeze({
  SI: '1',
  NO: '0'
})

export const SLUG_EXTENSION_ARCHIVO = Object.freeze({
  PDF: 438,
  WORD: 436
})

export const TIPO_ACCION_ESTADO = Object.freeze({
  REGISTRA_DOCUMENTO_DESPACHO: 64,
  REGISTRA_DOCUMENTO_ELECTRONICA: 65,
})

export const SLUG_ORIGEN = Object.freeze({

  MPE: 1,
  MUP: 2

})
export const SLUG_TYPE_TRAMITE = Object.freeze({

  NEW: 481,
  OBSERVED: 482

})
export const SLUG_TYPE_INGRESO = Object.freeze({

  NEW: 481,
  OBSERVED: 482

})
export const SLUG_PROFILE = Object.freeze({
  CITIZEN: 1,
  PNP: 2,
  PJ: 4,
  ENTITY: 3
})

export function getProfile(id: any) {
  switch (id) {
    case SLUG_PROFILE.CITIZEN === id:
      return "CIUDADANO"
    case SLUG_PROFILE.PNP === id:
      return "PNP"
    case SLUG_PROFILE.PJ === id:
      return "PJ"
    case SLUG_PROFILE.ENTITY === id:
      return "ENTIDAD"
    default:
      return "CIUDADANO";
  }
}

export const SLUG_ENTITY = Object.freeze({
  JURIDICA: 175 as EntityType,
  PROCURADURIA: 173 as EntityType,
  CEM: 174 as EntityType
})

export const SLUG_PENDING_RESPONSE = Object.freeze({
  NEW: 'E',
  CONTINUE: 'C',
})

export const SLUG_CONFIRM_RESPONSE = Object.freeze({
  OK: 'OK',
  CANCEL: 'CANCEL',
})

export const SLUG_INVOLVED = Object.freeze({
  AGRAVIADO: 'agraviado',
  DENUNCIADO: 'denunciado',
  DENUNCIANTE: 'denunciante'
})

export const SLUG_INVOLVED_ROL = Object.freeze({
  CONOCIDO: 'conocido',
  DESCONOCIDO: 'desconocido',
  // DENUNCIANTE: 'denunciante',
  // OTRO: 'otro',
  ENTIDAD: 'entidad',
  PERSONAN_NATURAL: 'persona-natural'
})

export const SLUG_DOCUMENT_TYPE = Object.freeze({
  DNI: 1,
  RUC: 2,
  SIN_DOCUMENTO: 3,
})
export const SLUG_DOCUMENT = Object.freeze({
  DNI: 'DNI',
})
export const SLUG_PERSON_TYPE = Object.freeze({
  NATURAL: 1,
  JURIDICA: 2,
  ENTIDAD: 8,
  LQRR: 9,
  ESTADO: 348,
})

export const SLUG_OTHER = Object.freeze({
  CEM: 9999,
  PROCURADURIA: 9999,
})

export const SLUG_MAX_LENGTH = Object.freeze({
  DNI: 8,
  RUC: 11,
  CELLPHONE: 9,
  CODEVERIFICATION: 6,
  OTHER: 15,
})

export const NRO_DOCUMENTO = Object.freeze({
  POR_ASINAR: 'POR ASIGNAR'
})

export const ACCION_VISUALIZAR_DOCUMENTO = Object.freeze({
  ACCION_VISUALIZAR: 1,
  ACCION_REGISTRAR: 2,
})

export const NOMBRE_CARGO_DENUNCIA = Object.freeze({
  NOMBRE: 'CARGO DE INGRESO DE DENUNCIA',
  ESPACIO: ' ',
  EXTENSION: '.pdf',
})

