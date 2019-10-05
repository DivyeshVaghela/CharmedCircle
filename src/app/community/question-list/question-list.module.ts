import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { QuestionListPage } from './question-list.page';
import { QuestionFormPage } from '../question-form/question-form.page';
import { QuestionFormPageModule } from '../question-form/question-form.module';

const routes: Routes = [
  {
    path: '',
    component: QuestionListPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
  declarations: [
    QuestionListPage,
    QuestionFormPage
  ],
  entryComponents: [
    QuestionFormPage
  ]
})
export class QuestionListPageModule {}
