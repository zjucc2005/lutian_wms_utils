// 1. 为了兼容electron打包后的文件路径问题，本文件放到根目录
// 2. 不能兼容APP，打包apk时，需加上#ifdef H5条件编译
import jsPDF from 'jspdf'
import 'jspdf-autotable'
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
        table_body: []
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
    f.text(`打印日期：${formatDate(Date.now(), 'yyyy-MM-dd')}`, 164, 30)
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
        head: [ options.table_head ],
        body: options.table_body
    })
    let blob = f.output('blob') // 生成PDF文件的Blob对象
    let url = URL.createObjectURL(blob) // 生成指向Blob对象的URL
    return url
}

const pdf_template_inv_plans_out = (inv_plans) => {
    let options = {
        title: '绿田机械股份有限公司',
        subtitle: '发货通知单拣货计划',
        bill_no: '',
        stock_name: '',
        table_head: ['序号', '品名', '规格', '数量', '单位', '仓位号', '备注'],
        table_body: []
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
    f.text(`出库仓库：${options.stock_name}`, 10, 30)
    f.text(`打印日期：${formatDate(Date.now(), 'yyyy-MM-dd')}`, 164, 30)
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
        head: [ options.table_head ],
        body: options.table_body
    })
    let blob = f.output('blob') // 生成PDF文件的Blob对象
    let url = URL.createObjectURL(blob) // 生成指向Blob对象的URL
    return url
}

export {
    pdf_template_inv_plans_in,
    pdf_template_inv_plans_out
}