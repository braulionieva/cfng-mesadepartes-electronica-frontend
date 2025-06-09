import { FormGroup, ValidatorFn } from "@angular/forms";

export function EmailConfirmValidator(controlName: string, matchingControlName: string): ValidatorFn {
    return (formGroup: FormGroup): { [key: string]: any } | null => {

        const matchingControl = formGroup.controls[matchingControlName];
        if (controlName == '1') {
            matchingControl.setErrors({ noMatching: true });//second field
            return { noMatching: 'El código de verificación es incorrecto.' };//form
        } else if (controlName == '2') {
            matchingControl.setErrors({ noMatching: true });//second field
            return { noMatching: 'Código de verificación caducado.' };//form

        } else {
            matchingControl.setErrors(null);
            return null;
        }
    };
}