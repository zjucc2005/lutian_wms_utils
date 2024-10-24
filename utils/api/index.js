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
    const data = {
        FormId: "BD_WAREHOUSEWORKERS",
        FieldKeys: "FName,FNumber,FForbiddenStatus,FBIZORGID,FBIZORGID.FName,FDEPTID,FDEPTID.FName,FOPERATORGROUPID,FOPERATORGROUPID.FName",
        FilterString: [
            {"Left":"","FieldName":"FName","Compare":"67","Value":staff_name,"Right":"","Logic":0},
            {"Left":"","FieldName":"FNumber","Compare":"67","Value":staff_no,"Right":"","Logic":0},
            {"Left":"","FieldName":"FBIZORGID","Compare":"67","Value":org_id,"Right":"","Logic":0}
        ]
    }
    return K3CloudApi.bill_query(data).then(res => {  
        return Promise.resolve(res.data[0])
    })
}

/** 
 * 获取仓库基础数据
 * @return {Hash} Promise
 */
const get_bd_stocks = async () => {
    const data = {
        FormId: 'BD_STOCK',
        FieldKeys: "FStockId,FName,FNumber,FGroup,FGroup.FName,FUseOrgId,FUseOrgId.FName",
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
        FieldKeys: 'FMaterialId,FName,FNumber,FSpecification,FForbidStatus,FDocumentStatus,FBaseUnitId,FBaseUnitId.FNumber,FBaseUnitId.FName,FMaterialGroup.FName,FUseOrgId,FUseOrgId.FName',
        FilterString: [
            { Left: "", FieldName: "FNumber", Compare: "67", Value: material_no, Right: "", Logic: 0 },
            { Left: "", FieldName: "FUseOrgId", Compare: "67", Value: use_org_id, Right: "", Logic: 0 }
        ]
    }
    return K3CloudApi.bill_query(data)
}

/** 
 * 搜索物料基础数据(模糊匹配)
 * @param options:Hash 参数集
 *   @field no:String 搜索关键字
 *   @field FNumber_pre:String 编码开头
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
        FieldKeys: 'FMaterialId,FName,FNumber,FSpecification,FForbidStatus,FDocumentStatus,FBaseUnitId,FBaseUnitId.FNumber,FBaseUnitId.FName,FMaterialGroup.FName,FUseOrgId,FUseOrgId.FName',
        FilterString: [
            { Left: "", FieldName: "FUseOrgId", Compare: "67", Value: options.FUseOrgId, Right: "", Logic: 0 },
            { Left: "(",FieldName: "FNumber", Compare: "17", Value: options.no, Right: "", Logic: 1 },
            { Left: "", FieldName: "FName", Compare: "81", Value: options.no, Right:"", Logic: 1 },
            { Left: "", FieldName: "FSpecification", Compare: "81", Value: options.no, Right: ")", Logic: 0 }
        ]
    }
    if (options.FNumber_pre) {
        data.FilterString.push({ Left: "", FieldName: "FNumber", Compare: "60", Value: options.FNumber_pre, Right: "", Logic: 0 })
    }
    if (meta.per_page) {
        data.Limit = meta.per_page
        if (meta.page) data.StartRow = (meta.page - 1) * meta.per_page
    }
    if (meta.order) data.OrderString = meta.order
    return K3CloudApi.bill_query(data)
}

// const get_all_bd_materials = async (use_org_id) => {
//     let options = { FUseOrgId: use_org_id }
//     let meta = { page: 1, per_page: 10000, order: 'FNumber ASC' }
//     let sum_data = []
//     sum_data = await _get_all_bd_materials_recurse(options, meta, sum_data)
//     return sum_data
// }

// const _get_all_bd_materials_recurse = async (options={}, meta={}, sum_data=[]) => {
//     const data = {
//         FormId: "BD_MATERIAL",
//         // FieldKeys: '',
//         FilterString: []
//     }
//     if (options.FUseOrgId) {
//         data.FilterString.push({ Left: "", FieldName: "FUseOrgId", Compare: "67", Value: options.FUseOrgId, Right: "", Logic: 0 })
//     }
//     if (meta.per_page) {
//         data.Limit = meta.per_page
//         if (meta.page) data.StartRow = (meta.page - 1) * meta.per_page
//     }
//     if (meta.order) data.OrderString = meta.order
//     let res = await K3CloudApi.bill_query(data)
//     sum_data = sum_data.concat(res.data)
//     if (res.data.length === meta.per_page) {
//         meta.page += 1 // 翻页
//         return _get_all_bd_materials_recurse(options, meta, sum_data)
//     } else {
//         return sum_data 
//     }
// }

/** 
 * 获取发货通知单详情
 * @param bill_no:String 单据编号
 * @return {Hash} Promise
 */
const get_sal_deliverynotice = async (bill_no) => {
    return K3CloudApi.view('SAL_DELIVERYNOTICE', { Number: bill_no })
}

/** 
 * 获取直接调拨单详情
 * @param bill_no:String 单据编号
 * @return {Hash} Promise
 */
const get_transfer_direct = async (bill_no) => {
    return K3CloudApi.view('STK_TransferDirect', { Number: bill_no })
}

export {
    validate_staff,
    get_bd_stocks,
    get_bd_material,
    search_bd_materials,
    // get_all_bd_materials,
    get_sal_deliverynotice,
    get_transfer_direct
    // get_bd_units,
}