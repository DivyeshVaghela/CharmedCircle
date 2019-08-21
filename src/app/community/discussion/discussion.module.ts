import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { DiscussionPage } from './discussion.page';

import { AutosizeModule } from 'ngx-autosize';

const routes: Routes = [
  {
    path: '',
    component: DiscussionPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    AutosizeModule
  ],
  declarations: [DiscussionPage]
})
export class DiscussionPageModule {}
