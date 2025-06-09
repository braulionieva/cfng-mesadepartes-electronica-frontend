import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { TokenService } from './token.service';
import { CREDENTIALS } from '@environments/environment';
import { Router } from '@angular/router';

const { BASIC, USERNAME, PASSWORD } = CREDENTIALS;

@Injectable({
	providedIn: 'root',
})
export class AuthService {
	constructor(
		private readonly router: Router,
		private readonly tokenService: TokenService,
	) { }

	login(isRefreshToken: boolean = false): Observable<any> {
		let params = new URLSearchParams()

		if (!isRefreshToken) {
			params.set("username", USERNAME)
			params.set("password", PASSWORD)
			params.set("grant_type", "password")
		} else {
			if (!this.tokenService.exist(true)) {
				this.router.navigate(['/'])
				return of(false)
			}
			params.set("refresh_token", this.tokenService.get(true))
			params.set("grant_type", "refresh_token")
		}

		return new Observable<boolean>((observer) => {
			this.tokenService.save('eyJ4NXQiOiJOMlk1TVRnM05qRmxNVEptWVRnNVpEQXdaalV3WWpaaU16SmxZemhoWkRjNU1UaGlOall3WlEiLCJraWQiOiJZbUZtWWpCalltUXpNV1l6TVRrMU5UQTROekU0TkRjeE5UZzFaVFl3WTJRNE1qYzJabUZsWldRNE9ESTBZek5pWmpNeU9HUmlaVGRoTlRsbU5UQTFaUV9SUzI1NiIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiJtcy1kZXYiLCJhdXQiOiJBUFBMSUNBVElPTl9VU0VSIiwiYXVkIjoiOXNFOUJTOEVlT2ZCQUdWamlUYWJDTFFFUjQwYSIsIm5iZiI6MTY4NzA0MTM2NywiYXpwIjoiOXNFOUJTOEVlT2ZCQUdWamlUYWJDTFFFUjQwYSIsInNjb3BlIjoiZGVmYXVsdCIsImlzcyI6Imh0dHBzOlwvXC8xNzIuMTYuMTExLjEyMzo5NDQzXC9vYXV0aDJcL3Rva2VuIiwiZXhwIjoxNjg3MDQ0OTY3LCJpYXQiOjE2ODcwNDEzNjcsImp0aSI6ImVkMzYwYjIyLWY1OTAtNDVmOS05MTkzLTA5ZGVhZTc5MjgzOSJ9.X5SSzT_NAt1h7XyHLJ-3HibASW16OKAkPtokf5dHhv9lju3QbHjzpN-4-v_4tTVbE7TP2QwqcZBa9AWHQupJ-M6RIPlQdkprzzlyxOZOuCNKrP0G0-TgSNmdpHhWM-PjxnGncrnPz1hmqTWaEsb4Z03Q_HtQw4T8N8zNP_qvejtR2oYkgeXtMbPr72ovPb_FdhYkQ4bJ9p6PpqCrAMtwkj5g4F0QCx9s0eHKUu61nwvIi4Okv7dNpeOxuuWP8IJGUYRx8wrKbqDYL3MciopZ-pQ5cQaxBTKd4yRZDtkxs94nruuofH73xcSL1-KyWzZX9SRXgR9FM2nt-9omjo03TA')
			this.tokenService.save('2ed6e806-93a5-35b9-9728-997a0910b267', true)
			observer.next(true);
			observer.complete();
		})
	}

	logout() {
		localStorage.clear();
		this.router.navigate(['/']);
	}
}