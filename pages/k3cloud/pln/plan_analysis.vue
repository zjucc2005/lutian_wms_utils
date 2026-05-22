<template>
    <scroll-view :scroll-into-view="'tab'+currentIndex" scroll-x scroll-with-animation class="tab-scroll" >
        <view 
            v-for="(name, index) in tabs" 
            :id="'tab'+ index"
            :key="index" 
            class="tab-item"
            :class="{ active: currentIndex === index }"
            @click="currentIndex=index;uni.pageScrollTo({ scrollTop: 0 })"
            >
            {{ name }}
        </view>
    </scroll-view>
    
    <view v-if="currentIndex === 0" class="tab-content">
        <uni-section title="加载历史跑单数据" type="square" @click="$logger.info('>>>', $data)">
            <view class="container">
                <button v-if="refer_filename" type="warn" size="mini" @click="delete_refer_data">移除历史跑单数据《{{ refer_filename }}》</button>
                <button v-else type="primary" size="mini" @click="choose_file('refer')">选择参考文件</button>
                <view class="text-grey text-sm">注意！</view>
                <view class="text-grey text-sm">1.如果某计划序号在历史跑单数据中已存在，默认将不再跑单，直接引用历史跑单数据；</view>
                <view class="text-grey text-sm">2.在<text class="text-primary">1-主计划进度</text>工作表中，可对某计划序号，标识表头<text class="text-primary">重新跑单</text>字段值为1，强制重新跑单;</view>
                <view class="text-grey text-sm">3.文件大小不能超过<text class="text-primary">32MB</text>；</view>
            </view>
        </uni-section>
        
        <uni-section title="导入主计划进度" type="square" @click="$logger.info('>>>', $data)">
            <view class="container">
                <button type="primary" size="mini" @click="choose_file('plan')">选择文件</button>
                <view class="text-grey text-sm">注意！</view>
                <view class="text-grey text-sm">1.导入excel中需包含名为<text class="text-primary">1-主计划进度</text>的工作表；</view>
                <view class="text-grey text-sm">2.按照表中顺序依次执行，如有排序要求，请先<text class="text-primary">自行排序</text>；</view>
                <view class="text-grey text-sm">3.如果文件无法读取，请<text class="text-primary">解密</text>后重新尝试；</view>
            </view>
        </uni-section>
        
        <uni-section v-if="response_result.length" title="校验信息" type="square">
            <uni-table ref="table" border stripe class="table-sm uni-mb-5">
                <uni-tr>
                    <uni-th align="center">索引</uni-th>
                    <uni-th align="center">消息</uni-th>
                </uni-tr>
                <uni-tr v-for="(res, index) in response_result" :key="index">
                    <uni-td align="center">{{ res.i }}</uni-td>
                    <uni-td>{{ res.msg }}</uni-td>
                </uni-tr>
            </uni-table>
        </uni-section>
    </view>
    
    <view v-if="currentIndex === 1" class="tab-content">
        <uni-section :title="`跑单结果，共 ${ table_body.length } 行数据`" type="square">
            <uni-table ref="table" border stripe class="table-sm">
                <uni-tr>
                    <uni-th></uni-th>
                    <uni-th v-for="(name, index) in table_head" :key="index" align="center">{{ name }}</uni-th>
                </uni-tr>
                
                <uni-tr v-for="i in Math.min(table_body.length, 200)" :key="i">
                    <uni-td>{{ i }}</uni-td>
                    <uni-td v-for="(cell, j) in table_body[i-1]" :key="j" align="center">{{ cell instanceof Date ? formatDate(cell, 'yyyy-MM-dd') : cell }}</uni-td>
                </uni-tr>
            </uni-table>
        </uni-section>
    </view>
    
    <view class="uni-goods-nav-wrapper">
        <uni-goods-nav
            :options="goods_nav.options"
            :button-group="goods_nav.button_group"
            :fill="$store.state.goods_nav_fill"
            @click="goods_nav_click"
        />
    </view>
</template>

