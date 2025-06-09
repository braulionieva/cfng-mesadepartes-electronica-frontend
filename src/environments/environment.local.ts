export const BASE_URL = '/mpe-ng';
export const IP_CONST = '201.240.68.38';

export const CREDENTIALS = {
    BASIC: 'OXNFOUJTOEVlT2ZCQUdWamlUYWJDTFFFUjQwYTpSOWhUcUNjTVpwQU9mQ0VUMnJaSkpqcVpCV1Fh',
    USERNAME: 'ms-dev',
    PASSWORD: 'ms-dev',
};

// export const DOMAIN_API_MANAGER = 'https://172.16.111.123:9443/';
export const DOMAIN_API_MANAGER = 'https://apimocha.com/apimanager/';
export const DOMAIN_MICROSERVICES = 'https://172.16.111.123:8243/';

export const ENDPOINTS_MICROSERVICES = {
    MS_MAESTROS: `http://172.16.111.128:8081/cfms-generales-maestro-gestion/cfe/maestros/v1/`,
    MS_PERSONA: `http://172.16.111.128:8081/ms-persona/`,
    MS_MESA: `http://localhost:8090/ms-mesadepartes/`,
    MS_SUNAT: `http://172.16.111.128:8081/ms-sunat/`,
    MS_DENUNCIA: `http://172.16.111.128:8081/ms-denuncia/`,
};

export const SYSTEM_CODE = '112';
export const SYSTEM_NAME = 'mesa';
export const PRODUCTION = false;
export const AUTOCOMPLETE = true;
export const ENV = 'dev';
export const CRYPT_KEY = 'hRJsl1&tA@87JBpr6!RjBrWY2ag9MG';
export const LOCALSTORAGE = {
    TOKEN_KEY: "dG9rZW4=",
    REFRESH_KEY: "cmVmcmVzaA==",
    VALIDATE_KEY: "dmFsaWRhdGlvbg==",
    PERSONA_KEY: "cGVyc29uYQ==",
    DENUNCIA_KEY: "ZGVudW5jaWE=",
    PRECARGO_KEY: "cHJlY2FyZ28=",
    NOMBRE_DOCUMENTO_KEY: "bm9tYnJlIGRvY3VtZW50bw=="
}

export const DOMAIN_API_IP = 'https://api.ipify.org/?format=json';
export const SECONDS_TO_PARCIAL_SEND = 30000;
export const SESSION_MINUTES = 0
export const VIEW_GENERATED_COMPLAINT_MINUTES = 5

export const FILE_DOMAINS = {
    //para registro d ddenuncia id 168 por defecto
    UPLOAD: (id = 676) => `http://172.16.111.128:8081/ms-mesa/repositorio/${id}`,
    DELETE: `http://172.16.111.128:8081/ms-mesa/repositorio/eliminar?url=`
}


export const FILE_DOMAINS_DOCUMENTOS = {
    UPLOAD: (id) => `http://172.16.111.128:8081/ms-mesa/documento/${id}/anexos`,
    DELETE: `http://172.16.111.128:8081/ms-mesa/repositorio/eliminar?url=`
}

export const SOURCES = {
    LOGO: "http://172.16.111.112:8081/repositorio/resources/publico/carpeta/plantilla/imagen/logoMinisterio.png",
    WATERMARK: "http://172.16.111.112:8081/repositorio/resources/publico/carpeta/plantilla/imagen/marcaAguaMinisterio.png"
}
