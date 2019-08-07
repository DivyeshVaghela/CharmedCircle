import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { BehaviorSubject, of } from 'rxjs';

import { auth } from 'firebase/app';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { GooglePlus } from '@ionic-native/google-plus/ngx';

import { switchMap } from 'rxjs/operators';

import { User } from '../models/user.model';

const USER_KEY = "user";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  user$ = new BehaviorSubject<User>(null);

  constructor(
    private platform: Platform, private storage: Storage,
    private afAuth: AngularFireAuth,
    private afStore: AngularFirestore,
    private googlePlus: GooglePlus
  ) {
    this.platform.ready().then(() => {

      this.checkToken();
      if (this.isAuthenticated()) {
        this.afAuth.authState.pipe(
          switchMap(fireUser => {
            console.dir('fireUser', fireUser);
            if (fireUser) {
              return this.afStore.doc<User>(`users/${fireUser.uid}`).valueChanges();
            } else {
              return of(null);
            }
          })
        ).subscribe(user => {
          console.log('user from Firestore', user);
          this.user$.next(user);
        });
      }
    });
  }

  /**
   * login the user, save the user info in database as well as in device storage
   */
  storeInDevice(userInfo: User) {
    console.log(userInfo);
    this.storage.set(USER_KEY, userInfo).then(res => {
      this.user$.next(res);
    });
  }

  updateUserInFirestore(userData: User) {
    const { uid, email, displayName, photoURL, phoneNumber } = userData;
    const userRef: AngularFirestoreDocument<User> = this.afStore.doc(`users/${uid}`);
    const data = {
      uid, email, displayName, photoURL, phoneNumber,
      lastLoginTime: new Date()
    };
    this.storeInDevice(data);
    return userRef.set(data, { merge: true });
  }

  async googleSignin() {
    try {

      const response = await this.googlePlus.login({});
      console.log(response);
      const credential = await this.afAuth.auth.signInWithCredential(
        auth.GoogleAuthProvider.credential(null, response.accessToken)
      );

      // const provider = new auth.GoogleAuthProvider();
      // const credential = await this.afAuth.auth.signInWithPopup(provider);
      this.updateUserInFirestore(credential.user);
      // await this.afAuth.auth.signInWithRedirect(provider);
    } catch (error) {
      if (error.code == 'auth/network-request-failed' || error == 7) {
        console.log('Make sure that you are connected to the internet');
      }
      console.log(error);
    }
  }

  // checkLanding(){
  //   console.log('checkLanding()');
  //   this.afAuth.auth.getRedirectResult().then(result => {
  //     console.log(result.user);
  //     if (result.user != null){
  //       this.updateUserInFirestore(result.user);
  //     }
  //   }, (error) => {
  //     if (error.code == 'auth/network-request-failed'){
  //       console.log('Make sure that you are connected to the internet');
  //     }
  //     console.log(error);
  //   });
  // }

  /**
   * clear the user login data from device storage
   */
  async logout() {
    console.log('Within Logout');
    this.googlePlus.logout().then((value) => {
      console.log('Google plus logged out');
    }, (error) => {
      console.log('Google Plus log out error', error);
    });

    const userRef: AngularFirestoreDocument<User> = this.afStore.doc(`users/${this.user$.value.uid}`);
    await userRef.update({
      lastLogoutTime: new Date()
    });

    await this.afAuth.auth.signOut().then(() => {
      console.log('Sign out firebase response');
    }, (error) => {
      console.log('Firebase log out error', error);
    });
    this.storage.remove(USER_KEY).then(() => {
      console.log('storage removed');
      this.user$.next(null);
    }, (error) => {
      console.log('Device storage log out error', error);
    });
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
    return this.storage.get(USER_KEY).then(res => {
      if (res)
        this.user$.next(res);
    });
  }
}
