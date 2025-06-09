import { Injectable } from '@angular/core';
import {getValidString} from "@shared/utils/utils";
import {SLUG_ENTITY} from "@shared/helpers/slugs";

@Injectable({
  providedIn: 'root'
})
export class ComplaintPayloadBuilderService {

  /** Convierte el array de ficheros al formato esperado */
  formatFiles(files: any[]): any[] {
    return files.map(f => ({
      tipoArchivo:      f.tipoArchivo,
      nodeId:           f.nodeId,
      numeroFolios:     f.numeroFolios,
      idTipoCopia:      null,
      numeroDocumento:  null,
      nombreOriginal:   f.nombreOriginal,
      tamanyo:          f.tamanyo
    }));
  }

  buildEntidadPayload(data: any, anexos: any[]): any {
    return {
      idTipoEntidad:    Number(data.entityType),
      idProcuradoria:   data.procuratorOffice   ?? null,
      idCentroEmergencia: data.cem              ?? null,
      ruc:              data.ruc                ?? null,
      nombreEntidad:    this.computeNombreEntidad(data),
      razonSocial:      data.businessName       ?? null,
      representanteLegal: null,
      procurador:       this.buildProcurador(data),
      direccion:        this.buildDireccion(data),
      archivoPerfil: {
        docRepresentacionTipo:  data.docRepresentacionTipo,
        docRepresentacionNumero: data.docRepresentacionNumero,
        anexos
      }
    };
  }


  /** Crea el objeto procurador o devuelve null */
  private buildProcurador(data: any): any | null {
    const hasProc = data.procuratorDNI || data.procuratorName;
    if (!hasProc) return null;

    return {
      origen:        data.origen             ?? null,
      pais:          data.pais               ?? null,
      documentType:  data.documentType       ?? null,
      dni:           data.procuratorDNI      ?? null,
      nombre:        getValidString(data.procuratorName),
      apellidoPaterno: getValidString(data.procuradorApellidoPaterno),
      apellidoMaterno: getValidString(data.procuradorApellidoMaterno)
    };
  }

  /** Crea el objeto dirección o devuelve null */
  private buildDireccion(data: any): any | null {
    if (!(data.district ?? data.address)) return null;
    return {
      ubigeo:    data.district  ?? null,
      direccion: data.address   ?? null
    };
  }

  /** Lógica para nombreEntidad simplificada */
  private computeNombreEntidad(data: any): string | null {
    if (data.entityType !== SLUG_ENTITY.JURIDICA) {
      return data.entityType === SLUG_ENTITY.PROCURADURIA
        ? data.entityType
        : null;
    }
    return null;
  }


}
