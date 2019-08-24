import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { BehaviorSubject, of } from 'rxjs';

import { auth } from 'firebase/app';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { GooglePlus } from '@ionic-native/google-plus/ngx';

import { switchMap, take } from 'rxjs/operators';

import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  readonly USER_KEY = "user";
  user$ = new BehaviorSubject<User>(null);

  constructor(
    private platform: Platform, private storage: Storage,
    private afAuth: AngularFireAuth,
    private afStore: AngularFirestore,
    private googlePlus: GooglePlus
  ) {
    this.platform.ready().then(() => {

      this.checkToken();
      this.afAuth.authState.pipe(
        switchMap(fireUser => {
          if (fireUser && fireUser.uid) {
            return this.afStore.doc<User>(`users/${fireUser.uid}`).valueChanges();
          } else {
            return of(null);
          }
        })
      ).subscribe(user => {
        this.user$.next(user);
      }, error => {
        console.log('Firestore error', error);
      });
    });

  }

  /**
   * login the user, save the user info in database as well as in device storage
   */
  storeInDevice(userInfo: User) {
    this.storage.set(this.USER_KEY, userInfo).then(res => {
      this.user$.next(res);
    });
  }

  updateUserInFirestore(userData: User, provider?: string) {
    const { uid, email, displayName, photoURL, phoneNumber } = userData;
    const userRef: AngularFirestoreDocument<User> = this.afStore.doc<User>(`users/${uid}`);
    let data: any = {
      uid, email, displayName, photoURL, phoneNumber,
      lastLoginTime: new Date()
    };
    if (provider){
      data.provider = provider
    }
    this.storeInDevice(data);
    return userRef.set(data, { merge: true });
  }

  async googleSignin() {
    try {

      const response = await this.googlePlus.login({});
      const credential = await this.afAuth.auth.signInWithCredential(
        auth.GoogleAuthProvider.credential(null, response.accessToken)
      );

      // const provider = new auth.GoogleAuthProvider();
      // const credential = await this.afAuth.auth.signInWithPopup(provider);
      this.updateUserInFirestore(credential.user, 'google');
      // await this.afAuth.auth.signInWithRedirect(provider);
    } catch (error) {
      if (error.code == 'auth/network-request-failed' || error == 7) {
        console.log('Make sure that you are connected to the internet');
      }
      console.log(error);
    }
  }

  /**
   * clear the user login data from device storage
   */
  async logout(): Promise<any> {

    this.googlePlus.logout().then((value) => {}, (error) => {
      console.log('GP log out error', error);
    });

    const userRef: AngularFirestoreDocument<User> = this.afStore.doc(`users/${this.user$.value.uid}`);
    await userRef.update({
      lastLogoutTime: new Date()
    });

    await this.afAuth.auth.signOut().then(() => {}, (error) => {
      console.log('Firebase log out error', error);
    });

    await this.storage.remove(this.USER_KEY);
    this.user$.next(null);

    return true;
  }

  /**
   * check whether the user is logged in or not without async
   */
  isAuthenticated(): boolean {
    return (this.user$.value != null);
  }

  /**
   * check the tocken for expiry
   */
  checkToken() {
    return this.storage.get(this.USER_KEY).then(res => {
      if (res)
        this.user$.next(res);
    });
  }
}
