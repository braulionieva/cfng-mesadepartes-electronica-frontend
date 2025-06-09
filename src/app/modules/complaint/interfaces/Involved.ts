export interface Involved {
  id: string;
  involvedRol: string;
  personType?: number;
  documentType?: number;
  documentNumber?: string;
  names?: string;
  fatherLastName?: string;
  motherLastName?: string;
  alias?: string;

  gender?: string;
  bornDate?: Date | null;
  age?: string;
  idEducationalLevel?: number;
  educationalLevel?: string;
  maritalStatus?: number;
  nationality?: number;
  department?: string;
  province?: string;
  district?: string;
  address?: string;

  phone?: string;
  email?: string;
  secondaryPhone?: string;
  secondaryEmail?: string;

  aggrievedPhone?: string;
  aggrievedEmail?: string;

  ocupation?: string;
  disability?: string;
  lgtbiq?: string;
  indigenousVillage?: number;
  nativeLanguage?: number;
  translator?: boolean;
  rucOption?: boolean;
  privateLibertad?: string;
  vih?: string;
  advocate?: string;
  worker?: string;
  migrant?: string;
  victim?: string;
  server?: string;
  afroperuvian?: string;
  entityType?: number;
  ruc?: string;
  businessName?: string;
  legalRepresentative?: string;
  procuratorOffice?: number;
  procuratorDNI?: string;
  procuratorName?: string;
  cem?: number;
  entityName?: string;

  validated?: boolean;
  tipoDireccion?: number;
  foto?: string;

  esMayorEdad?: boolean

  otrosDetalleProfesionOficio?: string;




  origen?: number
  pais?: number



}
