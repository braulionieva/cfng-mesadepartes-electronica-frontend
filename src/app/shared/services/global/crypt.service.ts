import CryptoJS from 'crypto-js';
import { Injectable } from '@angular/core';
import { CRYPT_KEY } from '@environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CryptService {
  private readonly key: string = CRYPT_KEY;
  private readonly ITERATIONS = 10000;
  private readonly SALT_SIZE = 8;
  private readonly IV_SIZE = 16;

  encrypt(data: string): string {
    const salt = CryptoJS.lib.WordArray.random(this.SALT_SIZE);

    const key = CryptoJS.PBKDF2(this.key, salt, {
      keySize: (32 + 16) / 4, // 32 bytes key + 16 bytes IV
      iterations: this.ITERATIONS,
      hasher: CryptoJS.algo.SHA256,
    });

    const keyWords = CryptoJS.lib.WordArray.create(key.words.slice(0, 32 / 4), 32);
    const ivWords = CryptoJS.lib.WordArray.create(key.words.slice(32 / 4), 16);

    const encrypted = CryptoJS.AES.encrypt(data, keyWords, {
      iv: ivWords,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    const finalData = salt.clone().concat(ivWords).concat(encrypted.ciphertext)
    return CryptoJS.enc.Base64.stringify(finalData)
  }

  decrypt(data: string): string {
    const dataWords = CryptoJS.enc.Base64.parse(data);

    const salt = CryptoJS.lib.WordArray.create(
      dataWords.words.slice(0, this.SALT_SIZE / 4),
      this.SALT_SIZE
    );

    const ciphertext = CryptoJS.lib.WordArray.create(
      dataWords.words.slice((this.SALT_SIZE + this.IV_SIZE) / 4),
      dataWords.sigBytes - this.SALT_SIZE - this.IV_SIZE
    );

    const key = CryptoJS.PBKDF2(this.key, salt, {
      keySize: (32 + 16) / 4,
      iterations: this.ITERATIONS,
      hasher: CryptoJS.algo.SHA256,
    });

    const keyWords = CryptoJS.lib.WordArray.create(key.words.slice(0, 32 / 4));
    const ivWords = CryptoJS.lib.WordArray.create(key.words.slice(32 / 4));

    const decrypted = CryptoJS.AES.decrypt({ ciphertext }, keyWords, {
      iv: ivWords,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  }
}
