import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';

import { Observable } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';
import { FireSQL } from 'firesql';
import { DocumentData } from 'firesql/utils';

import { AuthService } from './auth.service';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AccountService {

  constructor(
    private afStore: AngularFirestore,
    private storage: Storage,
    private authService: AuthService,
  ) { }

  getUserProfile(uid?: string): Observable<User>{
    if (!uid){
      if (this.authService.user$.value == null) return;
      uid = this.authService.user$.value.uid;
    }
    
    return this.afStore.doc<User>(`/users/${uid}`).valueChanges();
  }

  updateUserInDevice(userInfo: User): Promise<void> | void{
    if (this.authService.isAuthenticated()){
      this.storage.set(this.authService.USER_KEY, userInfo);
    }
  }

  loadUsers(userIds: string[]): Promise<DocumentData[]>{
    const fireSQL = new FireSQL(this.afStore.firestore);
    let query = `SELECT uid, displayName, email, photoURL FROM users WHERE uid IN (`;
    userIds.forEach((userId, index) => {
      query += `'${userId}'`;
      if (index != userIds.length-1)
        query += `,`;
    });
    query += `)`;
    return fireSQL.query(query);
  }
}