<script>
    import store from '@/store'
    import { toRaw } from 'vue'
    import XLSX from 'xlsx'
    import { Enum, EngBom, PlnPlanOrder } from '@/utils/model'
    import { formatDate } from '@/utils'
    
    export default {
        data() {
            return {
                raw_data: [],
                done_data: [],
                response_result: [],
                bom_fields: ['FNumber', 'FUseOrgId.FNumber', 'FMaterialId.FNumber', 'FMaterialId.FName', 'FMaterialId.FSpecification',
                             'FMaterialIdChild.FNumber', 'FMaterialIdChild.FName', 'FMaterialIdChild.FSpecification', 'FMaterialIdChild.FSafeStock',
                             'FChildUnitId.FName', 'FNumerator', 'FDenominator', 'FChildItemProperty', 'FBomId.FNumber',
                             'FChildSupplyOrgId.FNumber', 'FMaterialIdChild.F_RGEN_Text_sqr', 'FMaterialIdChild.FPlanIdent'],
                bom_cache: {},
                refer_filename: '',
                refer_data: {},
                table_head: ['运算编号', '计划序号', '子项物料编码', '子项物料名称', '子项规格型号', '单位', '确认订单量', '物料属性', 'BOM版本(0层)', 'BOM版本(1层)',
                             '申请人', '计划标识', '安全库存'],
                table_body: [],
                currentIndex: 0,
                tabs: [ '请求参数', '运行结果' ],
                goods_nav: {
                    options: [
                        // #ifdef H5
                        { icon: 'download', text: '导出表格' }
                        // #endif
                    ],
                    button_group: [
                    ]
                }
            }
        },
        mounted() {
        },
        methods: {
            formatDate,
            // main
            async exec_script (){
                try {
                    let x_start_time = Date.now() // 执行开始时间
                    // 预处理导入Excel数据
                    await this.handle_data()
                    // 查询最新运算编号
                    // await this.load_computer_no() 
                    // 切换tab，预览结果
                    this.currentIndex = 1
                    // 执行计划分析脚本
                    await this.plan_analysis()
                    
                    uni.showModal({ title: '执行完毕',
                        content: [`执行耗时 ${(Date.now() - x_start_time) / 1000} 秒`,
                                  '本页面最多展示200行，请导出查看全部数据'].join('\n'),
                    })
                } catch (err) {
                    uni.hideLoading()
                    this.$logger.info('>>> err', err)
                } 
            },
            handle_data() {
                this.done_data = []
                let header = this.raw_data[0]
                let force_idx = header.indexOf('重新跑单')
                
                let jhxh_idx = header.indexOf('计划序号')
                if (jhxh_idx === -1) this.response_result.push({ i: 0, msg: '未找到表头[计划序号]' })
                let qty_idx = header.indexOf('数量')
                if (qty_idx === -1) this.response_result.push({ i: 0, msg: '未找到表头[数量]' })
                let bomver_idx = header.indexOf('整机BOM版本')
                if (bomver_idx === -1) this.response_result.push({ i: 0, msg: '未找到表头[整机BOM版本]' })
                // let plan_s_date_idx = header.indexOf('计划开工日期')
                // if (plan_s_date_idx === -1 ) this.response_result.push({ i: 0, msg: '未找到表头[计划开工日期]' })
                // let order_no_idx = header.indexOf('订单号')
                // if (order_no_idx === -1) this.response_result.push({ i: 0, msg: '未找到表头[订单号]' })
                // let order_spec_idx = header.indexOf('规格型号')
                // if (order_spec_idx === -1) this.response_result.push({ i: 0, msg: '未找到表头[规格型号]' })
                for (let i = 1; i < this.raw_data.length; i++) {
                    let row = this.raw_data[i]
                    if (!row[2]) break
                    let bomver = row[bomver_idx]
                    let force = force_idx > -1 && row[force_idx] == 1
                    this.done_data.push({
                        jhxh: row[jhxh_idx],
                        qty: row[qty_idx],
                        bomver: bomver ? bomver.slice(bomver.indexOf('&') + 1) : '', // BOM版本按格式截取 {prefix}&{bomver}
                        // plan_s_date: row[plan_s_date_idx],
                        // order_no: row[order_no_idx],
                        // order_spec: row[order_spec_idx],
                        force,
                    })
                }
            },
            handle_refer_data() {
                let x_start_time = Date.now() // 执行开始时间
                this.refer_data = {}
                let header = this.raw_data[0]
                let jhxh_idx = header.indexOf('计划序号')
                if (jhxh_idx === -1) {
                    this.response_result.push({ i: 0, msg: '未找到表头[计划序号]' })
                    this.delete_refer_data()
                    return
                }
                for (let i = 1; i < this.raw_data.length; i++) {
                    let jhxh = this.raw_data[i][jhxh_idx]
                    this.refer_data[jhxh] ||= []
                    this.refer_data[jhxh].push(this.raw_data[i])
                }
                this.raw_data = []
                uni.showModal({
                    title: '加载完毕',
                    content: `执行耗时 ${(Date.now() - x_start_time) / 1000} 秒`
                })
            },
            delete_refer_data() {
                this.refer_filename = ''
                this.refer_data = {}
            },
            async load_computer_no() {
                uni.showLoading({ title: '查询最新运算编号' })
                let jhxh_set = new Set()
                for (let obj of this.done_data) {
                    jhxh_set.add(obj.jhxh)
                }
                let jhxh_arr = Array.from(jhxh_set)
                let h = {}
                let step = 10
                for (let i = 0; i < jhxh_arr.length; i += step) {
                    let res = await PlnPlanOrder.query({ F_PAEZ_JHXH_in: jhxh_arr.slice(i, i+step) }, { fields: ['F_PAEZ_JHXH', 'FComputerNo'], return: 'array' })
                    for (let d of res.data) {
                        if (!h[d[0]] || h[d[0]] < d[1]) h[d[0]] = d[1]
                    }
                }
                for (let obj of this.done_data) {
                    obj.computer_no = h[obj.jhxh] || ''
                }
                uni.hideLoading()
            },
            async load_full_bom(bomver, material_no='', org='102', root=null, root1=null, level=0, qty=1) {
                if (level > 7) return [] // 设定层级上限，防止嵌套BOM导致的死循环
                let bom = { children: [] }
                if (material_no || bomver) {
                    bom = await this.load_bom(material_no, bomver, org)
                } else {
                    return []
                }
                let res = []
                if (level === 0) {
                    root = bomver
                    res.push({ level: 0, no: bom.no, name: bom.name, spec: bom.spec, qty: 1, root, root1 })
                }
                if (level === 1) root1 = bomver
                for (let child of bom.children) {
                    res.push({ ...child, root, root1, level: level + 1, qty: qty * child.qty })
                    // 供应组织为[电机事业部]时，不分析下一级
                    if (['103'].includes(child.supply_org)) continue
                    // 当物料属性为外购时，不再查询子级
                    if (['外购'].includes(child.prop)) continue
                    // 递归查询
                    for (let item of await this.load_full_bom(child.bomver, child.no, child.supply_org, root, root1 ,level+1, qty * child.qty)) {
                        res.push(item)
                    }
                }
                // if (level === 0) console.log(">>> load_full_bom", bomver, res)
                return res
            },
            async load_bom(material_no, bomver, org) {
                // 存在不同物料有相同BOM版本的情况，缓存采用 material_no + bomver两层机制
                let bom = { children: [] }
                if (!material_no && !bomver) return bom
                if (this.bom_cache[material_no] && this.bom_cache[material_no][bomver]) return this.bom_cache[material_no][bomver]
                // 返回结果不含替代件
                let options = { 'FUseOrgId.FNumber': org, FMaterialType: '1', FExpireDate_ge: formatDate(Date.now(), 'yyyy-MM-dd') }
                if (material_no) options['FMaterialId.FNumber'] = material_no
                if (bomver) options['FNumber'] = bomver
                let res = await EngBom.query(options, { fields: this.bom_fields, order: 'FNumber DESC, FUseOrgId.FNumber, FReplaceGroup' })
                // 筛选最高BOM版本
                for (let d of res.data) {
                    if (!bom.bomver || bom.bomver < d['FNumber']) {
                        bom.bomver = d['FNumber']
                        bom.no = d['FMaterialId.FNumber']
                        bom.name = d['FMaterialId.FName']
                        bom.spec = d['FMaterialId.FSpecification']
                        bom.use_org = d['FUseOrgId.FNumber']
                    }
                }
                for (let d of res.data) {
                    if (bom.bomver === d['FNumber']) {
                        bom.children.push({
                            no: d['FMaterialIdChild.FNumber'],
                            name: d['FMaterialIdChild.FName'],
                            spec: d['FMaterialIdChild.FSpecification'],
                            unit: d['FChildUnitId.FName'],
                            qty: d['FNumerator'] / d['FDenominator'],
                            prop: Enum.bd_material_properties[d['FChildItemProperty']],
                            bomver: d['FBomId.FNumber'],
                            supply_org: d['FChildSupplyOrgId.FNumber'],
                            applicant: d['FMaterialIdChild.F_RGEN_Text_sqr'],
                            plan_ident: d['FMaterialIdChild.FPlanIdent'],
                            safe_stock: d['FMaterialIdChild.FSafeStock']
                        })
                    }
                }
                this.bom_cache[material_no] ||= {}
                this.bom_cache[material_no][bom.bomver] = bom
                return this.bom_cache[material_no][bom.bomver]
            },
            async plan_analysis() {
                this.table_body = []
                for (let i = 0; i < this.done_data.length; i++) {
                    uni.showLoading({ title: `${(i * 100 / this.done_data.length).toFixed(1)} %` })
                    let row = this.done_data[i]
                    // 先引用参考数据（强制重跑除外）
                    if (this.refer_data[row.jhxh] && !row.force) {
                        for (let d of this.refer_data[row.jhxh]) {
                            this.table_body.push(d)
                        }
                        continue
                    }
                    // 没有BOM版本，则跳过分析
                    if (!row.bomver) continue
                    let bom = await this.load_full_bom(row.bomver)
                    for (let m of bom) {
                        this.table_body.push([
                            row.computer_no, row.jhxh, m.no, m.name, m.spec, m.unit, this.number_round(m.qty * row.qty), m.prop, m.root, m.root1,
                            m.applicant, m.plan_ident, m.safe_stock || 0
                            // this.xlsx_parse_date(row.plan_s_date), row.order_no, row.order_spec, row.qty 
                        ])
                    }
                }
                uni.hideLoading()
            },
            xlsx_parse_date(n) {
                let h = XLSX.SSF.parse_date_code(n)
                return new Date(h.y, h.m - 1, h.d)
            },
            number_round(n) {
                return parseFloat(n.toFixed(6))
            },
            goods_nav_click(e) {
                if (e.index === 0) this.export_as_excel()
            },
            // import
            choose_file(file_type='plan') {
                // #ifdef APP-PLUS
                    uni.showToast({ icon: 'none', title: 'APP不支持该功能' })
                    return
                // #endif
                let _this_ = this
                this.response_result = []
                uni.showLoading({ title: '读取Excel数据' })
                uni.chooseFile({
                    count: 1,
                    extension: ['.xlsx', '.xls'],
                    success (res) {
                        this.raw_data = [] // init
                        let temp_file = res.tempFiles[0]
                        let extname = temp_file.name.split('.').pop()
                        if (temp_file.size > 32 * 1024 * 1024) {
                            uni.showToast({ icon: 'error', title: '文件大小不能超过32MB' })
                            return
                        }
                        var reader = new FileReader();
                        reader.onload = function(e) {
                            let data = e.target.result
                            let book = XLSX.read(data, { type: 'binary' })
                            if (file_type === 'refer') {
                                let sheet = book.Sheets[book.SheetNames[0]]
                                let sheet_data =  XLSX.utils.sheet_to_json(sheet, { header: 1 })
                                _this_.raw_data = sheet_data
                                _this_.refer_filename = temp_file.name
                                _this_.handle_refer_data()
                            } else {
                                let sheet = book.Sheets['1-主计划进度']
                                if (sheet) {
                                    let sheet_data =  XLSX.utils.sheet_to_json(sheet, { header: 1 })
                                    _this_.raw_data = sheet_data
                                    _this_.exec_script()
                                } else {
                                    _this_.response_result.push({ i: 0, msg: '未找到工作表[1-主计划进度]' })
                                }
                            }
                        };
                        reader.readAsBinaryString(temp_file)
                    },
                    complete (res) {
                        uni.hideLoading()
                    }
                })
            },
            export_as_excel() {
                // #ifdef APP-PLUS
                    uni.showToast({ icon: 'none', title: 'APP不支持导出Excel' })
                    return
                // #endif
                if (this.table_body.length === 0) {
                    uni.showModal({ title: '提示', content: '没有数据可供导出' })
                    return
                }
                try {
                    uni.showLoading({ title: '正在导出...', mask: true })
                    setTimeout(() => {
                        let book = XLSX.utils.book_new()
                        let sheet = XLSX.utils.aoa_to_sheet([toRaw(this.table_head), ...toRaw(this.table_body)])
                        XLSX.utils.book_append_sheet(book, sheet, '跑单结果')
                        XLSX.writeFile(book, `跑单结果_${formatDate(Date.now(), 'yyyyMMdd_hhmmss')}.xlsx`, { compression: true });
                        uni.hideLoading()
                        uni.showToast({ title: '导出完毕' })
                    }, 1000)
                } catch (err) {
                    uni.hideLoading()
                    uni.showModal({ title: '导出Excel失败', content: `原因：${err}` })
                }
            }
        }
    }
</script>

<style lang="scss" scoped>
    .tab-content {
        padding-bottom: 60px;
    }
    .table-sm::v-deep {
        .uni-table {
            .uni-table-th {
                padding: 4px 5px;
            }
            .uni-table-td {
                line-height: 15px;
                padding: 4px 5px;
            }
        }
    }
</style>
