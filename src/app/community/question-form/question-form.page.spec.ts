import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionFormPage } from './question-form.page';

describe('QuestionFormPage', () => {
  let component: QuestionFormPage;
  let fixture: ComponentFixture<QuestionFormPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ QuestionFormPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QuestionFormPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
