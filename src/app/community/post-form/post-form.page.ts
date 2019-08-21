import { Component, OnInit, Input } from '@angular/core';
import { ModalController, ToastController, AlertController, ActionSheetController } from '@ionic/angular';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
import { File, FileEntry } from '@ionic-native/file/ngx';

import { AuthService } from 'src/app/services/auth.service';
import { LocationService } from 'src/app/services/location.service';
import { PostService } from 'src/app/services/post.service';
import { Post } from '../../models/post.model';
import { UserAsset } from 'src/app/models/user-asset.model';

@Component({
  selector: 'app-post-form',
  templateUrl: './post-form.page.html',
  styleUrls: ['./post-form.page.scss'],
})
export class PostFormPage implements OnInit {

  @Input() areaId: string;  
  @Input() communityId: string;

  postForm: FormGroup;
  isSubmitionInitiated = false;

  refreshContent = false;

  cameraOptions: CameraOptions = null;
  selectedPicture: UserAsset = {
    data: null,
    blob: null,
    name: null,
    size: null,
    type: null,
    lastModified: null,
    lastModifiedDate: null
  };

  constructor(
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private actionSheetCtrl: ActionSheetController,

    private camera: Camera,
    private file: File,

    private authService: AuthService,
    private locationService: LocationService,
    private postService: PostService
  ) {
    this.createForm();
    
    this.cameraOptions = {
      quality: 100,
      destinationType: this.camera.DestinationType.FILE_URI,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE,
      correctOrientation: true
    };
  }

  createForm(){
    this.postForm = new FormGroup({
      title: new FormControl('', Validators.required),
      subtitle: new FormControl(''),
      content: new FormControl('', [Validators.required, Validators.minLength(30)])
    });
  }

  ngOnInit() {}

  async getPicture(pictureSourceType: number){
    this.cameraOptions.sourceType = pictureSourceType;
    let imagePath = await this.camera.getPicture(this.cameraOptions);
      
    const queryStringIndex = imagePath.indexOf('?', imagePath.lastIndexOf('/'));
    if (queryStringIndex != -1)
      imagePath = imagePath.substring(0, queryStringIndex);
    
    const dirPath = imagePath.substring(0, imagePath.lastIndexOf('/') + 1);
    const fileName = imagePath.substring(imagePath.lastIndexOf('/') + 1);

    this.file.readAsDataURL(dirPath, fileName)
      .then(response => {
        this.selectedPicture.data = response;
      })
      .catch(error => console.log('Error selecting picture', error));
    
    const entry = await this.file.resolveLocalFilesystemUrl(imagePath);
    (entry as FileEntry).file(async fileToRead => {
      const { name, size, type, lastModified, lastModifiedDate } = fileToRead;
      this.selectedPicture.name = name;
      this.selectedPicture.size = size;
      this.selectedPicture.type = type;
      this.selectedPicture.lastModified = lastModified;
      this.selectedPicture.lastModifiedDate = lastModifiedDate;

      const buffer = await this.file.readAsArrayBuffer(dirPath, fileName);
      this.selectedPicture.blob = new Blob([buffer], { type: this.selectedPicture.type });
    });
  }

  async selectPicture(){
    if (this.postForm.disabled) return;

    const selectPictureActionSheet = await this.actionSheetCtrl.create({
      header: 'Select picture from..',
      buttons: [
        {
          text: 'Gallary',
          icon: 'photos',
          handler: () => {
            this.getPicture(this.camera.PictureSourceType.PHOTOLIBRARY);
          }
        },
        {
          text: 'Camera',
          icon: 'camera',
          handler: () => {
            this.getPicture(this.camera.PictureSourceType.CAMERA);
          }
        },
        {
          text: 'Cancel',
          role: 'cancel',
          icon: 'close'
        }
      ]
    });
    selectPictureActionSheet.present();
  }

  async savePost(){

    this.isSubmitionInitiated = true;
    if (this.postForm.invalid) return;

    if (!this.locationService.canTakeAction({areaId: this.areaId})){
      const locationNotMatched = await this.alertCtrl.create({
        header: 'Now allowed',
        message: `You cannot interact within this community, because your current location doesn't match the locality of this community.`,
        buttons: ['OK']
      });
      locationNotMatched.present();
      return;
    }

    const currentLocation = this.locationService.location$.value;

    this.postForm.disable();
    const newPost: Post = {
      title: this.postForm.get('title').value,
      subtitle: this.postForm.get('subtitle').value,
      content: this.postForm.get('content').value,

      areaId: this.areaId,
      communityId: this.communityId,

      uid: this.authService.user$.value.uid,

      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude
    }
    this.postService.create(newPost, this.selectedPicture.name != null ? this.selectedPicture : null)
      .then(async response => {
        const successToast = await this.toastCtrl.create({
          message: 'New post created successfully',
          duration: 3000
        });
        successToast.present();
        this.refreshContent = true;
        this.closeModal();
      })
      .catch(async error => {
        console.log('Error while creating a new post', error);
        const errorToast = await this.toastCtrl.create({
          message: 'There was some error while creating a new post',
          duration: 3000
        });
        errorToast.present();
        this.closeModal();
      });
  }

  closeModal(){
    this.modalCtrl.dismiss({
      refreshContent: this.refreshContent
    });
  }
}
