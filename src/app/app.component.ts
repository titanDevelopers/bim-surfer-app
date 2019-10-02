import { Component, AfterViewInit } from '@angular/core';
import { BimServerClient } from 'bimserverapi/BimServerClient';
import { BimServerViewer } from '@slivka/surfer/viewer/bimserverviewer';
import { ProjectInfo } from './project-info.model';
import { environment } from 'src/environments/environment';
import { BimMeasureUnitHelper } from './bim-measure-unit.helper';
import { BimMeasureType } from './bim-measure-type.enum';
import { BimMeasureRow } from './bim-measure-row';
import { MatTableDataSource } from '@angular/material/table';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { BimPropertyListService } from './bim-property-list.service';
import { BimPropertyNodeModel, BimPropertyModel } from './bim-property.model';
import { Subject, Observable, of as observableOf } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface Direction {
    value: string;
    viewValue: string;
}

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {

    env = environment;
    title = 'bim-surfer';
    documentId = '';
    projectsInfo: ProjectInfo[] = [];
    bimServerClient: BimServerClient;
    bimServerViewer: BimServerViewer;
    camera: any;
    progress = 0;
    isSectionDirection = false;
    roid: number;

    dataSource: MatTableDataSource<BimMeasureRow>;
    displayedColumns: string[] = ['name', 'value', 'measureUnit'];

    properties: MatTreeFlatDataSource<BimPropertyModel, BimPropertyNodeModel>;
    treeControl: FlatTreeControl<BimPropertyNodeModel>;
    treeFlattener: MatTreeFlattener<BimPropertyModel, BimPropertyNodeModel>;

    private unsubscribe: Subject<void> = new Subject();

    directions: Direction[] = [
        { value: '0', viewValue: 'No section' },
        { value: '1', viewValue: 'Free section' },
        { value: '2', viewValue: 'X-axis' },
        { value: '3', viewValue: 'Y-axis' },
        { value: '4', viewValue: 'Z-axis' }
    ];

    translations = {};

    constructor(
        private bimPropertyListService: BimPropertyListService,
        private bimMeasureUnitHelper: BimMeasureUnitHelper) {

        this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel,
            this.isExpandable, this.getChildren);
        this.treeControl = new FlatTreeControl<BimPropertyNodeModel>(this.getLevel, this.isExpandable);
        this.properties = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
    }

    transformer = (node: BimPropertyModel, level: number) => {
        return new BimPropertyNodeModel(!!node.children, node.name, level, node.value);
    }

    hasChild = (_: number, _nodeData: BimPropertyNodeModel) => _nodeData.expandable;

    private getChildren = (node: BimPropertyModel): Observable<BimPropertyModel[]> => observableOf(node.children);

    private getLevel = (node: BimPropertyNodeModel) => node.level;

    private isExpandable = (node: BimPropertyNodeModel) => node.expandable;

    ngAfterViewInit() {
        this.login();
        this.translations['BOUNDING_BOX_SIZE_ALONG_X'] = 'Dĺžka (X)';
        this.translations['BOUNDING_BOX_SIZE_ALONG_Y'] = 'Hrúbka (Y)';
        this.translations['BOUNDING_BOX_SIZE_ALONG_Z'] = 'Výška (Z)';

        this.translations['SURFACE_AREA_ALONG_X'] = 'Plocha podľa osi X';
        this.translations['SURFACE_AREA_ALONG_Y'] = 'Plocha podľa osi Y';
        this.translations['SURFACE_AREA_ALONG_Z'] = 'Plocha podľa osi Z';
        this.translations['LARGEST_FACE_AREA'] = 'Najväčšia predná plocha';
        this.translations['TOTAL_SURFACE_AREA'] = 'Celková plocha';

        this.translations['TOTAL_SHAPE_VOLUME'] = 'Objem';

        this.bimPropertyListService.propertiesLoaded
            .pipe(takeUntil(this.unsubscribe))
            .subscribe((data: BimPropertyModel[]) => {
                this.setDataSource(data);
            });
    }

    onLoginClick() {
        this.login();
    }

    onLoadDocument(event: any) {
        this.loadModel(this.documentId);
    }

    navigateToProject(info: ProjectInfo) {
        this.loadModel(info.name);
    }

    onDirectionChange(event: any) {
        this.bimServerViewer.settings.sectionPlaneDirection = Number(event.value);

        if (this.bimServerViewer.settings.sectionPlaneDirection === 0) {
            this.bimServerViewer.viewer.removeSectionPlaneWidget();
            this.bimServerViewer.viewer.disableSectionPlane();
        }
    }

    private setDataSource(data: BimPropertyModel[]) {
        this.properties.data = (data) ? data : [];
        if (data && data.length === 1) {
            this.treeControl.expandAll();
        } else {
            this.treeControl.collapseAll();
        }
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
            this.bimServerClient.getModel(project.oid, project.lastRevisionId, project.schema, false, (model: any) => {
                const canvas = document.getElementById('glcanvas');

                this.roid = project.lastRevisionId;
                this.loadUnits(model);
                this.bimPropertyListService.setModel(model);
                this.bimServerViewer = new BimServerViewer(
                    {
                        triangleThresholdDefaultLayer: totalPrimitives,
                        excludedTypes: this.getExludeTypes(project.schema)
                    },
                    canvas,
                    canvas.clientWidth,
                    canvas.clientHeight,
                    null);

                this.bimServerViewer.setProgressListener((percentage: number) => {
                    this.progress = Math.round(percentage);
                });

                this.bimServerViewer.loadModel(this.bimServerClient, project).then((data: any) => {
                    const bimSurfer = this.bimServerViewer.viewer;

                    bimSurfer.eventHandler.on('selection_state_changed', (elements: any, isSelected: boolean) => {
                        this.onSelectionChanged(elements, isSelected);
                    });
                });
            });
        });
    }

    private onSelectionChanged(elements: number[], isSelected: boolean) {
        if (elements && elements.length > 0 && isSelected) {
            this.bimPropertyListService.showElementProperties(elements);
            this.getGeometryInfo(elements[0]);
        } else {
            this.dataSource = undefined;
            this.bimPropertyListService.showElementProperties([]);
        }
    }

    private getExludeTypes(schema: string): string[] {
        if (schema === 'ifc4') {
            return ['IfcSpace', 'IfcOpeningElement', 'IfcAnnotation', 'IfcOpeningStandardCase'];
        } else {
            return ['IfcSpace', 'IfcOpeningElement', 'IfcAnnotation'];
        }
    }

    private getTotalPrimitives(roids: any): any {
        return new Promise((resolve, reject) => {
            this.bimServerClient.call('ServiceInterface', 'getNrPrimitivesTotal', { roids: roids }, (totalPrimitives: any) => {
                resolve(totalPrimitives);
            });
        });
    }

    private getGeometryInfo(oid: number) {
        this.bimServerClient.call('ServiceInterface', 'getGeometryInfo', { roid: this.roid, oid: oid }, (data: any) => {
            this.loadMeasurement(data.additionalData);
        }, (error: any) => this.errorCallBack(error));
    }

    private loadMeasurement(data: string) {
        const ret: BimMeasureRow[] = [];
        JSON.parse(data, (key, value) => {
            const type = this.getType(key);
            if (type) {
                ret.push({ key: key, name: this.translations[key], value: Number(value).toFixed(4), type: type });
            }
        });

        ret.sort((n1, n2) => n1.key.localeCompare(n2.key));

        this.dataSource = new MatTableDataSource<BimMeasureRow>(ret);
    }

    private getType(key: string): BimMeasureType {
        if (key.indexOf('AREA') > -1) {
            return BimMeasureType.ifcAreaMeasure;
        } else if (key.indexOf('BOUNDING') > -1) {
            return BimMeasureType.ifcLengthMeasure;
        } else if (key.indexOf('VOLUME') > -1) {
            return BimMeasureType.ifcVolumeMeasure;
        }
        return undefined;
    }

    private loadUnits(model: any) {
        model.query(this.getUnitsQuery(), () => { }).done(() => {
            this.bimMeasureUnitHelper.loadUnits(model);
        });
    }

    getMeasureUnit(type: BimMeasureType): string {
        return this.bimMeasureUnitHelper.getUnitSymbol(type);
    }

    private getUnitsQuery() {
        return {
            types: [
                {
                    name: 'IfcUnitAssignment',
                },
                {
                    name: 'IfcSIUnit',
                },
                {
                    name: 'IfcConversionBasedUnit',
                }
            ]
        };
    }
}
