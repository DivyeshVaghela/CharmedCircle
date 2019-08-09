import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { AuthService } from './auth.service';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AccountService {

  constructor(
    private authService: AuthService,
    private storage: Storage
  ) { }

  updateUserInDevice(userInfo: User): Promise<void> | void{
    if (this.authService.isAuthenticated()){
      this.storage.set(this.authService.USER_KEY, userInfo);
    }
  }
}
