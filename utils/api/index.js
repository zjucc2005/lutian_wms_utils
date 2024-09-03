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
        FieldKeys: "FName,FNumber,FForbiddenStatus,FBIZORGID,FBIZORGID.FName,FDEPTID,FDEPTID.FName",
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
    return K3CloudApi.bill_query(data).then(res => {
        return Promise.resolve(res)
    })
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
        FieldKeys: 'FMaterialId,FName,FNumber,FBaseUnitId,FBaseUnitId.FNumber,FBaseUnitId.FName,FMaterialGroup.FName,FUseOrgId,FUseOrgId.FName',
        FilterString: [
            { Left: "", FieldName: "FNumber", Compare: "67", Value: material_no, Right: "", Logic: 0 },
            { Left: "", FieldName: "FUseOrgId", Compare: "67", Value: use_org_id, Right: "", Logic: 0 }
        ]
    }
    return K3CloudApi.bill_query(data).then(res => {
        return Promise.resolve(res)
    })
}

/** 
 * 获取计量单位基础数据
 * @return {Hash} Promise
 */
// const get_bd_units = async () => {
//     const data = {
//         FormId: "BD_UNIT",
//         FieldKeys: "FUnitId,FName,FNumber",
//         FilterString: [
//             { Left: "", FieldName: "FIsBaseUnit", Compare: "74", Value: true, Right: "", Logic: 0 },
//             { Left: "", FieldName: "FDocumentStatus", Compare: "105", Value: "C", Right: "", Logic: 0 },
//             { Left: "", FieldName: "FForbidStatus", Compare: "105", Value: "A", Right: "",Logic: 0 }
//         ],
//         OrderString: "FName ASC"
//     }
//     return K3CloudApi.bill_query(data).then(res => {
//         return Promise.resolve(res)
//     })
// }

export {
    validate_staff,
    get_bd_stocks,
    get_bd_material
    // get_bd_units,
}