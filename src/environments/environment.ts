export const BASE_URL = '/mpe-ng';
export const IP_CONST = '201.240.68.38';

export const CREDENTIALS = {
  BASIC:
    'OXNFOUJTOEVlT2ZCQUdWamlUYWJDTFFFUjQwYTpSOWhUcUNjTVpwQU9mQ0VUMnJaSkpqcVpCV1Fh',
  USERNAME: 'ms-dev',
  PASSWORD: 'ms-dev',

};

export const DOMAIN_API_MANAGER = 'https://172.16.111.123:9443/';
export const DOMAIN_MICROSERVICES = 'https://172.16.111.123:8243/';

export const ENDPOINTS_MICROSERVICES = {
  MS_MAESTROS: `${DOMAIN_MICROSERVICES}ms-maestros-dev/v1/`,
  MS_PERSONA: `${DOMAIN_MICROSERVICES}ms-persona-dev/v1/`,
  MS_MESA: `${DOMAIN_MICROSERVICES}ms-mesa-dev/v1/`,
  MS_DOCUMENTO: `http://localhost:8095/ms-mesadepartes/`,
  MS_SUNAT: `${DOMAIN_MICROSERVICES}ms-sunat-dev/v1/`,
  MS_DENUNCIA: `${DOMAIN_MICROSERVICES}ms-denuncia-dev/v1/`,
  MS_REPOSITORIO: `http://cfms-generales-almacenamiento-objetos-api-development.apps.dev.ocp4.cfe.mpfn.gob.pe/cfe/generales/objetos/v2/t/almacenamiento/publico/`,
};

export const SYSTEM_CODE = '112';
export const SYSTEM_NAME = 'notificaciones';
export const AUTOCOMPLETE = false;
export const CRYPT_KEY = 'a1b2c3z28';
export const LOCALSTORAGE = {
  TOKEN_KEY: 'dG9rZW4=',
  REFRESH_KEY: 'cmVmcmVzaA==',
  VALIDATE_KEY: 'dmFsaWRhdGlvbg==',
  PERSONA_KEY: 'cGVyc29uYQ==',
  DENUNCIA_KEY: 'ZGVudW5jaWE=',
  PRECARGO_KEY: 'cHJlY2FyZ28=',
  NOMBRE_DOCUMENTO_KEY: 'bm9tYnJlIGRvY3VtZW50bw==',
};


export const SESSION_MINUTES = 0;
export const VIEW_GENERATED_COMPLAINT_MINUTES = 5;


export const SOURCES = {
  LOGO: 'http://172.16.111.112:8081/repositorio/resources/publico/carpeta/plantilla/imagen/logoMinisterio.png',
  WATERMARK:
    'http://172.16.111.112:8081/repositorio/resources/publico/carpeta/plantilla/imagen/marcaAguaMinisterio.png',
};



