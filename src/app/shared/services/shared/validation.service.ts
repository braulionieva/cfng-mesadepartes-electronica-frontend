import { Injectable } from '@angular/core';
import { DomainType } from '@shared/types/auth/domain-type';
import { ApiBaseService } from '../global/api-base.service';
import { Observable } from 'rxjs';
import { ReniecValidation } from '@shared/interfaces/validation/ValidationReniec';
import { ValidationSunat } from '@shared/interfaces/validation/ValidationSunat';

@Injectable({
	providedIn: 'root'
})
export class ValidationService {

	private readonly personaKey: DomainType = 'persona';

	constructor(private readonly apiBase: ApiBaseService) { }

	getPadronSunatPorRuc(ruc: string): Observable<any> {
		return this.apiBase.get(this.personaKey, `e/padronsunat/${ruc}`);
	}

	getPadronSunatPorRazon(body: ValidationSunat): Observable<any> {
		return this.apiBase.post(this.personaKey, `e/padronsunat/`, body);
	}

	validateReniec(body: ReniecValidation): Observable<any> {
		return this.apiBase.post(this.personaKey, `e/personanatural/persona/validarPersona`, body);
	}

	getConditions(): Observable<any> {
		return this.apiBase.get(this.personaKey, 'e/condiciones');
	}
}

