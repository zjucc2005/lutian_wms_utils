import { EngBom } from '@/utils/model';

const get_bomid = async (no) => {
    let options = { 'FMaterialId.FNumber': no }
    let meta = {
        fields: ['FID', 'FNumber', 'FMaterialId.FNumber'],
        order: 'FNumber DESC'
    }
    let res = await EngBom.query(options, meta)
    return res.data.length ? res.data[0]['FID'] : 0
}

const load_bom_children = async (id) => {
    let meta = {
        fields: ['FBomId', 'FBomId.FNumber', 'FMaterialIdChild.FNumber', 'FMaterialIdChild.FName', 'FMaterialIdChild.FSpecification', 
                 'FChildUnitId.FName', 'FNumerator', 'FDenominator', 'FChildItemProperty' ],
        order: 'FReplaceGroup ASC'
    }
    let res = await EngBom.query({ FID: id }, meta)
    let bom = []
    for (let d of res.data) {
        bom.push({
            bomid: d['FBomId'],
            bomver: d['FBomId.FNumber'],
            no: d['FMaterialIdChild.FNumber'],
            name: d['FMaterialIdChild.FName'],
            spec: d['FMaterialIdChild.FSpecification'],
            unit: d['FChildUnitId.FName'],
            numerator: d['FNumerator'],
            denominator: d['FDenominator'],
            prop: d['FChildItemProperty'],
            is_root: false,
            is_open: false,
            is_load: d['FChildItemProperty'] == '1'
        })
    }
    return bom
}

export {
    get_bomid,
    load_bom_children
}