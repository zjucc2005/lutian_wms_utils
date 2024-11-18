import store from '@/store';
import K3CloudApi from '@/utils/k3cloudapi';
import db_model from '@/utils/db_model';

/**
 * 生产订单模型
 */
class PrdMo {
    constructor() {
        
    }

    static FStatusEnum = {
        '1': '计划',
        '2': '计划确认',
        '3': '下达',
        '4': '开工',
        '5': '完工',
        '6': '结案',
        '7': '结算'
    }
    
    /**
     * 获取生产订单列表
     * @param options:Hash 参数集
     * @param meta:Hash
     *   @field page:Integer
     *   @field per_page:Integer
     *   @field order:String
     * @return {Hash} Promise
     */
    static query(options={}, meta={}) {
        const fields = ['FID', 'FDate', 'FBillNo', 'FSaleOrderNo', 'FStatus', 'FPrdOrgId.FName', 'F_LT_CX.FName', 
                        'FMaterialId.FNumber', 'FMaterialId.FName', 'FMaterialId.FName', 'FMaterialId.FSpecification']
        const data = {
            FormId: "PRD_MO",
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
            return K3CloudApi.view('PRD_MO', { Id: id })
        } else {
            return K3CloudApi.view('PRD_MO', { Number: id })
        }
    }
    
}

export default PrdMo