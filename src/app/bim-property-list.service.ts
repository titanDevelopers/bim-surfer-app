import { BehaviorSubject } from 'rxjs';
import { formatNumber } from '@angular/common';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BimMeasureUnitHelper } from './bim-measure-unit.helper';
import { BimPropertyModel } from './bim-property.model';
import { BimMeasureType } from './bim-measure-type.enum';

const defaultLocale = 'cz';

@Injectable()
export class BimPropertyListService {

    propertiesLoadStarted = new BehaviorSubject<boolean>(false);
    propertiesLoaded = new BehaviorSubject<BimPropertyModel[]>(null);

    private apiModel: any;
    private basicNames = ['GlobalId', 'Name', 'Description', 'LongName', 'Tag', 'ObjectType', 'PredefinedType'];
    private specificPropertyNames: {};

    constructor(private bimMeasureUnitHelper: BimMeasureUnitHelper) {
        this.apiModel = undefined;
        this.loadSpecificPropertyNames();
    }

    private loadSpecificPropertyNames() {
        const doorNames = ['OverallHeight', 'OverallWidth', 'OperationType', 'UserDefinedOperationType'];
        const windowNames = ['OverallHeight', 'OverallWidth', 'PartitioningType', 'UserDefinedPartitioningType'];

        this.specificPropertyNames = {};
        this.specificPropertyNames['IfcDoor'] = doorNames;
        this.specificPropertyNames['IfcDoorStandardCase'] = doorNames;
        this.specificPropertyNames['IfcPile'] = ['ConstructionType'];
        this.specificPropertyNames['IfcStair'] = ['ShapeType'];
        this.specificPropertyNames['IfcStairFlight'] = ['NumberOfRisers', 'NumberOfTreads', 'RiserHeight', 'TreadLength'];
        this.specificPropertyNames['IfcWindow'] = windowNames;
        this.specificPropertyNames['IfcWindowStandardCase'] = windowNames;
        this.specificPropertyNames['IfcElementAssembly'] = ['AssemblyPlace'];
        this.specificPropertyNames['IfcSpace'] = ['InteriorOrExteriorSpace', 'ElevationWithFlooring'];
        this.specificPropertyNames['IfcProject'] = ['Phase'];
        this.specificPropertyNames['IfcSite'] = ['RefElevation', 'LandTitleNumber'];
        this.specificPropertyNames['IfcBuilding'] = ['ElevationOfRefHeight', 'ElevationOfTerrain'];
        this.specificPropertyNames['IfcBuildingStorey'] = ['Elevation'];
    }

    setModel(model: any) {
        this.apiModel = model;

        this.apiModel.query(this.getUnitsQuery(), () => { }).done(() => {
            this.bimMeasureUnitHelper.loadUnits(model);
        });
    }

    clear() {
        this.apiModel = undefined;
        this.propertiesLoaded.next(null);
    }

    showElementProperties(oids: number[]) {
        this.propertiesLoadStarted.next(true);

        if (oids && oids.length > 0) {
            this.getPropertyLists(oids).subscribe((properties: BimPropertyModel[]) => {
                this.propertiesLoaded.next(properties);
            });
        } else {
            this.propertiesLoaded.next(null);
        }
    }

