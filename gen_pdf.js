// 1. 为了兼容electron打包后的文件路径问题，本文件放到根目录
// 2. 不能兼容APP，打包apk时，需加上#ifdef H5条件编译
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import store from '@/store'
import { compare_loc_no } from '@/utils'
import { InvPlan } from '@/utils/model'
import { formatDate } from '@/uni_modules/uni-dateformat/components/uni-dateformat/date-format.js' 

const font_file_path = './static/font/SourceHanSansCN-Normal.ttf'
const font_family = 'SourceHanSansCN'

const pdf_template_inv_plans_in = (inv_plans) => {
    let options = {
        title: '绿田机械股份有限公司',
        subtitle: '入库计划',
        bill_no: '',
        stock_name: '',
        table_head: ['序号', '品名', '规格', '数量', '单位', '托数', '仓位号', '备注'],
        table_body: [['序号', '品名', '规格', '数量', '单位', '托数', '仓位号', '备注']]
    }
    let group = {}
    let inv_plans_sorted = inv_plans.sort((x, y) => x['FMaterialId.FNumber'] > y['FMaterialId.FNumber'] ? 1 : -1 )
    for (let i = 0; i < inv_plans_sorted.length; i++) {
        let inv_plan = inv_plans_sorted[i]
        options.bill_no ||= inv_plan.FBillNo
        options.stock_name ||= inv_plan['FStockId.FName']
        if (group.material_no) {
            if (group.material_no == inv_plan['FMaterialId.FNumber']) {
                group.qty += inv_plan.FOpQTY
            } else {
                options.table_body.push(['', group.material_no, '小计', group.qty, '', '', '', ''])
                group = { material_no: inv_plan['FMaterialId.FNumber'], qty: inv_plan.FOpQTY }
            }
        } else {
            group = { material_no: inv_plan['FMaterialId.FNumber'], qty: inv_plan.FOpQTY }
        }
        options.table_body.push(
            [
                i+1, 
                inv_plan['FMaterialId.FName'], 
                inv_plan['FMaterialId.FSpecification'],
                inv_plan.FOpQTY,
                inv_plan['FStockUnitId.FName'],
                inv_plan.FPalletQty,
                inv_plan['FStockLocId.FNumber'],
                inv_plan.FRemark
            ]
        )
    }
    options.table_body.push(['', group.material_no, '小计', group.qty, '', '', '', ''])
    // 初始化jsPDF对象
    let f = new jsPDF()
    f.addFont(font_file_path, font_family, 'normal') // 加载字体
    f.setFont(font_family) // 设置字体
    let page_width = f.internal.pageSize.getWidth()
    // 标题
    f.setFontSize(20)
    let title_x = (page_width - f.getTextWidth(options.title)) / 2
    f.text(options.title, title_x, 15)
    // 副标题
    f.setFontSize(12)
    let subtitle_x = (page_width - f.getTextWidth(options.subtitle)) / 2
    f.text(options.subtitle, subtitle_x, 22)
    // 单号标识
    f.setFontSize(10)
    f.text(`入库单号：${options.bill_no}`, 10, 25)
    f.text(`入库仓库：${options.stock_name}`, 10, 30)
    f.text(`打印时间：${formatDate(Date.now(), 'yyyy-MM-dd hh:mm:ss')}`, 150, 30)
    // 表格
    let textWidth_1 = 0
    let textWidth_6 = 0
    for (let item of options.table_body) {
        textWidth_1 = Math.max(textWidth_1, f.getTextWidth(item[1])) // 品名字符最小宽度
        textWidth_6 = Math.max(textWidth_6, f.getTextWidth(item[6])) // 仓位号字符最小宽度
    }
    f.autoTable({
        theme: 'grid',
        startY: 32,
        margin: { left: 10, right: 10, top: 10, bottom: 10 },
        styles: { font: 'SourceHanSansCN', fontSize: 10, cellPadding: 1, minCellWidth: 9 },
        headStyles: { fillColor: 0, halign: 'center'},
        bodyStyles: { textColor: 0, lineColor: 120 },
        columnStyles: {
            0: { halign: 'center' },
            1: { minCellWidth: textWidth_1 + 2 },
            3: { halign: 'center' },
            4: { halign: 'center' },
            5: { halign: 'center' },
            6: { minCellWidth: textWidth_6 + 2 }
        },
        head: [],
        body: options.table_body
    })
    let blob = f.output('blob') // 生成PDF文件的Blob对象
    let url = URL.createObjectURL(blob) // 生成指向Blob对象的URL
    return url
}

