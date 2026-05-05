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
        <uni-section title="导入主计划进度" type="square" @click="$logger.info('>>>', $data)">
            <view class="container">
                <button type="primary" size="mini" @click="choose_file">选择文件</button>
                <view class="text-grey text-sm">注意！</view>
                <view class="text-grey text-sm">1.导入excel中需包含名为<text class="text-primary">1-主计划进度</text>的工作表;</view>
                <view class="text-grey text-sm">2.如果文件无法读取，请<text class="text-primary">解密</text>后重新尝试;</view>
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
                    <uni-td v-for="(cell, j) in table_body[i-1]" :key="j" align="center">{{ cell }}</uni-td>
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
                             'FMaterialIdChild.FNumber', 'FMaterialIdChild.FName', 'FMaterialIdChild.FSpecification', 
                             'FChildUnitId.FName', 'FNumerator', 'FDenominator', 'FChildItemProperty', 'FBomId.FNumber',
                             'FChildSupplyOrgId.FNumber', 'FMaterialIdChild.F_RGEN_Text_sqr', 'FMaterialIdChild.FPlanIdent'],
                bom_cache: {},
                table_head: ['运算编号', '计划序号', '子项物料编码', '子项物料名称', '子项规格型号', '单位', '确认订单量', '物料属性', 'BOM版本', '申请人', '计划标识'],
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
            this.load_full_bom('3.01.02.01.01.0233_V1.100')
            // EngBom.view('3.01.02.01.01.0233_V1.100')
            // EngBom.query({ FNumber: '2.01.06.02.0004_V1.0' })
            // 风扇子级，返回多个塑料粒子问题，可能是多组织原因
            // EngBom.View('2.01.06.01.0007_V1.1')
            // 后盖子级，返回多个塑料粒子问题
            // EngBom.view('2.01.06.02.0004_V1.0')

            // 在计划订单下，查出运算编号，取最新
            // 整机BOM版本字段，原值需提取出BOM版本，如没有BOM版本，则忽略该计划序号，以下为取值样例：
            // 订单未下推&3.02.01.14.01.0001_V1.000
            // 订单未下推&
            // 3.02.01.14.01.0001_V1.000
        },
        methods: {
            // main
            async exec_script (){
                try {
                    let x_start_time = Date.now() // 执行开始时间
                    // 预处理导入Excel数据
                    await this.handle_data()
                    // 查询最新运算编号
                    await this.load_computer_no() 
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
                let jhxh_idx = header.indexOf('计划序号')
                if (jhxh_idx === -1) this.response_result.push({ i: 0, msg: '未找到表头[计划序号]' })
                let qty_idx = header.indexOf('数量')
                if (qty_idx === -1) this.response_result.push({ i: 0, msg: '未找到表头[数量]' })
                let bomver_idx = header.indexOf('整机BOM版本')
                if (bomver_idx === -1) this.response_result.push({ i: 0, msg: '未找到表头[整机BOM版本]' })
                
                for (let i = 1; i < this.raw_data.length; i++) {
                    let bomver = this.raw_data[i][bomver_idx]
                    this.done_data.push({
                        jhxh: this.raw_data[i][jhxh_idx],
                        qty: this.raw_data[i][qty_idx],
                        bomver: bomver.slice(bomver.indexOf('&') + 1) // BOM版本按格式截取 {prefix}&{bomver}
                    })
                }
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
            async load_full_bom(bomver, material_no='', root=null, level=0, qty=1) {
                let bom = { children: [] }
                if (bomver) {
                    bom = await this.load_bom(bomver)
                } else if (material_no) {
                    bom = await this.load_bom_by_material_no(material_no)
                } else {
                    return []
                }
                
                let res = []
                root = root || bomver
                if (level === 0) {
                    res.push({ level: 0, no: bom.no, name: bom.name, spec: bom.spec, qty: 1, root: root })
                }
                for (let child of bom.children) {
                    res.push({ ...child, root, level: level + 1, qty: qty * child.qty })
                    // 供应组织为[清洗机事业部，电机事业部]时，不分析下一级
                    if (['101', '103'].includes(child.supply_org)) continue
                    // 递归查询
                    for (let item of await this.load_full_bom(child.bomver, child.no, root, level+1, qty * child.qty)) {
                        res.push(item)
                    }
                }
                if (level === 0) console.log(">>> load_full_bom", bomver, res)
                return res
            },
            async load_bom(bomver) {
                if (this.bom_cache[bomver]) return this.bom_cache[bomver]
                // 返回结果不含替代件
                let options = { FNumber: bomver, FMaterialType: '1', FExpireDate_ge: formatDate(Date.now(), 'yyyy-MM-dd') }
                let res = await EngBom.query(options, { fields: this.bom_fields, order: 'FUseOrgId.FNumber, FReplaceGroup' })
                let bom = { children: [] }
                for (let i = 0; i < res.data.length; i++) {
                    let d = res.data[i]
                    if (i === 0) {
                        bom.bomver = d['FNumber']
                        bom.no = d['FMaterialId.FNumber']
                        bom.name = d['FMaterialId.FName']
                        bom.spec = d['FMaterialId.FSpecification']
                        bom.use_org = d['FUseOrgId.FNumber']
                    }
                    if (bom.use_org === d['FUseOrgId.FNumber']) {
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
                            plan_ident: d['FMaterialIdChild.FPlanIdent']
                        })
                    }
                }
                this.bom_cache[bomver] = bom
                return this.bom_cache[bomver]
            },
            async load_bom_by_material_no(material_no) {
                if (this.bom_cache[material_no]) return this.bom_cache[material_no]
                let options = { 'FMaterialId.FNumber': material_no, FMaterialType: '1', FExpireDate_ge: formatDate(Date.now(), 'yyyy-MM-dd') }
                let res = await EngBom.query(options, { fields: this.bom_fields, order: 'FNumber DESC, FUseOrgId.FNumber, FReplaceGroup', per_page: 2000 })
                let bom = { bomver: material_no, no: material_no, children: [] }
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
                    if (bom.bomver === d['FNumber'] && bom.use_org === d['FUseOrgId.FNumber']) {
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
                            plan_ident: d['FMaterialIdChild.FPlanIdent']
                        })
                    }
                }
                this.bom_cache[material_no] = bom
                return this.bom_cache[material_no]
            },
            async plan_analysis() {
                this.table_body = []
                for (let i = 0; i < this.done_data.length; i++) {
                    uni.showLoading({ title: `${(i * 100 / this.done_data.length).toFixed(1)} %` })
                    let row = this.done_data[i]
                    if (!row.bomver) continue // 没有BOM版本，则跳过分析
                    let bom = await this.load_full_bom(row.bomver)
                    for (let m of bom) {
                        this.table_body.push([
                            row.computer_no, row.jhxh, m.no, m.name, m.spec, m.unit, m.qty * row.qty, m.prop, m.root, m.applicant, m.plan_ident
                        ])
                    }
                }
                uni.hideLoading()
            },
            goods_nav_click(e) {
                if (e.index === 0) this.export_as_excel()
            },
            // import
            choose_file() {
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
                        var reader = new FileReader();
                        reader.onload = function(e) {
                            let data = e.target.result
                            let book = XLSX.read(data, { type: 'binary' })
                            // let sheet = book.Sheets[book.SheetNames[0]]
                            let sheet = book.Sheets['1-主计划进度']
                            if (sheet) {
                                let sheet_data =  XLSX.utils.sheet_to_json(sheet, { header: 1 })
                                _this_.raw_data = sheet_data
                                _this_.exec_script()
                            } else {
                                _this_.response_result.push({ i: 0, msg: '未找到工作表[1-主计划进度]' })
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
                        let sheet = XLSX.utils.aoa_to_sheet([this.table_head, ...this.table_body])
                        XLSX.utils.book_append_sheet(book, sheet, '跑单结果')
                        XLSX.writeFile(book, `跑单结果_${formatDate(Date.now(), 'yyyyMMdd_hhmmss')}.xlsx`);
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
