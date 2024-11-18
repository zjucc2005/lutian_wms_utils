/**
 * 调用API的方法名，命名规则，模型或表名用 Example 示例
 * 查看 view: get_example
 * 查询 bill_query: get_examples
 * 保存 save: post_example
 * 批量保存 batch_save: post_examples
 * 删除 delete: delete_examples
 */
import K3CloudApi from "@/utils/k3cloudapi";

/** 
 * 员工登录认证
 * @return { Hash/undefined } Promise
 */
const validate_staff = async (staff_name, staff_no, org_id) => {
    let fields = ['FID', 'FName', 'FNumber', 'FForbiddenStatus', 'FBizOrgId', 'FBizOrgId.FName', 'FDeptId', 'FDeptId.FName']
    const data = {
        FormId: "BD_WAREHOUSEWORKERS",
        FieldKeys: fields.concat(['FOperatorGroupId', 'FOperatorGroupId.FName']).join(','),
        FilterString: K3CloudApi.query_filter({ FName: staff_name, FNumber: staff_no, FBizOrgId: org_id })
    }
    return K3CloudApi.bill_query(data).then(res => {
        if (res.data.length === 0) {
            return Promise.resolve(null)
        } else {
            let result = { FOperatorGroup: [] }
            for (let i in fields) {
                result[fields[i]] = res.data[0][fields[i]]
            }
            for (let i in res.data) {
                result.FOperatorGroup.push(res.data[i]['FOperatorGroupId.FName'])
            }
            return Promise.resolve(result)
        }
    })
}

/** 
 * 获取仓库基础数据
 * @return {Hash} Promise
 */
const get_bd_stocks = async () => {
    const data = {
        FormId: 'BD_STOCK',
        FieldKeys: "FStockId,FName,FNumber,FGroup,FGroup.FName,FUseOrgId,FUseOrgId.FName,FDocumentStatus,FForbidStatus",
    }
    return K3CloudApi.bill_query(data)
}

/** 
 * 获取供应商基础数据
 * @param supplier_no:String 供应商编码
 * @param use_org_id:Integer 使用组织ID
 * @return {Hash} Promise
 */
const get_bd_supplier = async (supplier_no, use_org_id) => {
    const data = {
        FormId: 'BD_Supplier',
        FieldKeys: 'FSupplierId,FName,FNumber',
        FilterString: K3CloudApi.query_filter({ FNumber: supplier_no, FUseOrgId: use_org_id })
    }
    return K3CloudApi.bill_query(data)
}

/** 
 * 获取物料基础数据
 * @param material_no:String 物料编码
 * @param use_org_id:Integer 使用组织ID
 * @return {Hash} Promise
 */
const get_bd_material = async (material_no, use_org_id) => {
    const data = {
        FormId: 'BD_MATERIAL',
        FieldKeys: 'FMaterialId,FName,FNumber,FSpecification,FForbidStatus,FDocumentStatus,FBaseUnitId,FBaseUnitId.FNumber,FBaseUnitId.FName,FMaterialGroup.FName,FUseOrgId,FUseOrgId.FName,FImageFileServer',
        FilterString: K3CloudApi.query_filter({ FNumber: material_no, FUseOrgId: use_org_id }) 
    }
    return K3CloudApi.bill_query(data)
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
const search_bd_materials = async (options, meta) => {
    const data = {
        FormId: 'BD_MATERIAL',
        FieldKeys: 'FMaterialId,FName,FNumber,FSpecification,FForbidStatus,FDocumentStatus,FBaseUnitId,FBaseUnitId.FNumber,FBaseUnitId.FName,FMaterialGroup.FName,FUseOrgId,FUseOrgId.FName,FImageFileServer',
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

export {
    validate_staff,
    get_bd_stocks,
    get_bd_supplier,
    get_bd_material,
    search_bd_materials
}