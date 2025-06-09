import CryptoJS from 'crypto-js';
import { Injectable } from '@angular/core';
import { CRYPT_KEY } from '@environments/environment';

@Injectable({
    providedIn: 'root'
})
export class CryptService {
    private readonly key: string = CRYPT_KEY

    encrypt = (data: string): string => {
        return CryptoJS.AES.encrypt(data, this.key).toString()
    }

    decrypt = (data: string): string => {
        try {
            let bytes = CryptoJS.AES.decrypt(data, this.key)
            let valueDecrypted = bytes.toString(CryptoJS.enc.Utf8)
            if (valueDecrypted !== '')
                return String(valueDecrypted)
        } catch (error) {
            console.error(`Ha ocurrido un error al intentar descriptar: ${data}`)
        }
        return ''
    }
}