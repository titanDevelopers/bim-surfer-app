export class BimPropertyListModel {
    oid: string;
    properties: BimPropertyModel[];
}

export class BimPropertyModel {
    name: string;
    value: string;
    children: BimPropertyModel[];
}

export class BimPropertyNodeModel {
    constructor(
        public expandable: boolean, public name: string, public level: number, public value: any) { }
}
