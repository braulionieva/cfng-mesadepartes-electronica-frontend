import { Archivo } from "./archivo";
import { Item } from "./item";

export interface RequestDocumento{
    idTipoDocumento:number,
	otroTipo:string,
    asunto:string,
    otroDocumento:string,
    observacionAnexo:string,
    esAbogado:boolean,
    codigoCal:string,
    despacho: Item,
    fiscalia: Item,
    distritoFiscal: Item,
    anyoRegistro:number,
    dependencia:number,
    medidasProteccion:boolean,
    numeroCaso:number,
    numeroInformePolicial:number,
    colegioAbogado: Item,
    numeroDocumento:string,
	archivo: Archivo[];
}
