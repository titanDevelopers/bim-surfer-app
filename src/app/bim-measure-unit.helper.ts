import { Dictionary } from 'lodash';
import { Injectable } from '@angular/core';
import { BimMeasureType } from './bim-measure-type.enum';

@Injectable()
export class BimMeasureUnitHelper {

    private unitSymbols: Dictionary<string>;
    private units: Dictionary<string>;

    constructor() {
        this.loadUnitSymbols();
    }

    loadUnits(apiModel: any) {
        this.loadIfcUnit(apiModel);
    }

    getUnitSymbol(measureUnitType: BimMeasureType): string {
        const unit = this.units[measureUnitType];
        return unit ? ' ' + unit : '';
    }

    private loadIfcUnit(apiModel: any) {
        this.units = {};
        apiModel.getAllOfType('IfcUnitAssignment', true, (ifcUnitAssignment: any) => {
            const ifcUnits = this.getUnits(ifcUnitAssignment);
            ifcUnits.forEach((unit: any) => {
                if (unit.object.UnitType === 'AREAUNIT') {
                    this.units[BimMeasureType.ifcAreaMeasure] = this.getUnit(unit.object);
                } else if (unit.object.UnitType === 'VOLUMEUNIT') {
                    this.units[BimMeasureType.ifcVolumeMeasure] = this.getUnit(unit.object);
                } else if (unit.object.UnitType === 'LENGTHUNIT') {
                    this.units[BimMeasureType.ifcLengthMeasure] = this.getUnit(unit.object);
                    this.units[BimMeasureType.ifcPositiveLengthMeasure] = this.units[BimMeasureType.ifcLengthMeasure];
                } else if (unit.object.UnitType === 'MASSUNIT') {
                    this.units[BimMeasureType.ifcMassMeasure] = this.getUnit(unit.object);
                }
            });
        });
    }

    private getUnits(ifcUnitAsignment: any): any[] {
        const ret = [];
        ifcUnitAsignment.getUnits((unit: any) => {
            ret.push(unit);
        });
        return ret;
    }

    private getUnit(unit: any): string {
        return this.convertUnitToSymbol((unit.Prefix ? unit.Prefix : '') + unit.Name);
    }

    private convertUnitToSymbol(measureUnit: string): string {
        const symbol = this.unitSymbols[measureUnit];
        return symbol ? symbol : measureUnit;
    }

    private loadUnitSymbols() {
        this.unitSymbols = {};
        this.unitSymbols['KILOCUBIC_METRE'] = 'km3';
        this.unitSymbols['CUBIC_METRE'] = 'm3';
        this.unitSymbols['DECICUBIC_METRE'] = 'dm3';
        this.unitSymbols['CENTICUBIC_METRE'] = 'cm3';
        this.unitSymbols['MILLICUBIC_METRE'] = 'mm3';

        this.unitSymbols['KILOSQUARE_METRE'] = 'km2';
        this.unitSymbols['SQUARE_METRE'] = 'm2';
        this.unitSymbols['DECISQUARE_METRE'] = 'dm2';
        this.unitSymbols['CENTISQUARE_METRE'] = 'cm2';
        this.unitSymbols['MILLISQUARE_METRE'] = 'mm2';

        this.unitSymbols['KILOMETRE'] = 'km';
        this.unitSymbols['METRE'] = 'm';
        this.unitSymbols['DECIMETRE'] = 'dm';
        this.unitSymbols['CENTIMETRE'] = 'cm';
        this.unitSymbols['MILLIMETRE'] = 'mm';

        this.unitSymbols['TON'] = 't';
        this.unitSymbols['KILOGRAM'] = 'kg';
        this.unitSymbols['HECTOGRAM'] = 'hg';
        this.unitSymbols['DECAGRAM'] = 'dag';
        this.unitSymbols['GRAM'] = 'g';
        this.unitSymbols['DECIGRAM'] = 'dg';
        this.unitSymbols['CENTIGRAM'] = 'cg';
        this.unitSymbols['MILLIGRAM'] = 'mg';
    }
}
