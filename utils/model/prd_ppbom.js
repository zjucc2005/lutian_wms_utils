import store from '@/store';
import K3CloudApi from '@/utils/k3cloudapi';
import db_model from '@/utils/db_model';

/**
 * 生产用料清单模型
 */
class PrdPpbom {
    static form_id = 'PRD_PPBOM'
    constructor() {
        
    }
    
    static FIssueTypeEnum = {
        '1': '直接领料',
        '2': '直接倒冲',
        '3': '调拨领料',
        '4': '调拨倒冲',
        '7': '不发料'
    }
    
    /**
     * 获取列表
     * @param options:Hash 参数集
     * @param meta:Hash
     *   @field page:Integer
     *   @field per_page:Integer
     *   @field order:String
     * @return {Hash} Promise
     */
    static query(options={}, meta={}) {
        const fields = ['FID', 'FBillNo', 'FMoBillNo', 'FMoEntrySeq', 'FSaleOrderNo',
                        'FMaterialId', 'FMaterialId.FNumber',
                        'FMaterialId2', 'FMaterialId2.FNumber', 'FMaterialId2.FName', 'FMaterialId2.FSpecification', 'FMaterialType', 
                        'FNumerator', 'FDenominator', 'FUnitId2', 'FUnitId2.FName', 'FMustQty', 'FPickedQty', 'FMtoNo', 'FIssueType',
                        'FOwnerId', 'FOwnerId.FName', 'FStockId', 'FStockId.FName'
                       ]
        const data = {
            FormId: this.form_id,
            FieldKeys: fields.join(','),
            FilterString: K3CloudApi.query_filter(options)
        }
        if (meta.per_page) {
            data.Limit = meta.per_page
            if (meta.page) data.StartRow = (meta.page - 1) * meta.per_page
        }
        if (meta.order) data.OrderString = meta.order
        return K3CloudApi.bill_query(data)
    }
    
    static find(id) {
        return this.query({ FID: id }, { limit: 1 })
    }
    
    static view(id) {
        if (typeof(id) == 'number') {
            return K3CloudApi.view(this.form_id, { Id: id })
        } else {
            return K3CloudApi.view(this.form_id, { Number: id })
        }
    }
    
}

export default PrdPpbom