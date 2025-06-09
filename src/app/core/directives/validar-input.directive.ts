import { Directive, ElementRef, Input, HostListener, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';

type TipoEntrada = 'texto' | 'numero' | 'alfaNumerico' | 'telefono' | '';

@Directive({
    selector: '[validarInput]',
    standalone: true
})
export class ValidarInputDirective implements AfterViewInit, OnChanges {
    @Input() validarMaxLength: number = 250;
    @Input() validarTipoEntrada: TipoEntrada = '';
    @Input() validarSoloMayusculas: boolean = false;
    @Input() validarRegex: string | null = null;
    @Input() validarIgnorarTildes: boolean = false;

    private inputElement: HTMLInputElement | null = null;

    private readonly navigationKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'Home', 'End', 'ArrowLeft', 'ArrowRight',];

    constructor(private readonly el: ElementRef) { }

    ngAfterViewInit(): void {
        this.initializeInputReference();

        if (this.inputElement) {
            this.inputElement.maxLength = this.validarMaxLength;
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['validarMaxLength'] && this.inputElement) {
            const value = Number(this.validarMaxLength);
            this.validarMaxLength = isNaN(value) ? 50 : value;
            this.inputElement.maxLength = this.validarMaxLength;
        }
    }

    private initializeInputReference(): void {
        const nativeEl = this.el.nativeElement;
        if (nativeEl instanceof HTMLInputElement) {
            this.inputElement = nativeEl;
        } else {
            const innerInput = nativeEl.querySelector('input');
            if (innerInput instanceof HTMLInputElement) {
                this.inputElement = innerInput;
            } else {
                console.warn('[ValidarInputDirective] No se encontró un <input>, reintentando...');
                setTimeout(() => this.initializeInputReference(), 50);
            }
        }
    }

    private normalizar(valor: string): string {
        return valor.normalize("NFD").replace(/[\u0300-\u036f]/g, '');
    }

    @HostListener('keydown', ['$event'])
    onKeyDown(e: KeyboardEvent): void {
        if (!this.inputElement) return;
        if (this.navigationKeys.includes(e.key) || (e.ctrlKey || e.metaKey)) return;

        const newValue = this.forecastValue(e.key);
        if (!this.validarValor(newValue)) {
            e.preventDefault();
        }
    }

    @HostListener('beforeinput', ['$event'])
    onBeforeInput(e: InputEvent): void {
        if (!this.inputElement || !e.data) return;

        const newValue = this.forecastValue(e.data);

        if (!this.validarValor(newValue)) {
            e.preventDefault();
        }
    }

    @HostListener('input', ['$event'])
    onInput(e: Event): void {
        if (!this.inputElement) return;

        const limpio = this.sanitizarValor(this.inputElement.value);

        if (this.inputElement.value !== limpio) {
            this.inputElement.value = limpio;
            this.triggerEvent(this.inputElement, 'input');
        }
    }

    @HostListener('paste', ['$event'])
    onPaste(e: ClipboardEvent): void {
        if (!this.inputElement) return;

        e.preventDefault();

        const pasted = e.clipboardData?.getData('text') ?? '';
        const limpio = this.sanitizarValor(pasted);
        this.insertarTexto(limpio);
    }

    @HostListener('drop', ['$event'])
    onDrop(e: DragEvent): void {
        if (!this.inputElement) return;

        e.preventDefault();

        const dropped = e.dataTransfer?.getData('text') ?? '';
        const limpio = this.sanitizarValor(dropped);
        this.insertarTexto(limpio);
    }

    @HostListener('Blur', ['$event'])
    blur(e: FocusEvent): void {
        this.onBlurValue(e);
    }

    @HostListener('onBlur', ['$event'])
    onBlur(e: FocusEvent): void {
        this.onBlurValue(e);
    }

    private onBlurValue(e: FocusEvent): void {
        if (!this.inputElement) return;

        this.inputElement.value = this.inputElement.value.trim();
        this.triggerEvent(this.inputElement, 'input');
    }


    private forecastValue(char: string): string {
        if (!this.inputElement) return '';

        const start = this.inputElement.selectionStart ?? 0;
        const end = this.inputElement.selectionEnd ?? 0;
        const current = this.inputElement.value ?? '';

        return current.substring(0, start) + char + current.substring(end);
    }

    private validarValor(valor: string): boolean {
        let regex: RegExp;

        // Si se definió un regex personalizado, se usa
        if (this.validarRegex) {
            try {
                regex = new RegExp(this.validarRegex);
            } catch (err) {
                console.warn('[ValidarInputDirective] Regex inválido:', err);
                return false;
            }
        } else {
            // Regex por tipo predefinido
            switch (this.validarTipoEntrada) {
                case 'texto':
                    regex = /^[A-Za-zÁÉÍÓÚáéíóúñÑüÜ\s]*$/;
                    break;
                case 'numero':
                    regex = /^\d*$/;
                    break;
                case 'alfaNumerico':
                    regex = /^[A-Za-zÁÉÍÓÚáéíóúñÑüÜ0-9\s]*$/;
                    break;
                case 'telefono':
                    regex = /^(9\d*|)$/;
                    break;
                case '':
                    return valor.length <= this.validarMaxLength; // Permite cualquier valor
                default:
                    return false;
            }
        }

        return regex.test(valor) && valor.length <= this.validarMaxLength;
    }

    private sanitizarValor(valor: string): string {
        if (this.validarSoloMayusculas) {
            valor = valor.toUpperCase();
        }

        if (this.validarIgnorarTildes) {
            valor = this.normalizar(valor); // Elimina tildes del texto ingresado
        }

        let permitido = '';

        for (const char of valor) {
            if (this.validarValor(permitido + char)) {
                permitido += char;
            }
        }

        return permitido.slice(0, this.validarMaxLength);
    }

    private insertarTexto(texto: string): void {
        if (!this.inputElement) return;

        const start = this.inputElement.selectionStart ?? 0;
        const end = this.inputElement.selectionEnd ?? 0;
        const actual = this.inputElement.value ?? '';
        const nuevoValor = actual.substring(0, start) + texto + actual.substring(end);
        this.inputElement.value = nuevoValor.slice(0, this.validarMaxLength);
        const nuevaPos = start + texto.length;
        this.inputElement.setSelectionRange(nuevaPos, nuevaPos);

        this.triggerEvent(this.inputElement, 'input');
    }

    private triggerEvent(el: HTMLInputElement, tipo: string): void {
        queueMicrotask(() => {
            el.dispatchEvent(new Event(tipo, { bubbles: true, cancelable: true }));
        });
    }
}
