# Welcome to Charmed-Circle

This is a mobile application for Local Communities

## Dependencies:
- Angular 8
- [Ionic 4](https://ionicframework.com/docs/)
- Cordova
- Firebase
- [AngularFire](https://github.com/angular/angularfire2)
- [FireSQL](https://firebaseopensource.com/projects/jsayol/firesql/)
  - Change the import line in firesql.d.ts (`import * as firebase from 'firebase/app'`)
- Firebase Cloud Functions, which is available under the firebase/functions orphan branch

## Used Ionic native features:
- Google Plus
	- (After adding platform) If working in android then replace the following in `/platforms/android/project.properties`
		```
		cordova.system.library.#=com.google.android.gms:play-services-auth:11.8.0
		cordova.system.library.#=com.google.android.gms:play-services-identity:11.8.0
					
		With the following
				
		cordova.system.library.#=com.google.android.gms:play-services-auth:15.0.0
		cordova.system.library.#=com.google.android.gms:play-services-identity:15.0.0
		```
- GeoLocation
- Native GeoCoder
- Camera
- File

## TODO
- Download project dependencies using:
	`$ npm install`
- Add the platform, for example Android like this:
	`$ ionic cordova platform add android`
- Create and configure Google Firebase Account
	- Create project in Firebase console named `CharmedCircle`
	- Create a Web app and Android app in that project
	- Enable Google Authentication
	- Enable Firestore database
	- Enable Storage
	- Get the `firebaseconfig` from Web app and put it in appropriate `environment` file.
  - Deploy the Firebase functions as mentioned in `firebase/functions` branch of this repository
- Start the app:
	- Locally (in browser) using `$ ionic serve`
	- In ionic devapp using `$ ionic serve --devapp`
	- In Android using `$ ionic cordova run android`


> Documentation and Screenshots are available in `/documentation` directory