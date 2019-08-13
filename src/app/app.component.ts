import { Component } from '@angular/core';
import { BimServerClient } from 'bimserverapi/BimServerClient';
import { BimServerViewer } from '@slivka/surfer/viewer/bimserverviewer';
import { ProjectInfo } from './project-info.model';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
    env = environment;
    title = 'bim-surfer';
    documentId = '';
    projectsInfo: ProjectInfo[] = [];
    bimServerClient: BimServerClient;
    bimServerViewer: BimServerViewer;


    onLoginClick() {
        this.login();
    }

    onLoadDocument(event: any) {
        this.loadModel(this.documentId);
    }

    navigateToProject(info: ProjectInfo) {
        this.loadModel(info.name);
    }

    private loadModel(documentName: string) {
        this.getProjectByName(documentName, (project: any) => {
            this.getTotalPrimitives([project.roid]).then((totalPrimitives: number) => {
                this.loadProject(project.oid, totalPrimitives + 10000);
            });
        });
    }

    private login() {
        this.bimServerClient = new BimServerClient(environment.apiUrl);

        this.bimServerClient.init(() => {
            this.bimServerClient.login(
                environment.login,
                environment.password,
                () => this.loginCallBack(),
                (error: any) => console.log(error));
        });
    }

    private loginCallBack() {
        if (environment.production) {
            this.projectsInfo.push({ name: 'oc_forum', poid: 1 });
            this.projectsInfo.push({ name: 'tcj', poid: 2 });
            this.projectsInfo.push({ name: 'lakeside', poid: 3 });
            this.projectsInfo.push({ name: 'duplex', poid: 4 });
            this.projectsInfo.push({ name: 'dek_cierny', poid: 5 });
            this.projectsInfo.push({ name: 'rd_samta', poid: 6 });
            this.projectsInfo.push({ name: 'kuco', poid: 7 });
            this.projectsInfo.push({ name: 'schepen', poid: 8 });
            this.projectsInfo.push({ name: 'kros', poid: 9 });
            this.projectsInfo.push({ name: 'dek_skladby', poid: 10 });
            this.projectsInfo.push({ name: 'komora', poid: 11 });
        } else {
            this.bimServerClient.call('ServiceInterface', 'getAllProjects',
                { onlyTopLevel: true, onlyActive: true },
                (projects: any) => this.getAllProjectsCallBack(projects),
                (error: any) => this.errorCallBack(error)
            );
        }
    }

    private getAllProjectsCallBack(projects: any) {
        projects.slice(0, 10).forEach((project: any) => this.getProjectInfo(project));
    }

    private getProjectInfo(project: any) {
        if (project.lastRevisionId !== -1) {
            this.projectsInfo.push({ name: project.name, poid: project.oid });
        }
    }

    private errorCallBack(error: any) {
        console.error(error);
    }

    private getProjectByName(documentName: string, callback: any) {
        this.bimServerClient.call('ServiceInterface', 'getProjectsByName', { name: documentName }, (projects: any) => {
            callback({ oid: projects[0].oid, roid: projects[0].lastRevisionId });
        }, (error: any) => this.errorCallBack(error));
    }

    private loadProject(poid: number, totalPrimitives: number) {
        this.bimServerClient.call('ServiceInterface', 'getProjectByPoid', {
            poid: poid
        }, (project: any) => {
            const canvas = document.getElementById('glcanvas');

            this.bimServerViewer = new BimServerViewer(
                {
                    triangleThresholdDefaultLayer: totalPrimitives
                },
                canvas,
                canvas.clientWidth,
                canvas.clientHeight,
                null);

            this.bimServerViewer.loadModel(this.bimServerClient, project);
        });
    }

    getTotalPrimitives(roids: any): any {
        return new Promise((resolve, reject) => {
            this.bimServerClient.call('ServiceInterface', 'getNrPrimitivesTotal', { roids: roids }, (totalPrimitives: any) => {
                resolve(totalPrimitives);
            });
        });
    }
}
