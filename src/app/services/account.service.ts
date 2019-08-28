import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';

import { Observable } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';
import { FireSQL } from 'firesql';
import { DocumentData } from 'firesql/utils';

import { AuthService } from './auth.service';
import { User, JoinedCommunity } from '../models/user.model';
import { take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AccountService {

  private fireSQL: FireSQL;

  constructor(
    private afStore: AngularFirestore,
    private storage: Storage,
    private authService: AuthService,
  ) {
    this.fireSQL = new FireSQL(this.afStore.firestore);
  }

  getUserProfile(uid?: string): Observable<User>{
    if (!uid){
      if (this.authService.user$.value == null) return;
      uid = this.authService.user$.value.uid;
    }
    
    return this.afStore.doc<User>(`/users/${uid}`).valueChanges();
  }

  refetchUserDetails(uid?: string){
    if (!uid && !this.authService.isAuthenticated()) return;

    this.afStore.doc<User>(`users/${uid}`)
      .valueChanges()
      .pipe(take(1))
      .subscribe(fireUser => {
        this.updateUserInDevice(fireUser);
        this.authService.user$.next(fireUser);
      });
  }

  getUserFields(fields: string[], uid?: string){
    if (!uid){
      if (this.authService.user$.value == null) return;
      uid = this.authService.user$.value.uid;
    }

    let query = `SELECT ${fields.join(',')} FROM users WHERE uid='${uid}'`;
    return this.fireSQL.query<User>(query);
  }

  updateUserInDevice(userInfo: User): Promise<void> | void{
    if (this.authService.isAuthenticated()){
      this.storage.set(this.authService.USER_KEY, userInfo);
    }
  }

  loadUsers(userIds: string[]): Promise<DocumentData[]>{
    let query = `SELECT uid, displayName, email, photoURL FROM users WHERE uid IN (`;
    userIds.forEach((userId, index) => {
      query += `'${userId}'`;
      if (index != userIds.length-1)
        query += `,`;
    });
    query += `)`;
    return this.fireSQL.query(query);
  }

  joinedCommunities(areaId?: string): JoinedCommunity[]{
    if (!this.authService.isAuthenticated()) return [];

    const user: User = this.authService.user$.value;
    if (areaId){
      if (user.joinedCommunities && user.joinedCommunities.length > 0)
        return user.joinedCommunities.filter((joinedCommunity) => {
          return joinedCommunity.areaId === areaId;
        });
      else
        return [];
    }
    return user.joinedCommunities;
  }
}
