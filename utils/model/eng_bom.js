import K3CloudApi from '@/utils/k3cloudapi'

/**
 * 物料清单
 */
class EngBom {
    static form_id = 'ENG_BOM'
    constructor() {

    }

    static async update(id, options={}) {
        const data = {
            // IsDeleteEntry: false,
            model: {
                FID: id,
                ...options
            }
        }
        return K3CloudApi.save(this.form_id, data)
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
                      'FBomCategory', 'FOperId',
                      'FMaterialId', 'FMaterialId.FNumber', 'FMaterialId.FName', 'FMaterialId.FCategoryId', 'FMaterialId.FImageFileServer', 'FItemModel', 'FUnitId', 'FUnitId.FName', 'FItemPProperty',
                      'FMaterialIdChild', 'FMaterialIdChild.FNumber', 'FMaterialIdChild.FName', 'FMaterialIdChild.FImageFileServer', 'FChildItemModel', 'FChildUnitId', 'FChildUnitId.FName', 'FChildItemProperty'
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
    
    static async find(id) {
        return this.query({ FID: id }, { limit: 1 })
    }
    
    static async view(id) {
        return K3CloudApi.view(this.form_id, { Id: id })
    }
}

export default EngBom