const pdf_template_inv_plans_out = (inv_plans, _options={}) => {
    let options = {
        title: '绿田机械股份有限公司',
        subtitle: '发货通知单拣货计划',
        bill_no: '',
        stock_name: '',
        table_head: ['序号', '品名', '规格', '数量', '单位', '仓位号', '备注'],
        table_body: [['序号', '品名', '规格', '数量', '单位', '仓位号', '备注']],
        ..._options
    }
    let group = {}
    // let inv_plans_sorted = inv_plans.sort((x, y) => x['FMaterialId.FNumber'] > y['FMaterialId.FNumber'] ? 1 : -1 )
    for (let i = 0; i < inv_plans.length; i++) {
        let inv_plan = inv_plans[i]
        options.bill_no ||= inv_plan.FBillNo
        options.stock_name ||= inv_plan['FStockId.FName']
        if (group.material_no) {
            if (group.material_no == inv_plan['FMaterialId.FNumber']) {
                group.qty += inv_plan.FOpQTY
            } else {
                options.table_body.push(['', group.material_no, '小计', group.qty, '', '', '', ''])
                group = { material_no: inv_plan['FMaterialId.FNumber'], qty: inv_plan.FOpQTY }
            }
        } else {
            group = { material_no: inv_plan['FMaterialId.FNumber'], qty: inv_plan.FOpQTY }
        }
        options.table_body.push(
            [
                i+1, 
                inv_plan['FMaterialId.FName'], 
                inv_plan['FMaterialId.FSpecification'],
                inv_plan.FOpQTY,
                inv_plan['FStockUnitId.FName'],
                inv_plan['FStockLocId.FNumber'],
                ''
            ]
        )
    }
    options.table_body.push(['', group.material_no, '小计', group.qty, '', '', '', ''])
    // 初始化jsPDF对象
    let f = new jsPDF()
    f.addFont(font_file_path, font_family, 'normal') // 加载字体
    f.setFont(font_family) // 设置字体
    let page_width = f.internal.pageSize.getWidth()
    // 标题
    f.setFontSize(20)
    let title_x = (page_width - f.getTextWidth(options.title)) / 2
    f.text(options.title, title_x, 15)
    // f.addImage('./static/logo-wms.png', 'png', 184, 8, 15, 15)
    // 副标题
    f.setFontSize(12)
    let subtitle_x = (page_width - f.getTextWidth(options.subtitle)) / 2
    f.text(options.subtitle, subtitle_x, 22)
    // 单号标识
    f.setFontSize(10)
    f.text(`出货单号：${options.bill_no}`, 10, 25)
    f.text(`收货人：${options.receiver}`, 10, 30)
    f.text(`打印时间：${formatDate(Date.now(), 'yyyy-MM-dd hh:mm:ss')}`, 150, 25)
    f.text(`出库仓库：${options.stock_name}`, 200 - f.getTextWidth(`出库仓库：${options.stock_name}`), 30)
    // 表格
    let textWidth_1 = 0
    let textWidth_5 = 0
    for (let item of options.table_body) {
        textWidth_1 = Math.max(textWidth_1, f.getTextWidth(item[1])) // 品名字符最小宽度
        textWidth_5 = Math.max(textWidth_5, f.getTextWidth(item[5])) // 仓位号字符最小宽度
    }
    f.autoTable({
        theme: 'grid',
        startY: 32,
        margin: { left: 10, right: 10, top: 10, bottom: 10 },
        styles: { font: 'SourceHanSansCN', fontSize: 10, cellPadding: 1, minCellWidth: 9 },
        headStyles: { fillColor: 0, halign: 'center'},
        bodyStyles: { textColor: 0, lineColor: 120 },
        columnStyles: {
            0: { halign: 'center' },
            1: { minCellWidth: textWidth_1 + 2 },
            3: { halign: 'center' },
            4: { halign: 'center' },
            5: { minCellWidth: textWidth_5 + 2 }
        },
        head: [],
        body: options.table_body
    })
    let blob = f.output('blob') // 生成PDF文件的Blob对象
    let url = URL.createObjectURL(blob) // 生成指向Blob对象的URL
    return url
}

