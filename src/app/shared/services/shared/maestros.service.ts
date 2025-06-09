import { Injectable } from '@angular/core';
import { DomainType } from '@shared/types/auth/domain-type';
import { Observable } from 'rxjs';
import { ApiBaseService } from '../global/api-base.service';

@Injectable({
	providedIn: 'root'
})
export class MaestrosService {
	private readonly maestrosKey: DomainType = 'maestros';
	constructor(private readonly apiBase: ApiBaseService) { }

	getConditions(): Observable<any> {
		return this.apiBase.get(this.maestrosKey, 'cftp/e/tabladescripcion/5');
	}

	getCatalogo(grupo: string): Observable<any> {
		return this.apiBase.get(this.maestrosKey, `cftm/e/catalogo/${grupo}`);

	}
	getBarAssociationList(): Observable<any> {
		return this.apiBase.get(this.maestrosKey, 'catalogo/grupo/colegioAbogados');
	}

	getProfiles(): Observable<any> {
		return this.apiBase.get(this.maestrosKey, 'cftm/e/tiposujeto');
	}

	getPoliceDepartment(): Observable<any> {
		return this.apiBase.get(this.maestrosKey, 'cftm/e/dependenciapolicial');
	}

	getJudicialDistrict(): Observable<any> {
		return this.apiBase.get(this.maestrosKey, 'cftm/e/distritojudicial');
	}

	getSpecialty(): Observable<any> {
		return this.apiBase.get(this.maestrosKey, 'cftm/e/especialidad');
	}

	getSpecialtyJud(): Observable<any> {
		return this.apiBase.get(this.maestrosKey, 'cftm/e/especialidadpjud');
	}

	getJudicialBodies(): Observable<any> {
		return this.apiBase.get(this.maestrosKey, 'cftm/e/organojudicial');
	}

	getJudicialDependencies(): Observable<any> {
		return this.apiBase.get(this.maestrosKey, 'cftm/e/dependenciapjudicial');
	}

	getDepartments(): Observable<any> {
		return this.apiBase.get(this.maestrosKey, 'cftm/e/reniec/dptogeografica');
	}

	getProvinces(codigoDepartamento: string): Observable<any> {
		return this.apiBase.get(this.maestrosKey, `cftm/e/reniec/provgeografica/${codigoDepartamento}`);
	}

	getDistricts(codigoDepartamento: string, provinceId: string): Observable<any> {
		return this.apiBase.get(this.maestrosKey, `cftm/e/reniec/distgeografica/${codigoDepartamento}/${provinceId}`);
	}

	getRoads(): Observable<any> {
		return this.apiBase.get(this.maestrosKey, 'cftm/e/tipovia');
	}

	getSites(): Observable<any> {
		return this.apiBase.get(this.maestrosKey, 'mptm/e/tipolugar');
	}

	getAllDepartments(): Observable<any> {
		return this.apiBase.get(this.maestrosKey, 'cftm/e/reniec/dptogeografica');
	}

	getAllProvinces(codigoDepartamento: string): Observable<any> {
		return this.apiBase.get(this.maestrosKey, `cftm/e/reniec/provgeografica/${codigoDepartamento}`);
	}

	getAllDistricts(codigoDepartamento: string, provinceId: string): Observable<any> {
		return this.apiBase.get(this.maestrosKey, `cftm/e/reniec/distgeografica/${codigoDepartamento}/${provinceId}`);
	}

	// getDocumentTypes(): Observable<any> {
	// 	//  cftm/e/persona/tipopersona/1/0
	// 	return this.apiBase.get(this.maestrosKey, `cftm/e/tipodocidentidad`);
	// }

	getDocumentTypes(nacionalidad: number): Observable<any> {
		//  cftm/e/persona/tipopersona/1/0
		return this.apiBase.get(this.maestrosKey, `cftm/e/persona/tipopersona/1/${nacionalidad}`);
	}

	getEtapa(tipo: number, proceso: string): Observable<any> {
		return this.apiBase.get(this.maestrosKey, `eftm/e/etapas/${tipo}/${proceso}`);
	}

	getCaseDocumentTypes(): Observable<any> {
		return this.apiBase.get(this.maestrosKey, `eftm/e/tipodocumentoTodos`);
	}

	getRiskTypes(): Observable<any> {
		return this.apiBase.get(this.maestrosKey, `mptm/e/tiporiesgo`);
	}

	getPersonTypes(): Observable<any> {
		return this.apiBase.get(this.maestrosKey, `cftm/e/tipopersona`);
	}

	getViolenceTypes(): Observable<any> {
		return this.apiBase.get(this.maestrosKey, `mptm/e/tipoviolencia`);
	}

	getMaritalStatus(): Observable<any> {
		return this.apiBase.get(this.maestrosKey, `cftm/e/estadocivil`);
	}

	getActivityLaboral(): Observable<any> {
		return this.apiBase.get(this.maestrosKey, `cftm/e/actividadLaboral`);
	}

	getNationalities(): Observable<any> {
		return this.apiBase.get(this.maestrosKey, `cftm/e/nacionalidad`);
	}

	getEducationalLevel(): Observable<any> {
		return this.apiBase.get(this.maestrosKey, `cftm/e/gradoinstruccion`);
	}

	getIndigenousVillage(): Observable<any> {
		return this.apiBase.get(this.maestrosKey, `cftm/e/tipopueblo`);
	}

	getNativeLanguages(): Observable<any> {
		return this.apiBase.get(this.maestrosKey, `cftm/e/tipolengua`);
	}

	getCrimes(): Observable<any> {
		return this.apiBase.get(this.maestrosKey, `cftm/e/delitosubgenericosgf`);
	}

	getCrimesLimit(page: number, perPage: number): Observable<any> {
		return this.apiBase.get(this.maestrosKey, `cftm/e/delito/subgenerico/especificolimit?page=${page}&perPage=${perPage}`);
	}

	getJuzgados(coUbigeo: string): Observable<any> {
		return this.apiBase.get(this.maestrosKey, `cftm/e/juzgados/ubigeo/${coUbigeo}`);
	}

  getDependenciasPoliciales(coUbigeo: string): Observable<any> {
    return this.apiBase.get(this.maestrosKey, `cftm/e/dependenciapolicial/ubigeo/${coUbigeo}`);
  }

}

