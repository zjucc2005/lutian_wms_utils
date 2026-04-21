import store from '@/store';
import K3CloudApi from '@/utils/k3cloudapi';

/**
 * 计划订单模型
 */
class PlnPlanOrder {
    static form_id = 'PLN_PLANORDER'
    constructor() {
        
    }
    
    /**
     * 获取计划订单列表
     * @param options:Hash 参数集
     * @param meta:Hash
     *   @field page:Integer
     *   @field per_page:Integer
     *   @field order:String
     * @return {Hash} Promise
     */
    static query(options={}, meta={}) {
        let fields = [ 'FID', 'FComputerNo', 'FBillNo', 'F_PAEZ_JHXH', 'FSaleOrderNo', 'FCreateDate',
                       'FMaterialId.FNumber', 'FMaterialId.FName', 'FMaterialId.FSpecification', 'FUnitId.FName', 
                       'FFirmQty', 'FReleaseBillType.FName', 'FPrdDeptId.FName' ]
        if (meta.fields) fields = meta.fields
        const data = {
            FormId: this.form_id,
            FieldKeys: fields.join(','),
            FilterString: K3CloudApi.query_filter(options),
            Limit: 10000
        }
        if (meta.per_page) {
            data.Limit = meta.per_page
            if (meta.page) data.StartRow = (meta.page - 1) * meta.per_page
        }
        if (meta.order) data.OrderString = meta.order
        return meta.return === 'array' ? K3CloudApi.execute_bill_query(data) : K3CloudApi.bill_query(data)
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

export default PlnPlanOrder