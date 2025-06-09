export const getMessages = (validatorName: string): string => {
  let messages: any = {
    required: 'Campo requerido',
    requiredEspecialidad: 'Debe seleccionar una especialidad',
    requiredDelito: 'Debe seleccionar un delito',
    invalidEmailAddress: 'Correo electrónico inválido',
    invalidNumber: `Campo debe ser numérico`,
    adultRequired: 'Debe ser mayor de edad',
    dniInvalid: 'DNI inválido'
  };
  return messages[validatorName];
}

function isInvalid(isSubmitted, control) {
  return control.invalid && (control.dirty || control.touched || isSubmitted);
}

export default {
  getMessages,
  isInvalid,
};
