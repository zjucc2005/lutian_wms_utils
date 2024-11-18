import K3CloudApi from '@/utils/k3cloudapi'

/**
 * 前端库存模型
 */
class BdMaterial {
    constructor() {

    }

    static async update(id, options={}) {
        const data = {
            model: {
                FMaterialId: id,
                ...options
            }
        }
        return K3CloudApi.save('BD_MATERIAL', data)
    }
    
    /** 
     * 搜索物料基础数据(模糊匹配)
     * @param options:Hash 参数集
     *   @field no:String 搜索关键字，编码/名称/规格模糊匹配
     * @param meta:Hash 
     *   @field page:Integer
     *   @field per_page:Integer
     *   @field order:String
     * @return {Hash} Promise
     */
    static async query (options={}, meta={}) {
        let fields = ["FMaterialId", "FName", "FNumber", "FSpecification", "FForbidStatus", "FDocumentStatus", 
                      "FBaseUnitId", "FBaseUnitId.FNumber", "FBaseUnitId.FName", "FMaterialGroup.FName", "FUseOrgId", 
                      "FUseOrgId.FName", "FImageFileServer"]
        const data = {
            FormId: 'BD_MATERIAL',
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
        return this.query({ FMaterialId: id }, { limit: 1 })
    }
    
    static async view(id) {
        return K3CloudApi.view('BD_MATERIAL', { Id: id })
    }
}

export default BdMaterial