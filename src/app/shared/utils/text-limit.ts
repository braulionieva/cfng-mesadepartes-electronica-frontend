import { AbstractControl } from '@angular/forms'

export function handleTextInput(
  event: Event,
  formControlName: string,
  form: any,
  limite: number
): void {
  const textarea = event.target as HTMLTextAreaElement
  const textoOriginal = textarea.value

  const cantidadNoBlancos = textoOriginal.length

  const control = form.get(formControlName)
  if (!control) return

  if (cantidadNoBlancos <= limite) {
    control.setValue(textoOriginal, { emitEvent: false })
    return
  }

  let exceso = cantidadNoBlancos - limite
  const caracteres = Array.from(textoOriginal)

  for (let i = caracteres.length - 1; i >= 0 && exceso > 0; i--) {
    if (!/\s/.test(caracteres[i])) {
      caracteres.splice(i, 1)
      exceso--
    }
  }

  const textoRecortado = caracteres.join('')
  textarea.value = textoRecortado
  control.setValue(textoRecortado.trim(), { emitEvent: false })
}

export function handleTextPaste(
  event: ClipboardEvent,
  formControlName: string,
  form: any,
  limite: number
): void {
  event.preventDefault()

  const clipboardData = event.clipboardData
  if (!clipboardData) return

  const textoPegado = clipboardData.getData('text')
  const control = form.get(formControlName)
  if (!control) return

  const textoActual = control.value ?? ''
  const noBlancosActual = textoActual.length
  const espacioDisponible = limite - noBlancosActual

  if (espacioDisponible <= 0) return

  let exceso = textoPegado.length - espacioDisponible
  if (exceso <= 0) {
    insertarTextoEnCursor(textoPegado, control, formControlName)
    return
  }

  const caracteres = Array.from(textoPegado)
  for (let i = caracteres.length - 1; i >= 0 && exceso > 0; i--) {
    if (!/\s/.test(caracteres[i])) {
      caracteres.splice(i, 1)
      exceso--
    }
  }

  const textoRecortado = caracteres.join('')
  insertarTextoEnCursor(textoRecortado, control, formControlName)
}

const insertarTextoEnCursor = (texto: string, control: AbstractControl, formControlName: string): void => {
  const textarea = document.querySelector(`textarea[formControlName="${formControlName}"]`);
  if (!(textarea instanceof HTMLTextAreaElement)) return;

  const start = textarea.selectionStart || 0;
  const end = textarea.selectionEnd || 0;
  const valorActual = control.value ?? '';

  const nuevoValor = valorActual.substring(0, start) + texto + valorActual.substring(end);
  textarea.value = nuevoValor;
  control.setValue(nuevoValor.trim(), { emitEvent: false });

  const nuevaPos = start + texto.length;
  textarea.selectionStart = textarea.selectionEnd = nuevaPos;
}