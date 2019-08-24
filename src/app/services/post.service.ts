import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';
import { firestore } from 'firebase/app';

import { LocationService } from './location.service';
import { AuthService } from './auth.service';
import { UserAsset } from '../models/user-asset.model';
import { Post } from '../models/post.model';

export interface QueryConfig {
  field: string;
  reverse?: boolean;
  limit: number;
  after?: any;
}

@Injectable({
  providedIn: 'root'
})
export class PostService {
  
  constructor(
    private afStore: AngularFirestore,
    private afStorage: AngularFireStorage,

    private authService: AuthService,
    private locationService: LocationService
  ) {}

  list(areaId: string, communityId: string, queryConfig?: QueryConfig): Observable<Post[]>{

    const postsColRef = this.afStore.collection<Post>(
      `/communityAreas/${areaId}/communities/${communityId}/posts`, 
      ref => {
        if (!queryConfig)
          queryConfig = { field: 'timestamp', limit: 20 };
        
        if (!queryConfig.hasOwnProperty('reverse')) queryConfig.reverse = true;
        if (!queryConfig.after) queryConfig.after = queryConfig.field;

        return ref.orderBy(queryConfig.field, queryConfig.reverse ? 'desc' : 'asc')
                  .startAfter(queryConfig.after)
                  .limit(queryConfig.limit);
      }
    );
    return postsColRef.valueChanges({ idField: 'postId' });
  }

  details(areaId: string, communityId: string, postId: string): Observable<Post>{
    const postDocRef = this.afStore.doc<Post>(`/communityAreas/${areaId}/communities/${communityId}/posts/${postId}`);
    return postDocRef.valueChanges();
  }

  create(newPost: Post, asset?: UserAsset): Promise<any>{

    if (!newPost.timestamp)
      newPost.timestamp = Date.now();
    newPost.thumbsUpCount = 0;
    newPost.thumbsUpUids = [];

    return new Promise((resolve, reject) => {
      if (asset){
        const refString = `/${newPost.areaId}/${newPost.communityId}/${this.createAssetName(newPost)}.${asset.name.substring(asset.name.indexOf('.') + 1)}`;
        const assetRef = this.afStorage.ref(refString);
        const uploadTask = assetRef.put(asset.blob);
        const subscription = uploadTask.snapshotChanges()
          .pipe(
            finalize(async () => {
              const downloadUrl = await assetRef.getDownloadURL().toPromise();
              newPost.imageUrls = [downloadUrl];
              console.log(newPost);

              resolve();
              subscription.unsubscribe();
            })
          )
          .subscribe(data => {
            console.log(data);
          });
      } else {
        resolve();
      }
    }).then(() => {
      const postsColRef = this.afStore.collection(`/communityAreas/${newPost.areaId}/communities/${newPost.communityId}/posts`);
      return postsColRef.add(newPost);
    })
  }

  createAssetName(post: Post){
    return `${post.areaId}_${post.communityId}_${post.uid}_${Date.now()}`;
  }

  thumbsUp(post: Post, uid: string): Promise<void>{

    const postDocRef = this.afStore.doc(`/communityAreas/${post.areaId}/communities/${post.communityId}/posts/${post.postId}`);
    return postDocRef.update({
      thumbsUpUids: firestore.FieldValue.arrayUnion(uid),
      thumbsUpCount: firestore.FieldValue.increment(1)
    });
  }

  alreadyThumbsUp(post: Post): boolean{
    if (!this.authService.isAuthenticated()) return false;

    const uid = this.authService.user$.value.uid;
    return (post.uid === uid || post.thumbsUpUids.indexOf(uid) != -1);
  }

  async canThumbsUp(post: Post): Promise<{result: boolean, reason?: string}>{
    if (!this.authService.isAuthenticated()) return {result:false, reason:'Not authenticated'};

    if (this.authService.user$.value.uid === post.uid) return {result: false, reason: 'Own post'}

    if (!this.locationService.canTakeAction({areaId: post.areaId})){
      return {result:false, reason:'Location not matched'};
    }

    if (!this.alreadyThumbsUp(post)){
      return {result: true}
    } else {
      return {result:false, reason:'Already thumbsUp'};
    }
  }
}
