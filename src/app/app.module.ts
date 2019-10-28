import { AngularResizedEventModule } from 'angular-resize-event';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { BimMeasureUnitHelper } from './bim-measure-unit.helper';
import { MatTableModule } from '@angular/material/table';
import { MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BimPropertyListService } from './bim-property-list.service';
import { BimSectionPlaneService } from './bim-section-plane.service';
import { CommonModule } from '@angular/common';
import { CdkTreeModule } from '@angular/cdk/tree';

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        FormsModule,
        MatSelectModule,
        BrowserAnimationsModule,
        MatTableModule,
        MatTreeModule,
        MatIconModule,
        MatButtonModule,
        CommonModule,
        CdkTreeModule,
        AngularResizedEventModule
    ],
    exports: [
        MatIconModule,
        MatTreeModule,
        MatTableModule,
        CdkTreeModule
    ],
    providers: [BimPropertyListService, BimMeasureUnitHelper, BimSectionPlaneService],
    bootstrap: [AppComponent]
})
export class AppModule { }
