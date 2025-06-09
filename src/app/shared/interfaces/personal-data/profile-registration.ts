import { ValidateActionType } from "@shared/types/verification/validate-action-type";

export interface ProfileRegistration{
    accion: ValidateActionType,
    id?: string,
    idDenuncia?: string,
    idTipoPerfil: number,
    numeroCelular: string,
    correoElectronico: string,
    esOtros: number,
    otraDependencia: string,
    esMedidaProteccion: number,
}
