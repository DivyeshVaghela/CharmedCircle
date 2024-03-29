import { Injectable } from '@angular/core';

import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreCollection, DocumentReference } from '@angular/fire/firestore';
import { firestore } from 'firebase/app';
import { FireSQL } from 'firesql';

import { Community } from '../models/community.model';
import { Observable } from 'rxjs';

import { AuthService } from './auth.service';
import { SlugifyPipe } from '../pipes/slugify.pipe';
import { CommunityArea } from '../models/community-area.model';
import { LocationService } from './location.service';
import { User } from '../models/user.model';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CommunityService {

  private fireSQL: FireSQL;

  constructor(
    private afStore: AngularFirestore,
    private authService: AuthService,
    private locationService: LocationService,
    private slugifyPipe: SlugifyPipe
  ) {
    this.fireSQL = new FireSQL(this.afStore.firestore);
  }

  create(communityArea: CommunityArea, newCommunity: Community): Promise<void>{
    const uid = this.authService.user$.value.uid;
    newCommunity.requester = {
      uid: uid,
      timestamp: Date.now()
    };
    newCommunity.members = [ uid ];
    newCommunity.membersCount = 1;
    newCommunity.communityId = this.slugifyPipe.transform(newCommunity.name);
    newCommunity.areaId = communityArea.areaId;
    newCommunity.isPending = true;
    newCommunity.postsCount = 0;
    
    const communityAreaDocRef: DocumentReference = 
      this.afStore.firestore.doc(`/communityAreas/${newCommunity.areaId}`);
    const communityDocRef: DocumentReference = 
      this.afStore.firestore.doc(`/communityAreas/${newCommunity.areaId}/communities/${newCommunity.communityId}`);
    const userDocRef: DocumentReference = 
      this.afStore.firestore.doc(`/users/${uid}`);
  
    return this.afStore.firestore.runTransaction(async (transaction) => {
      
      await transaction.set(communityAreaDocRef, {
        countryCode: communityArea.countryCode,
        country: communityArea.country,
        state: communityArea.state,
        city: communityArea.city
      }, { merge: true });
      await transaction.set(communityDocRef, newCommunity);
      await transaction.update(userDocRef, {
          joinedCommunities: firestore.FieldValue.arrayUnion({
            areaId: newCommunity.areaId,
            communityId: newCommunity.communityId,
            name: newCommunity.name,
            timestamp: Date.now()
          })
        });
    });
  }

  joinCommunity(community: {areaId: string, communityId: string, name: string}): Promise<void>{
    const uid = this.authService.user$.value.uid;

    const communityDocRef: DocumentReference = 
      this.afStore.firestore.doc(`/communityAreas/${community.areaId}/communities/${community.communityId}`);
    const userDocRef: DocumentReference = 
      this.afStore.firestore.doc(`/users/${uid}`);
  
    return this.afStore.firestore.runTransaction(async (transaction) => {
      
      await transaction.update(communityDocRef, {
        members: firestore.FieldValue.arrayUnion(uid)
      });
      await transaction.update(userDocRef, {
          joinedCommunities: firestore.FieldValue.arrayUnion({
            areaId: community.areaId,
            communityId: community.communityId,
            name: community.name,
            timestamp: Date.now()
          })
        });
    });
  }

  leaveCommunity(community: {areaId: string, communityId: string}): Promise<void>{
    const uid = this.authService.user$.value.uid;

    const communityDocRef: DocumentReference = 
      this.afStore.firestore.doc(`/communityAreas/${community.areaId}/communities/${community.communityId}`);
    const userDocRef: DocumentReference = 
      this.afStore.firestore.doc(`/users/${uid}`);

    return this.afStore.firestore.runTransaction(async (transaction) => {
      
      return transaction.get(userDocRef)
        .then(async doc => {
          const userData = doc.data();
          const communityToRemove = (userData.joinedCommunities as Array<any>).find(joinedCommunity => {
            if (joinedCommunity.areaId === community.areaId && joinedCommunity.communityId === community.communityId)
              return joinedCommunity;
          });

          await transaction.update(communityDocRef, {
            members: firestore.FieldValue.arrayRemove(uid)
          });

          await transaction.update(userDocRef, {
            joinedCommunities: firestore.FieldValue.arrayRemove(communityToRemove)
          });
        })
    });
  }

  get(areaId: string): Observable<Community[]>{
    const communityColRef: AngularFirestoreCollection<Community> = 
      this.afStore.collection<Community>(`/communityAreas/${areaId}/communities`);
    return communityColRef.valueChanges();
  }

  getCommunityDetails(areaId: string, communityId: string): Observable<Community>{
    const communityDocRef: AngularFirestoreDocument<Community> = 
      this.afStore.doc<Community>(`/communityAreas/${areaId}/communities/${communityId}`);
    return communityDocRef.valueChanges();
  }

  getCommunities(areaId: string, fields: string[]): Promise<Community[]>{
    const fireSQL = new FireSQL(this.afStore.firestore.collection('communityAreas').doc(areaId))
    let query = `SELECT ${fields.join(',')} FROM communities`;
    return fireSQL.query<Community>(query);
  }

  getCommunityFields(areaId: string, communityId: string, fields: string[]){
    const fireSQL = new FireSQL(this.afStore.firestore.collection('communityAreas').doc(areaId))
    let query = `SELECT ${fields.join(',')} FROM communities WHERE communityId='${communityId}'`;
    return fireSQL.query<Community>(query);
  }
  
  canJoinCommunity(community: { areaId: string }, location?: { countryCode: string, state: string, city: string }){
    if (!location)
      location = this.locationService.location$.value.area;
    return (community.areaId === this.locationService.getAreaId(location));
  }

  isMember(areaId: string, communityId: string, uid?: string){
    if (!uid && !this.authService.isAuthenticated()) return false;

    const user: User = this.authService.user$.value;
    if (!uid)
      uid = user.uid;
    
    const found = user.joinedCommunities.find(joinedCommunity => {
      return joinedCommunity.areaId == areaId && joinedCommunity.communityId == communityId;
    });

    if (found)
      return true;
    return false;
  }
}
