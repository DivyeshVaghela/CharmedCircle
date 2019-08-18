import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { PostListPage } from './post-list.page';
import { PostFormPage } from '../post-form/post-form.page';

const routes: Routes = [
  {
    path: '',
    component: PostListPage
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
    PostListPage,
    PostFormPage,
  ],
  entryComponents: [
    PostFormPage
  ]
})
export class PostListPageModule {}
