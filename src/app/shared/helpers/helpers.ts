import { FormControl, FormGroup, ValidatorFn, Validators } from "@angular/forms";

//#region "FUNCIONES DE AYUDA"
/**
 * Clase con funciones estáticas de ayuda para operaciones comunes.
 */
export class Helpers {

    /**
     * Valida si una cadena tiene un valor válido.
     * 
     * Esta función verifica si un valor no es `null`, `undefined` y en caso de ser una cadena, si no está vacía ni contiene solo espacios en blanco.
     * 
     * @param valor - El valor a validar.
     * @returns `true` si el valor tiene un valor válido, `false` en caso contrario.
     */
    static readonly esStringVacio = (valor: any): boolean => {
        return (valor !== null && valor !== undefined && (typeof valor !== 'string' || valor.trim().length > 0));
    }

    /**
     * Intenta convertir una cadena JSON a un objeto JavaScript.
     * 
     * Si la conversión falla, la función captura el error y muestra un mensaje de advertencia en la consola.
     * 
     * @param json - La cadena JSON a convertir.
     * @returns El objeto JavaScript resultante si la conversión fue exitosa o la cadena original si hubo un error.
     */
    static readonly parseJson = (json: any) => {
        try {
            json = JSON.parse(json);
        }
        catch (e) {
            console.warn('No es un json');
        }

        return json;
    }

    /**
     * Convierte una cadena de texto en formato `dd/mm/yyyy` a un objeto `Date`.
     * 
     * La función espera que la cadena de entrada esté en el formato `día/mes/año` (por ejemplo: `12/03/2025`).
     * 
     * @param dateString - La cadena con la fecha en formato `dd/mm/yyyy`.
     * @returns Un objeto `Date` correspondiente a la fecha indicada.
     */
    static readonly stringToDate = (dateString: string) => {
        const [day, month, year] = dateString.split('/').map(Number);

        return new Date(year, month - 1, day); // mes - 1 porque los meses en JavaScript son indexados desde 0
    }

    /**
     * Obtiene los errores de validación de un `FormGroup` de Angular.
     * 
     * La función recorre todos los controles de un formulario y devuelve un objeto con los errores de cada control.
     * 
     * @param formGroup - El `FormGroup` que contiene los controles a validar.
     * @returns Un objeto que contiene los errores de validación de cada control.
     */
    static readonly obtenerErroresYValoresDeValidacion = (formGroup: FormGroup, mostrarTodos: boolean = false): void => {
        const resultado: { nombreControl: string, valor: any, errores: string | null, touched: boolean, dirty: boolean, valid: boolean }[] = [];

        // Recorre todos los controles del FormGroup
        Object.keys(formGroup.controls).forEach((nombreControl) => {
            const control = formGroup.get(nombreControl) as FormControl;

            // Verifica si el control tiene errores o si debe mostrar todos los controles
            const tieneErrores = control?.errors;
            const valor = control?.value;

            // Si tiene errores, convertimos el objeto en una cadena legible
            let erroresString = null;

            if (tieneErrores) {
                // Convertimos el objeto de errores a un formato más sencillo para mostrar
                // erroresString = Object.keys(tieneErrores)
                //     .map(key => `${key}: ${tieneErrores[key]}`)
                //     .join(', ');

                erroresString = JSON.stringify(tieneErrores);
            }

            // Obtiene los estados del control
            const touched = control?.touched ?? false;
            const dirty = control?.dirty ?? false;
            const valid = control?.valid ?? false;

            // Si se solicita mostrar todos los controles o el control tiene errores, lo añadimos
            if (mostrarTodos || tieneErrores) {
                resultado.push({
                    nombreControl,
                    valor,
                    errores: erroresString,
                    touched,
                    dirty,
                    valid
                });
            }
        });

        // Muestra los datos obtenidos en la consola en formato tabla
        console.table(resultado);
    };

    /**
     * Devuelve un valor seguro, manejando casos donde el valor es `undefined`, `null`, vacío o inválido.
     * 
     * Si el valor es `undefined` o `null`, la función retorna un valor predeterminado basado en el tipo de dato:
     * - Si el valor es de tipo `number`, retorna `-1`.
     * - Si el valor es de tipo `string` y está vacío, contiene solo espacios en blanco, caracteres especiales, o solo números y comas/puntos, retorna una cadena vacía.
     * - Si el valor es `NaN`, retorna `-1` (o cualquier otro valor predeterminado de tu preferencia).
     * - Si el valor es un objeto o arreglo vacío, también retorna un valor predeterminado.
     * - Si el valor es un `boolean` con valor `false`, lo considera como vacío.
     * - Si el valor es una fecha inválida, retorna una cadena vacía o cualquier otro valor predeterminado.
     * 
     * @param value - El valor a validar.
     * @returns El valor original si no es `undefined`, `null` ni vacío, o un valor predeterminado si es necesario.
     */
    static readonly getSafeValue = <T>(value: T | undefined): T => {
        // Caso 1: Cadenas vacías, solo espacios, o caracteres especiales
        if (typeof value === 'string' && value.trim() === '') {
            return '' as T;
        }

        // Caso 2: NaN (Not-a-Number) en tipo número
        if (typeof value === 'number' && isNaN(value)) {
            return -1 as T;
        }

        // Caso 3: Objetos vacíos o arreglos vacíos
        if ((Array.isArray(value) && value.length === 0) || (typeof value === 'object' && value !== null && Object.keys(value).length === 0)) {
            return '' as T; // O un valor adecuado para tu caso
        }

        // Caso 4: Fechas inválidas
        if (value instanceof Date && isNaN(value.getTime())) {
            return '' as T; // O un valor adecuado para tu caso
        }

        // Caso 5: Booleano `false`
        if (typeof value === 'boolean' && value === false) {
            return '' as T; // O un valor adecuado para tu caso
        }

        // Valor por defecto si es `undefined` o `null`
        return value ?? (typeof value === 'number' ? -1 : '') as T;
    };