const pdf_template_inv_plans_mv = (inv_plans) => {
    let options = {
        title: '绿田机械股份有限公司',
        subtitle: '库存调整计划',
        bill_no: '',
        stock_name: '',
        table_head: ['序号', '编码', '品名', '规格', '操作', '数量', '单位', '仓位号', '备注'],
        table_body: [['序号', '编码', '品名', '规格', '操作', '数量', '单位', '仓位号', '备注']]
    }
    let inv_plans_sorted = inv_plans.sort((x, y) => x['FMaterialId.FNumber'] > y['FMaterialId.FNumber'] ? 1 : -1 )
    for (let i = 0; i < inv_plans_sorted.length; i++) {
        let inv_plan = inv_plans_sorted[i]
        options.bill_no ||= inv_plan.FBillNo
        options.stock_name ||= inv_plan['FStockId.FName']
        options.table_body.push(
            [
                i+1, 
                inv_plan['FMaterialId.FNumber'],
                inv_plan['FMaterialId.FName'], 
                inv_plan['FMaterialId.FSpecification'],
                InvPlan.FOpTypeEnum[inv_plan.FOpType],
                inv_plan.FOpQTY,
                inv_plan['FStockUnitId.FName'],
                inv_plan.FOpType == 'mv' ? `${inv_plan['FStockLocId.FNumber']}\n${inv_plan['FDestStockLocId.FNumber']}` : inv_plan['FStockLocId.FNumber'],
                inv_plan.FRemark
            ]
        )
    }
    // 初始化jsPDF对象
    let f = new jsPDF()
    f.addFont(font_file_path, font_family, 'normal') // 加载字体
    f.setFont(font_family) // 设置字体
    let page_width = f.internal.pageSize.getWidth()
    // 标题
    f.setFontSize(20)
    let title_x = (page_width - f.getTextWidth(options.title)) / 2
    f.text(options.title, title_x, 15)
    // 副标题
    f.setFontSize(12)
    let subtitle_x = (page_width - f.getTextWidth(options.subtitle)) / 2
    f.text(options.subtitle, subtitle_x, 22)
    // 单号标识
    f.setFontSize(10)
    // f.text(`入库单号：${options.bill_no}`, 10, 25)
    f.text(`仓库：${options.stock_name}`, 10, 30)
    f.text(`打印时间：${formatDate(Date.now(), 'yyyy-MM-dd hh:mm:ss')}`, 150, 30)
    // 表格
    let textWidth_1 = 0
    // let textWidth_2 = 0
    // let textWidth_7 = 0
    for (let item of options.table_body) {
        textWidth_1 = Math.max(textWidth_1, f.getTextWidth(item[1])) // 编码字符最小宽度
        // textWidth_2 = Math.max(textWidth_2, f.getTextWidth(item[2])) // 品名字符最小宽度
        // textWidth_7 = Math.max(textWidth_7, f.getTextWidth(item[7])) // 仓位号字符最小宽度
    }
    f.autoTable({
        theme: 'grid',
        startY: 32,
        margin: { left: 10, right: 10, top: 10, bottom: 10 },
        styles: { font: 'SourceHanSansCN', fontSize: 10, cellPadding: 1, minCellWidth: 9 },
        headStyles: { fillColor: 0, halign: 'center'},
        bodyStyles: { textColor: 0, lineColor: 120 },
        columnStyles: {
            0: { halign: 'center' },
            1: { minCellWidth: textWidth_1 + 2 },
            // 2: { minCellWidth: textWidth_2 + 2 },
            3: { halign: 'center' },
            4: { halign: 'center' },
            5: { halign: 'center' },
            // 6: { minCellWidth: textWidth_6 + 2 },
            // 7: { minCellWidth: textWidth_7 + 2 }
        },
        head: [],
        body: options.table_body
    })
    let blob = f.output('blob') // 生成PDF文件的Blob对象
    let url = URL.createObjectURL(blob) // 生成指向Blob对象的URL
    return url
}

