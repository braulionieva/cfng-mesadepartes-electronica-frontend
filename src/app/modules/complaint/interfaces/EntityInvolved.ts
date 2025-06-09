export interface EntityInvolved {
  id: string;
  involvedRol: string;
  entityType?: string;
  //pesona juridica
  ruc?: string;
  razonSocial?: string;
  representanteLegal?: string;
  //procuraduria
  procuraduria?: string;
  dniProcurador?: string;
  nombreProcurador?: string;
  //CEM
  cem?: string;
}

export interface Prefills {
  ruc?: string;
  businessName?: string;
  documentType?: number;           // o el tipo que corresponda
  procuratorDNI?: string;
  procuratorName?: string;
  procuradorApellidoPaterno?: string;
  procuradorApellidoMaterno?: string;
}
