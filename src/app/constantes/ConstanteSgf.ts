export class ConstanteSgf {

  // Códigos de respuesta del servicio SGF
  public static readonly SUCCESS = '0000';
  public static readonly LIMIT_EXCEEDED = '5102';
  public static readonly NO_DATA_EXISTS = '5200';
  public static readonly INVALID_VERIFICATION_CHARACTERS = '5004';
  public static readonly EMPTY_OR_NULL_REQUEST = '7001';
  public static readonly NULL_COMPANY_CODE = '7002';
  public static readonly COMPLETE_DATA_CORRECTLY = 'VA01';

  // Código especial para errores de conectividad (no viene del servicio SGF)
  public static readonly CONNECTIVITY_ERROR = 'CONN_ERROR_GA';

  // Método para obtener mensaje por código
  public static getMensajePorCodigo(codigo: string): string {
    switch (codigo) {
      case ConstanteSgf.SUCCESS:
        return 'Correcto';
      case ConstanteSgf.LIMIT_EXCEEDED:
        return 'Coincidencias superan el límite establecido de 300. Por favor redefina su búsqueda';
      case ConstanteSgf.NO_DATA_EXISTS:
        return 'No existen los datos solicitados';
      case ConstanteSgf.INVALID_VERIFICATION_CHARACTERS:
        return 'Caracteres de verificación incorrectos';
      case ConstanteSgf.EMPTY_OR_NULL_REQUEST:
        return 'Solicitud enviada vacío o nulo';
      case ConstanteSgf.NULL_COMPANY_CODE:
        return 'Código de empresa nulo';
      case ConstanteSgf.COMPLETE_DATA_CORRECTLY:
        return 'Complete los datos correctamente';
      case ConstanteSgf.CONNECTIVITY_ERROR:
        return 'Error de conectividad';
      default:
        return `Error desconocido: ${codigo}`;
    }
  }

  // Constructor privado para prevenir instanciación
  private constructor() {
    // Clase de utilidad, no instanciable
  }
}
