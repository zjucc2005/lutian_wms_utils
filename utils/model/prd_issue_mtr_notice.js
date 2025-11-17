import K3CloudApi from '@/utils/k3cloudapi'

class PrdIssueMtrNotice {
    static form_id = 'PRD_ISSUEMTRNOTICE'
    constructor() {
        
    }
    
    static async update(id, options={}) {
        const data = {
            IsDeleteEntry: false,
            Model: {
                FID: id,
                ...options
            }
        }
        return K3CloudApi.save(this.form_id, data)
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
        let fields = ['FID', 'FBillNo', 'FDocumentStatus', 'FCloseStatus', 'FCreateDate', 
                      'F_PAEZ_Base', 'F_PAEZ_Base.FName',
                      'FDetailEntity_FSeq', 'FDetailEntity_FEntryId',
                      'FMaterialId', 'FMaterialId.FNumber', 'FMaterialId.FName', 'FMaterialId.FSpecification', 'F_PAEZ_BaseProperty1',
                      'FStockId', 'FStockId.FName',
                      'FMustQty', 'FUnitId1', 'FUnitId1.FName', 'FBaseMustQty', 'FBaseUnitId1', 'FBaseUnitId1.FName'
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

export default PrdIssueMtrNotice