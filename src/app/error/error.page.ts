import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ErrorCode } from '../models/error-code.model';
import { DiagnosticService } from '../services/diagnostic.service';

@Component({
  selector: 'app-error',
  templateUrl: './error.page.html',
  styleUrls: ['./error.page.scss'],
})
export class ErrorPage implements OnInit {

  message: string = "Something Went Wrong, please try again..";
  imagePath: string;
  showRefresh: boolean = false;
  errorCode: ErrorCode;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,

    private diagnosticService: DiagnosticService
  ) {
    if (this.activatedRoute.snapshot.queryParams.code)
      this.errorCode = this.activatedRoute.snapshot.queryParams.code;

    switch(+this.errorCode){
      case ErrorCode.NETWORK_CONNECTION_ERROR:
        this.message = "It seems that you aren't connected to the Internet,<br>check your connection and try again";
        this.showRefresh = true;
        this.imagePath = "assets/images/confused.png"
        break;
    }
  }

  ngOnInit() {

  }

  redirect(){
    if (this.errorCode == ErrorCode.NETWORK_CONNECTION_ERROR){
      if (!this.diagnosticService.isNetworkConnected(false)) return;
    }

    let returnUrl = "/landing-check";
    if (this.activatedRoute.snapshot.queryParams.returnUrl){
      returnUrl = this.activatedRoute.snapshot.queryParams.returnUrl;
    }
    this.router.navigate([returnUrl], { 
      replaceUrl: true,
      queryParams: {
        confirmation: true
      }
    });
  }
}
