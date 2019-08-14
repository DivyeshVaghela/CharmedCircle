import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { CommunitiesPage } from './communities.page';
import { CommunityFormPage } from '../community-form/community-form.page';

const routes: Routes = [
  {
    path: '',
    component: CommunitiesPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [
    CommunitiesPage,
    CommunityFormPage,
  ],
  entryComponents: [
    CommunityFormPage
  ]
})
export class CommunitiesPageModule {}