    private loadAllProperties(apiModel: any, oids: number[]): Observable<any> {
        return new Observable(observer => {
            const query = this.getQuery(oids.filter(p => p > 0), apiModel.schema);
            apiModel.query(query, () => { }).done(() => {
                observer.next(apiModel);
                observer.complete();
            });
        });
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

    private getQuery(oids: number[], schema: string) {
        return {
            'defines': {
                'propertySets': {
                    'type': 'IfcPropertySet',
                    'fields': [
                        'HasProperties'
                    ]
                },
                'elementQuantity': {
                    'type': 'IfcElementQuantity',
                    'fields': [
                        'Quantities'
                    ]
                }
            },
            'queries': [
                {
                    'oids': oids,
                    'includes': [
                        {
                            'type': {
                                'name': 'IfcObject',
                                'includeAllSubTypes': true
                            },
                            'fields': this.getFieldsBySchema(schema),
                            'includes': [
                                {
                                    'type': 'IfcRelDefinesByProperties',
                                    'fields': [
                                        'RelatingPropertyDefinition'
                                    ],
                                    'includes': [
                                        'propertySets',
                                        'elementQuantity'
                                    ]
                                },
                                {
                                    'type': 'IfcRelDefinesByType',
                                    'fields': [
                                        'RelatingType'
                                    ],
                                    'includes': [
                                        {
                                            'type': 'IfcTypeObject',
                                            'fields': [
                                                'HasPropertySets'
                                            ],
                                            'includes': [
                                                'propertySets',
                                                'elementQuantity'
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        };
    }

    private getFieldsBySchema(schema: string) {
        return (schema === 'ifc4')
            ? ['IsDefinedBy', 'IsTypedBy']
            : ['IsDefinedBy'];
    }

    private getPropertyLists(oids: number[]): Observable<BimPropertyModel[]> {
        return new Observable(observer => {
            const ret: BimPropertyModel[] = [];
            const model = this.apiModel;

            if (oids.length > 0) {
                this.loadAllProperties(model, oids).subscribe(() => {
                    for (const oid of oids) {
                        this.appendProperties(ret, model, oid);
                    }
                    model.objects = {};
                    model.loadedTypes = {};
                    observer.next(ret);
                    observer.complete();
                });
            } else {
                observer.next(ret);
                observer.complete();
            }
        });
    }

    private appendProperties(ret: BimPropertyModel[], model: any, oid: number) {
        let properties: BimPropertyModel[] = [];
        const element = model.objects[oid];

        if (element) {
            properties.push(this.getAttributes(model, element));
            properties = properties.concat(this.getAllProperties(element));
            ret.push(<BimPropertyModel>{
                name: this.getName(properties[0].children),
                value: '' + oid,
                children: properties
            });
        }
    }

    private getName(properties: BimPropertyModel[]): string {
        const propertyName = properties.filter(x => x.name === 'Name');
        return (propertyName.length === 1) ? propertyName.pop().value : '';
    }

    private getAllProperties(element: any) {
        let ret = [];
        if (element.object._rIsDefinedBy) {
            ret = ret.concat(this.getPropertiesFromDefinedBy(element));
        }
        if (element.object._rIsTypedBy) {
            ret = ret.concat(this.getPropertiesFromTypedBy(element));
        }
        return ret;
    }

    private getPropertiesFromDefinedBy(element: any) {
        const propertiesIsDefinedBy = this.getIsDefinedBy(element);
        const propertySets = this.getPropertySets(propertiesIsDefinedBy);
        return this.proccessPropertySets(propertySets);
    }

    private getPropertiesFromTypedBy(element: any) {
        const isTypedBy = this.getIsTypedBy(element);
        const relatingType = this.getRelatingType(isTypedBy);
        const propertySets = this.getHasPropertySets(relatingType);
        return this.proccessPropertySets(propertySets);
    }

    private getIsDefinedBy(element: any) {
        const ret = [];
        element.getIsDefinedBy((isDefinedBy: any) => {
            ret.push(isDefinedBy);
        });
        return ret;
    }

    private getPropertySets(propertiesIsDefinedBy: any) {
        let relatingDefinitions = [];
        for (const isDefinedBy of propertiesIsDefinedBy) {
            if (isDefinedBy.object._t === 'IfcRelDefinesByProperties') {
                relatingDefinitions.push(this.getRelatingPropertyDefinition(isDefinedBy));
            } else if (isDefinedBy.object._t === 'IfcRelDefinesByType') {
                const relatingType = this.getRelatingType(isDefinedBy);
                relatingDefinitions = relatingDefinitions.concat(this.getHasPropertySets(relatingType));
            }
        }
        return relatingDefinitions;
    }

    private getRelatingPropertyDefinition(isDefinedBy: any) {
        let ret = null;
        isDefinedBy.getRelatingPropertyDefinition((propertySet: any) => {
            ret = propertySet;
        });
        return ret;
    }

    private proccessPropertySets(propertySets: any) {
        const ret = [];
        for (const propertySet of propertySets) {
            if (propertySet.object._t === 'IfcPropertySet') {
                const propertySetModel = this.loadPropertySet(propertySet);
                const properties = this.readProperties(propertySet);

                propertySetModel.children = this.getProperties(properties);
                ret.push(propertySetModel);
            } else if (propertySet.object._t === 'IfcElementQuantity') {
                const elementQuantitModel = this.loadElementQuantity(propertySet);
                const quantities = this.readElementQuantity(propertySet);

                elementQuantitModel.children = this.getQuantityValues(quantities);
                ret.push(elementQuantitModel);
            }
        }

        return ret;
    }

    private readProperties(propertySet: any) {
        return this.getHasProperties(propertySet);
    }

    private readElementQuantity(elementQuantity: any) {
        return this.getQuantities(elementQuantity);
    }

    private getAttributes(model: any, element: any): BimPropertyModel {
        const ret = new BimPropertyModel();
        ret.name = element.type || element.getType();
        ret.children = [];

        this.getElementSpecificNames(element.object._t).forEach((propertyName) => {
            let propertyValue = element[propertyName];
            if (!propertyValue) {
                const propertyFunction = element['get' + propertyName];
                if (propertyFunction) {
                    propertyValue = propertyFunction.apply(element);
                }
            }
            if (propertyValue || propertyValue === 0) {
                if (propertyName === 'OverallHeight' || propertyName === 'OverallWidth') {
                    propertyValue = this.getNumberWithMeasureUnit(propertyValue, BimMeasureType.ifcLengthMeasure);
                }
                ret.children.push({ name: propertyName, value: propertyValue, children: null });
            }
        });

        this.getNameIfIsEmpty(ret, model, element);

        return ret;
    }

    private getNameIfIsEmpty(ret: BimPropertyModel, model: any, element: any) {
        if (ret.children.filter(x => x.name === 'Name').length === 0) {
            const relDefinesByType = this.getRelDefinesByType(model, element.object);
            if (relDefinesByType) {
                const relatingType = model.objects[relDefinesByType.object._rRelatingType._i];
                const name = (relatingType) ? relatingType.object.Name : '';
                ret.children.push({ name: 'Name', value: name, children: null });
            }
        }
    }

    private getElementSpecificNames(ifcType: string) {
        const specificNames = this.specificPropertyNames[ifcType];

        return specificNames ? this.basicNames.concat(specificNames) : this.basicNames;
    }

    private getRelDefinesByType(model: any, object: any) {
        let ret: any = null;
        const relDefinesType = (object._rIsDefinedBy
            ? object._rIsDefinedBy.filter((x: any) => x._t === 'IfcRelDefinesByType')[0]
            : null);

        if (relDefinesType) {
            ret = model.objects[relDefinesType._i];
        }

        return ret;
    }

    private loadPropertySet(propertySet: any): BimPropertyModel {
        const ret = new BimPropertyModel();

        if (propertySet.name && propertySet.children) {
            ret.name = propertySet.name;

            propertySet.children.forEach((property: any) => {
                ret.children.push({ name: property.name, value: property.NominalValue, children: null });
            });
        } else {
            propertySet.getName((name: string) => {
                ret.name = name;
            });
        }
        return ret;
    }

    private loadElementQuantity(elementQuantity: any): BimPropertyModel {
        const ret = new BimPropertyModel();

        elementQuantity.getName((name: string) => {
            ret.name = name;
        });

        return ret;
    }

    private getProperties(properties: any): BimPropertyModel[] {
        const ret: BimPropertyModel[] = [];

        for (const property of properties) {
            if (property.getNominalValue) {
                ret.push(this.getPropertyNominalValue(property));
            } else if (property.object._t === 'IfcPropertyListValue') {
                ret.push(this.getPropertyListValue(property));
            } else if (property.object._t === 'IfcPropertyBoundedValue') {
                ret.push(this.getPropertyBoundedValue(property));
            } else if (property.object._t === 'IfcPropertyEnumeratedValue') {
                ret.push(this.getPropertyEnumerationValue(property));
            }
        }

        return ret;
    }

    private getPropertyNominalValue(property: any): BimPropertyModel {
        const bimProperty = this.createBimProperty(property);

        property.getNominalValue((value: any) => {
            if (value !== null && value !== undefined) {
                bimProperty.value = this.getNumberWithMeasureUnit(value._v, value._t);
            }
        });

        return bimProperty;
    }

    private getPropertyListValue(property: any): BimPropertyModel {
        let ret: BimPropertyModel;

        property.getListValues((values: []) => {
            ret = this.getPropertyValues(property, values);
        });

        return ret;
    }

    private getPropertyBoundedValue(property: any): BimPropertyModel {
        const bimProperty = this.createBimProperty(property);

        property.getLowerBoundValue((lowerValue: any) => {
            property.getUpperBoundValue((upperValue: any) => {
                bimProperty.value = '[' + lowerValue._v + '; ' + upperValue._v + ']';
            });
        });

        return bimProperty;
    }

    private getPropertyEnumerationValue(property: any): BimPropertyModel {
        let ret: BimPropertyModel;

        property.getEnumerationValues((values: []) => {
            ret = this.getPropertyValues(property, values);
        });

        return ret;
    }

    private getPropertyValues(property: any, values: []): BimPropertyModel {
        const bimProperty = this.createBimProperty(property);
        bimProperty.children = [];

        for (let index = 0; index < values.length; index++) {
            const value: any = values[index];
            const childProperty = new BimPropertyModel();
            childProperty.name = '[' + index + ']';
            childProperty.value = this.getNumberWithMeasureUnit(value._v, value._t);
            bimProperty.children.push(childProperty);
        }

        return bimProperty;
    }

    private createBimProperty(property: any): BimPropertyModel {
        const bimProperty = new BimPropertyModel();
        property.getName((name: string) => {
            bimProperty.name = name;
        });

        return bimProperty;
    }

    private getNumberWithMeasureUnit(number: string | number, measureUnitType: BimMeasureType): string {
        const symbol = this.bimMeasureUnitHelper.getUnitSymbol(measureUnitType);
        return (this.isNumber(number) && symbol ? (+number).toFixed(3) : number) + symbol;
    }

    private isNumber(value: string | number): boolean {
        return ((value != null) && !isNaN(Number(value.toString())));
    }

    private getQuantityValues(quantities: any): BimPropertyModel[] {
        const ret: BimPropertyModel[] = [];

        for (const quantity of quantities) {
            const bimProperty = new BimPropertyModel();
            quantity.getName((name: string) => {
                bimProperty.name = name;
            });

            if (quantity.getAreaValue) {
                quantity.getAreaValue((value: any) => {
                    bimProperty.value = this.getNumberWithMeasureUnit(value, BimMeasureType.ifcAreaMeasure);
                });
            } else if (quantity.getVolumeValue) {
                quantity.getVolumeValue((value: any) => {
                    bimProperty.value = this.getNumberWithMeasureUnit(value, BimMeasureType.ifcVolumeMeasure);
                });
            } else if (quantity.getCountValue) {
                quantity.getCountValue((value: any) => {
                    bimProperty.value = value;
                });
            } else if (quantity.getWeightValue) {
                quantity.getWeightValue((value: any) => {
                    bimProperty.value = this.getNumberWithMeasureUnit(value, BimMeasureType.ifcMassMeasure);
                });
            } else if (quantity.getLengthValue) {
                quantity.getLengthValue((value: any) => {
                    bimProperty.value = this.getNumberWithMeasureUnit(value, BimMeasureType.ifcLengthMeasure);
                });
            } else if (quantity.getTimeValue) {
                quantity.getTimeValue((value: any) => {
                    bimProperty.value = value;
                });
            }

            ret.push(bimProperty);
        }

        return ret;
    }

    private getHasProperties(propertySet: any) {
        const ret = [];
        propertySet.getHasProperties((property: any) => {
            ret.push(property);
        });
        return ret;
    }

    private getQuantities(elementQuantity: any) {
        const ret = [];
        elementQuantity.getQuantities((quantity: any) => {
            ret.push(quantity);
        });
        return ret;
    }

    private getIsTypedBy(element: any) {
        let ret = null;
        element.getIsTypedBy((isDefinedBy: any) => {
            ret = isDefinedBy;
        });
        return ret;
    }

    private getRelatingType(element: any) {
        let ret = null;
        element.getRelatingType((isDefinedBy: any) => {
            ret = isDefinedBy;
        });
        return ret;
    }

    private getHasPropertySets(relatingType: any) {
        const ret = [];
        relatingType.getHasPropertySets((propertySet: any) => {
            ret.push(propertySet);
        });
        return ret;
    }
}
