import { VerificationType } from "@shared/types/verification/verification-type";

export interface ValidateIdentity {
  //idTipoDocumento: number,
  numeroDni: string,
  fechaNacimiento: string,
  fechaEmision?: string,
  digitoVerificacion?: string,
  nombrePadre?: string,
  nombreMadre?: string,
  ubigeoNacimiento?: string,
  campoValidacion: VerificationType,
  ip: string,
  usuarioConsulta: string,
  idTablaDescripcion: string
}