const pdf_template_inv_check = (invs) => {
    let options = {
        title: '绿田机械股份有限公司',
        subtitle: '盘点计划',
        stock_name: store.state.cur_stock.FName,
        table_head: ['物料编码', '物料名称', '规格型号', '库位', '批次', '单位', '账面数量', '盘点数量'],
        table_body: []
    }
    for (let inv of invs) {
        options.table_body.push([
            inv['FMaterialId.FNumber'], inv['FMaterialId.FName'],inv['FMaterialId.FSpecification'],
            inv['FStockLocId.FNumber'], inv.FBatchNo, inv['FStockUnitId.FName'], inv.FQty, ''
        ])
    }
    // 初始化jsPDF对象
    let f = new jsPDF({ orientation: 'landscape' })
    f.addFont(font_file_path, font_family, 'normal') // 加载字体
    f.setFont(font_family) // 设置字体
    let page_width = f.internal.pageSize.getWidth()
    // 标题
    f.setFontSize(20)
    let title_x = (page_width - f.getTextWidth(options.title)) / 2
    f.text(options.title, title_x, 15)
    // 副标题
    f.setFontSize(12)
    let subtitle_x = (page_width - f.getTextWidth(options.subtitle)) / 2
    f.text(options.subtitle, subtitle_x, 22)
    // 单号标识
    f.setFontSize(10)
    f.text(`盘点仓库：${options.stock_name}`, 10, 30)
    f.text(`打印日期：${formatDate(Date.now(), 'yyyy-MM-dd')}`, 251, 30)
    // 表格
    let textWidth_1 = 0
    for (let item of options.table_body) {
        textWidth_1 = Math.max(textWidth_1, f.getTextWidth(item[1])) // 品名字符最小宽度
    }
    f.autoTable({
        theme: 'grid',
        startY: 32,
        margin: { left: 10, right: 10, top: 10, bottom: 10 },
        styles: { font: 'SourceHanSansCN', fontSize: 10, cellPadding: 1, minCellWidth: 9 },
        headStyles: { fillColor: 0, halign: 'center'},
        bodyStyles: { textColor: 0, lineColor: 120 },
        columnStyles: {
            0: { minCellWidth: 32 },
            1: { minCellWidth: textWidth_1 + 2 },
            3: { minCellWidth: 22.9 },
            4: { minCellWidth: 17.5 },
            5: { },
            6: { minCellWidth: 16.2, halign: 'center' },
            7: { minCellWidth: 16.2 },
        },
        head: [ options.table_head ],
        body: options.table_body
    })
    // 添加页码
    let total_pages = f.getNumberOfPages()
    for (let i = 1; i <= total_pages; i++) {
        f.setPage(i)
        let t = `${i} / ${total_pages}`
        f.text(t, 287 - f.getTextWidth(t), 203)
    }
    let blob = f.output('blob') // 生成PDF文件的Blob对象
    let url = URL.createObjectURL(blob) // 生成指向Blob对象的URL
    return url
}

const pdf_template_invs = (inv_groups) => {
    let options = {
        title: '绿田机械股份有限公司',
        subtitle: '即时库存',
        stock_name: store.state.cur_stock.FName,
        table_head: ['物料编码', '物料名称', '规格型号', '单位', 'WMS库存', '金蝶账面', '差异', 'WMS库位'],
        table_body: []
    }
    for (let inv of inv_groups) {
        let loc_nos = []
        for (let k of Object.keys(inv.loc_nos)) {
            loc_nos.push(`${k.match('[A-Za-z0-9]+-(.+)')[1]}:${inv.loc_nos[k]}`)
        }
        loc_nos.sort()
        // let loc_nos = inv.loc_nos.sort((x, y) => compare_loc_no(x, y)).map(loc_no => loc_no.match('[A-Za-z0-9]+-(.+)')[1]).join(', ')
        options.table_body.push([
            inv.material_no, inv.material_name, inv.material_spec, inv.base_unit_name, inv.qty, inv.stk_qty, inv.qty - inv.stk_qty, loc_nos.join(', ')
        ])
    }
    // 初始化jsPDF对象
    let f = new jsPDF({ orientation: 'landscape' })
    f.addFont(font_file_path, font_family, 'normal') // 加载字体
    f.setFont(font_family) // 设置字体
    let page_width = f.internal.pageSize.getWidth()
    // 标题
    f.setFontSize(20)
    let title_x = (page_width - f.getTextWidth(options.title)) / 2
    f.text(options.title, title_x, 15)
    // 副标题
    f.setFontSize(12)
    let subtitle_x = (page_width - f.getTextWidth(options.subtitle)) / 2
    f.text(options.subtitle, subtitle_x, 22)
    // 单号标识
    f.setFontSize(10)
    f.text(`仓库：${options.stock_name}`, 10, 30)
    f.text(`打印时间：${formatDate(Date.now(), 'yyyy-MM-dd hh:mm:ss')}`, 237, 30)
    // 表格
    let textWidth_0 = 0
    let textWidth_1 = 0
    for (let item of options.table_body) {
        textWidth_0 = Math.max(textWidth_0, f.getTextWidth(item[0])) // 编码最小宽度
        textWidth_1 = Math.max(textWidth_1, f.getTextWidth(item[1])) // 名称最小宽度
    }
    f.autoTable({
        theme: 'grid',
        startY: 32,
        margin: { left: 10, right: 10, top: 10, bottom: 10 },
        styles: { font: 'SourceHanSansCN', fontSize: 10, cellPadding: 1, minCellWidth: 9 },
        headStyles: { fillColor: 255, textColor: 0, halign: 'center'},
        bodyStyles: { textColor: 0, lineColor: 120 },
        columnStyles: {
            0: { minCellWidth: textWidth_0 + 2 },
            1: { cellWidth: 40 },
            4: { halign: 'center', minCellWidth: 17 },
            5: { halign: 'center', minCellWidth: 17 },
            6: { halign: 'center' },
            7: { cellWidth: 48 }
        },
        head: [ options.table_head ],
        body: options.table_body
    })
    // 添加页码
    let total_pages = f.getNumberOfPages()
    for (let i = 1; i <= total_pages; i++) {
        f.setPage(i)
        let t = `${i} / ${total_pages}`
        f.text(t, 287 - f.getTextWidth(t), 203)
    }
    let blob = f.output('blob') // 生成PDF文件的Blob对象
    let url = URL.createObjectURL(blob) // 生成指向Blob对象的URL
    return url
}

