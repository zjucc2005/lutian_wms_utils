import K3CloudApi from '@/utils/k3cloudapi'

/**
 * 前端库存模型
 */
class BdMaterial {
    static form_id = 'BD_MATERIAL'
    constructor() {

    }

    static async update(id, options={}) {
        const data = {
            model: {
                FMaterialId: id,
                ...options
            }
        }
        return K3CloudApi.save(this.form_id, data)
    }
    
    /** 
     * 搜索物料基础数据(模糊匹配)
     * @param options:Hash 参数集
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
    
    /**
     * 搜索存货类别数据
     * @param options:Hash 参数集
     * @param meta:Hash 
     *   @field page:Integer
     *   @field per_page:Integer
     *   @field order:String
     * @return {Hash} Promise
     */
    static async categories (options={}, meta={}) {
        let fields = ['FMasterId', 'FNumber', 'FName', 'FDocumentStatus', 'FForbidStatus', 'FCreateOrgId', 'FCreateOrgId.FName', 'FUseOrgId', 'FUseOrgId.FName']
        const data = {
            FormId: 'BD_MATERIALCATEGORY',
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
        return K3CloudApi.view(this.form_id, { Id: id })
    }
}

export default BdMaterial