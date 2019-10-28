import * as vec2 from '../../../BIMsurfer-1/viewer/glmatrix/vec2';

import { ElementRef } from '@angular/core';
import { Viewer } from '../../../BIMsurfer-1/viewer/viewer';

// import { BimServerViewer } from '@slivka/surfer/viewer/bimserverviewer';
// import { Viewer } from '@slivka/surfer/viewer/viewer';
// import * as vec2 from '@slivka/surfer/viewer/glmatrix/vec2';

export const DRAG_PAN = 0xfe02;

export class BimSectionPlaneService {

    myIconClass = 'icon icon-hidden';

    private viewer: Viewer;
    private canvas: ElementRef;
    private icon: ElementRef;
    private lastIconClass = 'icon icon-hidden';
    private canvas_pos: Float32Array = vec2.create();
    private dragging = false;
    private freeSectionEnabled = false;

    constructor() {
    }

    setViewer(viewer: Viewer, canvas: ElementRef, icon: ElementRef) {
        this.viewer = viewer;
        this.canvas = canvas;
        this.icon = icon;
    }

    onCanvasMove(e: MouseEvent) {
        if (this.viewer && this.viewer.sectionPlaneHelper && this.viewer.sectionPlaneHelper.sectionIndex > -1) {
            this.viewer.cameraControl.getCanvasPosFromEvent(e, this.canvas_pos);
            if (this.dragging) {
                this.viewer.moveSectionPlane({
                    canvasPos: this.canvas_pos
                });
            } else if (this.isFreeSectionIndex() && !this.freeSectionEnabled) {
                this.viewer.positionSectionPlaneWidget({
                    canvasPos: this.canvas_pos
                });
            }
            this.setPositionIcon();
        }
    }

    onCanvasMouseDown() {
        if (this.viewer && this.viewer.sectionPlaneHelper && this.isFreeSectionIndex() && !this.freeSectionEnabled) {
            this.viewer.cameraControl.isSelectionEnabled = false;
        }
    }

    onCanvasMouseUp(e: MouseEvent) {
        if (this.viewer && this.viewer.sectionPlaneHelper && this.isFreeSectionIndex()) {
            this.viewer.cameraControl.getCanvasPosFromEvent(e, this.canvas_pos);
            const p = this.viewer.pick({ canvasPos: this.canvas_pos, select: false });
            if (p.object && !this.viewer.camera.orbitting && this.viewer.cameraControl.dragMode !== DRAG_PAN) {
                this.freeSectionEnabled = true;
                this.lastIconClass = this.myIconClass = 'icon icon-visible';
                this.setPositionIcon();
            }
        }
    }

    onCavasMouseWheel() {
        if (this.viewer && this.viewer.sectionPlaneHelper && this.viewer.sectionPlaneHelper.sectionIndex > -1) {
            this.setPositionIcon();
        }
    }

    onIconMouseMove(e: MouseEvent) {
        if (this.viewer && this.viewer.sectionPlaneHelper && this.viewer.sectionPlaneHelper.sectionIndex > -1) {
            const canvasX = (e.x - parseFloat(this.canvas.nativeElement.offsetParent.offsetLeft));
            const canvasY = (e.y - parseFloat(this.canvas.nativeElement.offsetParent.offsetTop));
            if (canvasX > 0 && canvasX < this.canvas.nativeElement.width && canvasY > 0 && canvasY < this.canvas.nativeElement.height) {
                this.setPositionIcon();
                if (this.dragging) {
                    this.canvas_pos[0] = canvasX;
                    this.canvas_pos[1] = canvasY;
                    this.viewer.moveSectionPlane({
                        canvasPos: this.canvas_pos
                    });
                }
            }
        }
    }

    onIconMouseDown(e: MouseEvent) {
        this.canvas_pos[0] = this.getCanvasX(e);
        this.canvas_pos[1] = this.getCanvasY(e);

        this.viewer.enableSectionPlane({
            canvasPos: [this.canvas_pos[0], this.canvas_pos[1]]
        });
        this.dragging = true;
    }

    onModelMouseUp() {
        if (this.freeSectionEnabled) {
            this.viewer.cameraControl.isSelectionEnabled = true;
        }
        this.dragging = false;
        this.viewer.sectionPlaneHelper.isSectionMoving = false;
        if (this.viewer && this.viewer.sectionPlaneHelper &&
            this.viewer.sectionPlaneHelper.sectionIndex > -1 && this.viewer.ps) {
            this.viewer.sectionplanePoly.points = this.viewer.ps;
        }
    }

    onDirectionChange(e: any) {
        this.viewer.sectionPlaneHelper.sectionIndex = Number(e.value);
        this.directionChange();
    }

    onDirectionClick() {
        if (this.isFreeSectionIndex()) {
            this.directionChange();
        }
    }

    directionChange() {
        this.viewer.removeSectionPlaneWidget();
        this.viewer.disableSectionPlane();
        this.viewer.moveSectionPlaneWidget();
        this.freeSectionEnabled = false;
        if (this.viewer.sectionPlaneHelper.sectionIndex === -1 || this.isFreeSectionIndex()) {
            this.lastIconClass = this.myIconClass = 'icon icon-hidden';
        } else {
            this.resizeSectionPlane();
            this.lastIconClass = this.myIconClass = 'icon icon-visible';
            this.setPositionIcon();
        }
    }

    resizeSectionPlane() {
        if (this.viewer && this.viewer.sectionPlaneHelper && this.viewer.sectionPlaneHelper.sectionIndex > -1) {
            this.setPositionIcon();
            this.viewer.camera.orbitYaw(0);
        }
    }

    private setPositionIcon() {
        const overlay = this.viewer.overlay;
        const points = this.viewer.ps;

        if (points) {
            const center = [
                (points[2][0] + points[0][0]) / 2,
                (points[2][1] + points[0][1]) / 2,
                (points[2][2] + points[0][2]) / 2
            ];
            const [x, y] = overlay.transformPoint(center);
            const canvasX = this.canvas.nativeElement.width;
            const canvasY = this.canvas.nativeElement.height;
            if (x > 0 && x < canvasX && y > 0 && y < canvasY) {
                this.icon.nativeElement.style.left = (x - 10) + 'px';
                this.icon.nativeElement.style.top = (y - 10) + 'px';
                this.myIconClass = this.lastIconClass;
            } else {
                this.myIconClass = 'icon icon-hidden';
            }
        }
    }

    private isFreeSectionIndex(): boolean {
        return this.viewer.sectionPlaneHelper.isFreeSectionIndex();
    }

    private getCanvasX(e: MouseEvent): number {
        const centerX = this.icon.nativeElement.clientWidth / 2;
        const x = e.x - e.offsetX + centerX;

        return x - parseFloat(this.canvas.nativeElement.offsetParent.offsetLeft);
    }

    private getCanvasY(e: MouseEvent): number {
        const centerY = this.icon.nativeElement.clientHeight / 2;
        const y = e.y - e.offsetY + centerY;

        return y - parseFloat(this.canvas.nativeElement.offsetParent.offsetTop);
    }
}
