import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { MenuPage } from './menu.page';

const routes: Routes = [
  {
    path: '',
    component: MenuPage,
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        loadChildren: () => import('../home/home.module').then( m => m.HomePageModule)
      },
      { 
        path: 'user-profile', 
        loadChildren: () => import('../user-profile/user-profile.module').then(m => m.UserProfilePageModule)
      },
      { 
        path: 'user-profile/:uid', 
        loadChildren: () => import('../user-profile/user-profile.module').then(m => m.UserProfilePageModule)
      },
      { 
        path: 'communities', 
        loadChildren: () => import('../communities/communities.module').then( m => m.CommunitiesPageModule) /*'../communities/communities.module#CommunitiesPageModule'*/
      },
      {
        path: 'communities/:areaId/:communityId',
        loadChildren: () => import('../community-details/community-details.module').then(m => m.CommunityDetailsPageModule)
      }
    ]
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [MenuPage]
})
export class MenuPageModule {}
