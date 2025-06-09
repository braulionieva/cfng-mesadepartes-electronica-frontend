import { ProfileRegistration } from "../personal-data/profile-registration";
import { ValidateIdentity } from "./validate-identity";

export interface ValidationToken {
    idPersona: string,
    customToken: string,
    expirationDate: string,
    isWithAbogado?: boolean,
    protectiveMeasure?: number,
    email?: string,
    typeProfile?: number,
    complaintId?: string,
    policeUnit?: string,
    judicialUni?: string,
    validateIdentity?: ValidateIdentity,
    registerProfile?: ProfileRegistration,

}

