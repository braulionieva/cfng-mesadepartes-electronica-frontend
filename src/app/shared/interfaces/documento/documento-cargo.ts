import { RequestDocumento } from "./request-documento";

export interface DocumentoCargo{

    documento : RequestDocumento,
    folios: number,
    profile:string,
    especialidad:string,
    sumilla:string,
    remitente:string,
    tipoDocumento:string,
}