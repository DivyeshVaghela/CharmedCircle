import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { Storage } from '@ionic/storage';
import { AuthService } from './auth.service';
import { User } from '../models/user.model';
import { Area } from '../models/area.model';
import { Location } from '../models/location.model';
import { resolve } from 'url';
import { reject } from 'q';

@Injectable({
  providedIn: 'root'
})
export class AccountService {

  constructor(
    private afStore: AngularFirestore,
    private authService: AuthService,
    private storage: Storage
  ) { }

  updateLastKnownLocation(location: Location): Promise<void>{
    return Promise.all([
      this.updateLastKnownLocationInStore(location),
      this.updateLastKnownLocationInDevice(location)
    ]).then(
      () => { resolve; },
      () => { reject; }
    );
  }

  updateLastKnownLocationInStore(location: Location): Promise<void> | void{
    if (this.authService.isAuthenticated()){
      const userRef: AngularFirestoreDocument<User> = this.afStore.doc<User>(`users/${this.authService.user$.value.uid}`);
      let data = {};
      if (this.authService.user$.value.lastKnownLocation &&
        this.authService.user$.value.lastKnownLocation.area &&
        location.area.equalsArea(this.authService.user$.value.lastKnownLocation.area)){
        const {latitude, longitude, accuracy, timestamp} = location;
        data = {
          "lastKnownLocation.latitude": latitude,
          "lastKnownLocation.longitude": longitude,
          "lastKnownLocation.accuracy": accuracy,
          "lastKnownLocation.timestamp": timestamp
        };
      } else {
        location.area = location.area.toPlainObject();
        data = {
          lastKnownLocation: location
        };
      }
      return userRef.update(data);
    }
  }

  async updateLastKnownLocationInDevice(location: Location): Promise<any>{
    if (this.authService.isAuthenticated()){
      let userInfo: User = await this.storage.get(this.authService.USER_KEY);
      userInfo.lastKnownLocation = location;
      await this.storage.set(this.authService.USER_KEY, userInfo);
    }
  }

  updateUserInDevice(userInfo: User): Promise<void> | void{
    if (this.authService.isAuthenticated()){
      this.storage.set(this.authService.USER_KEY, userInfo);
    }
  }
}
