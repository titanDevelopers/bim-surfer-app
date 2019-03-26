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
        this.getProjectOid(this.documentId, (poid: number) => {
            this.loadProject(poid);
        });
    }

    navigateToProject(info: ProjectInfo) {
        this.loadProject(info.poid);
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
            this.projectsInfo.push({ name: 'oc_forum', poid: 1638401 });
            this.projectsInfo.push({ name: 'tcj', poid: 1703937 });
            this.projectsInfo.push({ name: 'bystricka', poid: 1835009 });
            this.projectsInfo.push({ name: 'duplex', poid: 1900545 });
            this.projectsInfo.push({ name: 'dek_cierny', poid: 1966081 });
            this.projectsInfo.push({ name: 'mlyny', poid: 2031617 });
            this.projectsInfo.push({ name: 'rs_skanska', poid: 2097153 });
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

    private getProjectOid(documentName: string, callback: any) {
        this.bimServerClient.call('ServiceInterface', 'getProjectsByName', { name: documentName }, (projects: any) => {
            callback(projects[0].oid);
        }, (error: any) => this.errorCallBack(error));
    }

    private loadProject(poid: number) {
        this.bimServerClient.call('ServiceInterface', 'getProjectByPoid', {
            poid: poid
        }, (project: any) => {
            const canvas = document.getElementById('glcanvas');

            this.bimServerViewer = new BimServerViewer(
                this.bimServerClient,
                { viewerBasePath: '../' },
                canvas,
                canvas.clientWidth,
                canvas.clientHeight);

            this.bimServerViewer.loadModel(project);
        });
    }
}
