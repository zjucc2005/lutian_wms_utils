import K3CloudApi from '@/utils/k3cloudapi'

class StkOutStockApply {
    static form_id = 'STK_OutStockApply'
    constructor() {
        
    }
    
    /** 
     * @param options:Hash 参数集
     * @param meta:Hash 
     *   @field page:Integer
     *   @field per_page:Integer
     *   @field order:String
     * @return {Hash} Promise
     */
    static async query (options={}, meta={}) {
        let fields = ['FID', 'FBillNo', 'FDeptId', 'FDeptId.FName',
                      'FMaterialId', 'FMaterialId.FNumber', 'FMaterialId.FName', 'FMaterialId.FSpecification', 'FMaterialId.F_PAEZ_Base1',
                      'FStockId', 'FStockId.FName',
                      'FQty', 'FUnitId', 'FUnitId.FName', 'FBaseQty', 'FBaseUnitId', 'FBaseUnitId.FName'
                      ]
        if (meta.fields) fields = meta.fields
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
        if (typeof(id) == 'number') {
            return K3CloudApi.view(this.form_id, { Id: id })
        } else {
            return K3CloudApi.view(this.form_id, { Number: id })
        }
    }
}

export default StkOutStockApply