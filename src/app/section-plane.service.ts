import { Viewer } from '../../../BIMsurfer-1/viewer/viewer';

export class SectionPlaneService {

    private viewer: Viewer;

    constructor() {
    }

    setViewer(viewer: Viewer) {
        this.viewer = viewer;
        console.log(viewer);
    }

    onMouseDown(direction: number) {
        if (direction > 0) {
            // this.getCanvasPosFromEvent(e, this.mousePos);

            // this.lastX = this.mousePos[0];
            // this.lastY = this.mousePos[1];

            // if (this.viewer.enableSectionPlane({
            //     canvasPos: [this.lastX, this.lastY]
            // })) {
            // } else if (!this.viewer.sectionPlaneIsDisabled) {
            //     this.viewer.disableSectionPlane();
            // }
            // if (direction < 2) {
            //     this.viewer.removeSectionPlaneWidget();
            // }
        }
    }
}
