import store from '@/store';
import K3CloudApi from '@/utils/k3cloudapi';
import db_model from '@/utils/db_model';

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
     *   @field FMaterialId:Integer
     *   @field no:String 搜索关键字，编码/名称/规格模糊匹配
     *   @field FName_cont:String 名称匹配
     *   @field FNumber_cont:String 编码匹配
     *   @field FNumber_pre:String 编码开头
     *   @field FSpecification_cont:String 规格匹配
     *   @field FUseOrgId:Integer 使用组织ID
     * @param meta:Hash 
     *   @field page:Integer
     *   @field per_page:Integer
     *   @field order:String
     * @return {Hash} Promise
     */
    static query (options={}, meta={}) {
        let fields = ["FMaterialId", "FName", "FNumber", "FSpecification", "FForbidStatus", "FDocumentStatus", "FBaseUnitId", "FBaseUnitId.FNumber", "FBaseUnitId.FName", "FMaterialGroup.FName", "FUseOrgId", "FUseOrgId.FName", "FImageFileServer"]
        const data = {
            FormId: 'BD_MATERIAL',
            FieldKeys: fields.join(','),
            FilterString: []
        }
        if (options.FMaterialId) {
            data.FilterString.push({ Left: "", FieldName: "FMaterialId", Compare: "67", Value: options.FMaterialId, Right: "", Logic: 0 })
        }
        if (options.no) {
            data.FilterString.push({ Left: "(",FieldName: "FNumber", Compare: "17", Value: options.no, Right: "", Logic: 1 })
            data.FilterString.push({ Left: "", FieldName: "FName", Compare: "81", Value: options.no, Right:"", Logic: 1 })
            data.FilterString.push({ Left: "", FieldName: "FSpecification", Compare: "81", Value: options.no, Right: ")", Logic: 0 })
        }
        if (options.FName_cont) {
            data.FilterString.push({ Left: "", FieldName: "FName", Compare: "81", Value: options.FName_cont, Right: "", Logic: 0 })
        }
        if (options.FNumber_cont) {
            data.FilterString.push({ Left: "", FieldName: "FNumber", Compare: "17", Value: options.FNumber_cont, Right: "", Logic: 0 })
        }
        if (options.FNumber_pre) {
            data.FilterString.push({ Left: "", FieldName: "FNumber", Compare: "60", Value: options.FNumber_pre, Right: "", Logic: 0 })
        }
        if (options.FSpecification_cont) {
            data.FilterString.push({ Left: "", FieldName: "FSpecification", Compare: "81", Value: options.FSpecification_cont, Right: "", Logic: 0 })
        }
        if (options.FUseOrgId) {
            data.FilterString.push({ Left: "", FieldName: "FUseOrgId", Compare: "67", Value: options.FUseOrgId, Right: "", Logic: 0 })
        }
        if (meta.per_page) {
            data.Limit = meta.per_page
            if (meta.page) data.StartRow = (meta.page - 1) * meta.per_page
        }
        if (meta.order) data.OrderString = meta.order
        return K3CloudApi.bill_query(data)
    }
    
    static find(id) {
        return this.query({ FMaterialId: id }, { limit: 1 })
    }
    
    static view(id) {
        if (typeof(id) == 'number') {
            return K3CloudApi.view('BD_MATERIAL', { Id: id })
        } else {
            return K3CloudApi.view('BD_MATERIAL', { Number: id })
        }
    }
    
}

export default BdMaterial