// 托运到站单
const pdf_template_tydzd = () => {
    let options = {
        title: '托 运 到 站 单',
        bill_no: 'TYDZD888888',
        sender_company: '绿田机械股份有限公司',
        sender_phone: '0576-82645288',
        receiver: '<收货人>',
        receiver_addr: '<收货人地址占位字符>',
        receiver_phone: '138 8888 8888',
        express: '<xx物流>',
        express_addr: '<托运站地址占位字符>',
        express_phone: '139 9999 9999',
        footer: '尊敬的客户：请您在收到货后，及时核对货物的件数和型号，如有不符，请及时通知我们，谢谢合作。',
        table_body: [
            ['发货单位及电话', ''],
            ['收货人地址及姓名', ''],
            ['收货人电话及号码', ''],
            ['托运站地址及电话', ''],
            ['货物清单', '']
        ]
    }
    // 初始化jsPDF对象
    let f = new jsPDF()
    f.addFont(font_file_path, font_family, 'normal') // 加载字体
    f.setFont(font_family) // 设置字体
    let page_width = f.internal.pageSize.getWidth()
    console.log('page_width', page_width)
    // -- header --
    // 标题
    f.setFontSize(24)
    let title_x = (page_width - f.getTextWidth(options.title)) / 2
    f.text(options.title, title_x, 15)
    // 单号标识
    f.setFontSize(10)
    f.text(`${options.bill_no}`, 10, 20)
    f.text(`打印时间：${formatDate(Date.now(), 'yyyy-MM-dd hh:mm:ss')}`, 150, 20)
    
    // 表格
    // f.autoTable({
    //     theme: 'grid',
    //     startY: 23,
    //     margin: { left: 10, right: 10, top: 10, bottom: 10 },
    //     styles: { font: 'SourceHanSansCN', fontSize: 12, cellPadding: 1, minCellWidth: 9 },
    //     bodyStyles: { textColor: 0, lineColor: 0 },
    //     columnStyles: {
    //         0: { halign: 'center', cellWidth: 60 },
    //         1: { cellWidth: 130 }
    //     },
    //     rowStyles: {
    //         0: { cellPadding: 20 },
    //         cellPadding: 15,
    //     },
    //     body: options.table_body
    // })
    // -- body --
    f.setLineWidth(0.5)
    // 水平框线
    f.line(10, 22, 200, 22)
    f.line(10, 38, 200, 38)
    f.line(10, 54, 200, 54)
    f.line(10, 70, 200, 70)
    f.line(10, 86, 200, 86)
    f.line(10, 134, 200, 134)
    // 垂直框线
    f.line(10, 22, 10, 134)
    f.line(60, 22, 60, 86)
    f.line(200, 22, 200, 134)
    
    f.setFontSize(12)
    f.text('发货单位及电话', 18, 31.6)
    f.text('绿田机械股份有限公司', 68, 31.6)
    f.text('0576-82645288', 138, 31.6)
    
    f.text('收货人地址及姓名', 18, 47.6)
    f.text('收货人电话及号码', 18, 63.6)
    f.text('托运站地址及电话', 18, 79.6)
    f.text('货物清单', 18, 92)
    
    
    
    // -- footer --
    f.setFontSize(10)
    f.text(`${options.footer}`, 10, 138)

    let blob = f.output('blob') // 生成PDF文件的Blob对象
    let url = URL.createObjectURL(blob) // 生成指向Blob对象的URL
    return url
}

export {
    pdf_template_inv_plans_in,
    pdf_template_inv_plans_out,
    pdf_template_inv_plans_mv,
    pdf_template_inv_check,
    pdf_template_invs,
    pdf_template_tydzd
}