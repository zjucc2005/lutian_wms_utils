import K3CloudApi from '@/utils/k3cloudapi'

/**
 * 物料清单
 */
class EngBom {
    constructor() {

    }

    /** 
     * 搜索
     * @param options:Hash 参数集
     * @param meta:Hash
     *   @field page:Integer
     *   @field per_page:Integer
     *   @field order:String
     * @return {Hash} Promise
     */
    static async query (options={}, meta={}) {
        let fields = ['FID', "FName", "FNumber", "FForbidStatus", "FDocumentStatus", 'FUseOrgId', 'FUseOrgId.FName', 
                      'FBomCategory', "FMaterialId", 'FMaterialId.FNumber', 'FItemName', 'FItemModel', 'FOperId', 'FITEMPPROPERTY']
        const data = {
            FormId: 'ENG_BOM',
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
    
    static async find(id) {
        return this.query({ FID: id }, { limit: 1 })
    }
    
    static async view(id) {
        return K3CloudApi.view('ENG_BOM', { Id: id })
    }
}

export default EngBom