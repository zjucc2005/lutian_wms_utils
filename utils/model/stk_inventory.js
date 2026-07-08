import store from '@/store';
import K3CloudApi from '@/utils/k3cloudapi';
import db_model from '@/utils/db_model';

/**
 * 即时库存模型
 */
class StkInventory {
    static form_id = 'STK_Inventory'
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
        let fields = ['FMaterialId', 'FMaterialId.FNumber', 'FMaterialId.FName', 'FMaterialId.FSpecification', 
                      'FStockUnitId.FName', 'FQty', 'FBaseQty', 'FBaseUnitId.FName', 
                      'FStockName', 'FStockId', 'FStockOrgId', 'FStockOrgId.FName']
        if (meta.fields) fields = meta.fields
        const data = {
            FormId: "STK_Inventory",
            FieldKeys: fields.join(','),
            FilterString: K3CloudApi.query_filter({ FBaseQty_gt: 0, ...options }),
            Limit: 10000
        }
        if (meta.per_page) {
            data.Limit = meta.per_page
            if (meta.page) data.StartRow = (meta.page - 1) * meta.per_page
        }
        if (meta.order) data.OrderString = meta.order
        return meta.return === 'array' ? K3CloudApi.execute_bill_query(data) : K3CloudApi.bill_query(data)
    }
    
    
    /**
     * 获取当前所有(金蝶)库存数据
     * @return {Array[Hash]}
     */
    static async get_all(options={}, meta={}) {
        let data = [] // 返回数据
        
        options.FStockId = store.state.cur_stock.FStockId
        let filter_string = K3CloudApi.query_filter({ FBaseQty_gt: 0, ...options })
        let fields = ['FMaterialId', 'FMaterialId.FNumber', 'FMaterialId.FName', 'FMaterialId.FSpecification', 'FBaseQty', 'FBaseUnitId.FName']
        
        let response = null
        let page = 1
        let per_page = 10000
        while (!response || response.data.length === per_page) {
            let params = {
                FormId: this.form_id,
                FieldKeys: fields.join(','),
                FilterString: filter_string,
                StartRow: (page - 1) * per_page,
                Limit: per_page,
                OrderString: 'FMaterialId.FNumber ASC'
            }
            response = await K3CloudApi.execute_bill_query(params)
            // 本地重新组装成键值对，方便使用
            for (let d of response.data) {
                let obj = {}
                for (let i = 0; i < fields.length; i++) obj[fields[i]] = d[i]
                data.push(obj)
            }
            page++
        }
        return data
    }
}

export default StkInventory