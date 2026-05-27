import store from '@/store';
import K3CloudApi from '@/utils/k3cloudapi';

/**
 * 销售订单
 */
class SalSaleOrder {
    static form_id = 'SAL_SaleOrder'
    constructor() {
        
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
        let fields = ['FID', 'FCreateDate', 'FBillNo', 'F_PAEZ_BaseProperty1',
                      'FSrcBillNo', 'F_PAEZ_JHXH', 'FMaterialId.FNumber', 'FMaterialId.FName', 'FMaterialId.FSpecification',
                      'FQty', 'FUnitId.FName', 'FBomId.FNumber'
                      ]
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
    
    static view(id) {
        if (typeof(id) == 'number') {
            return K3CloudApi.view(this.form_id, { Id: id })
        } else {
            return K3CloudApi.view(this.form_id, { Number: id })
        }
    }
    
}

export default SalSaleOrder