    static readonly fnAgregarValidacion = (form: FormGroup | null, controlName: string, validator: ValidatorFn | ValidatorFn[]) => {
        const control = form?.controls[controlName];

        if (control) {
            control.addValidators(validator);
            control.updateValueAndValidity();
        }
    }

    static readonly fnLimpiarValidacion = (form: FormGroup | null, controlNames: string | string[]) => {
        const limpiarControl = (controlName: string) => {
            const control = form?.controls[controlName];
            if (control) {
                control.clearValidators();
                control.updateValueAndValidity();
            }
        };

        if (Array.isArray(controlNames)) {
            controlNames.forEach(limpiarControl);
        } else {
            limpiarControl(controlNames);
        }
    }
        ;
    static readonly fnValidacionesTipoDocumento = (formGroup: FormGroup, event: any, formName: string) => {
        let validacionDocumento: IValidacionDocumento = { id: 15, min: 0, max: 0, tipo: 'alfaNumerico' };

        const documentos: IValidacionDocumento[] = [
            { id: 1, nombre: 'DNI', min: 8, max: 8, tipo: 'numero' },
            { id: 2, nombre: 'RUC', min: 11, max: 11, tipo: 'numero' },
            { id: 3, nombre: 'Sin Documento - Nacional', min: 0, max: 0, tipo: '' },
            { id: 4, nombre: 'Pasaporte', min: 7, max: 12, tipo: 'alfaNumerico' },
            { id: 5, nombre: 'Carnet de Extranjería', min: 12, max: 12, tipo: 'numero' },
            { id: 6, nombre: 'Carné Temporal Migratorio CTM', min: 9, max: 9, tipo: 'numero' },
            { id: 7, nombre: 'Libreta Electoral', min: 8, max: 8, tipo: 'numero' },
            { id: 8, nombre: 'Partida de Nacimiento', min: 6, max: 15, tipo: 'numero' },
            { id: 9, nombre: 'Carne Identidad', min: 9, max: 9, tipo: 'numero' },
            { id: 11, nombre: 'Libreta Militar', min: 5, max: 12, tipo: 'alfaNumerico' },
            { id: 13, nombre: 'Carne de solicitud de refugio', min: 9, max: 9, tipo: 'numero' },
            { id: 14, nombre: 'Permiso Temporal de Permanencia PTP', min: 9, max: 9, tipo: 'numero' },
            { id: 15, nombre: 'Sin Documento - Extranjero', min: 0, max: 0, tipo: '' }
        ];

        const tipoDocumento = event.value.id ?? event.value;
        const foundDocumento = documentos.find(x => x.id == tipoDocumento);

        if (foundDocumento)
            validacionDocumento = { ...foundDocumento };

        Helpers.fnLimpiarValidacion(formGroup, formName);

        Helpers.fnAgregarValidacion(formGroup, formName, [
            Validators.required,
            Validators.minLength(validacionDocumento.min),
            Validators.maxLength(validacionDocumento.max)
        ]);

        if (validacionDocumento.tipo == 'numero') {
            const onlyNumbersPattern = /^\d+$/;
            Helpers.fnAgregarValidacion(formGroup, formName, Validators.pattern(onlyNumbersPattern));
        }

        else if (validacionDocumento.tipo == 'alfaNumerico') {
            const alphanumericPattern = /^[a-zA-Z0-9]+$/;
            Helpers.fnAgregarValidacion(formGroup, formName, Validators.pattern(alphanumericPattern));
        }

        formGroup.controls[formName].enable();

        if (validacionDocumento.min == 0)
            formGroup.controls[formName].disable();

        formGroup.controls[formName].reset();

        return validacionDocumento;
    }
}

export interface IValidacionDocumento {
    id: number;
    nombre?: string;
    min: number;
    max: number;
    tipo: 'texto' | 'numero' | 'alfaNumerico' | '';
}
//#endregion
