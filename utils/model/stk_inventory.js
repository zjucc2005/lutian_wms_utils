import store from '@/store';
import K3CloudApi from '@/utils/k3cloudapi';
import db_model from '@/utils/db_model';

/**
 * 即时库存模型
 */
class StkInventory {
    constructor() {
        
    }
        
    /**
     * 查询列表
     * @param options:Hash 参数集
     *   @field FMaterialId.FNumber:String
     * @param meta:Hash
     *   @field page:Integer
     *   @field per_page:Integer
     *   @field order:String
     * @return {Hash} Promise
     */
    static query(options={}, meta={}) {
        const fields = ['FBaseQty', 'FBaseUnitId.FName', 'FMaterialId', 'FMaterialId.FNumber', 'FMaterialId.FName', 'FMaterialId.FSpecification',
                        'FStockName', 'FStockId', 'FStockOrgId', 'FStockOrgId.FName' ]
        const data = {
            FormId: "STK_Inventory",
            FieldKeys: fields.join(','),
            FilterString: K3CloudApi.query_filter({ FBaseQty_gt: 0, ...options })
        }
        if (meta.per_page) {
            data.Limit = meta.per_page
            if (meta.page) data.StartRow = (meta.page - 1) * meta.per_page
        }
        if (meta.order) data.OrderString = meta.order
        return K3CloudApi.bill_query(data)
    }
        
}

export default StkInventory