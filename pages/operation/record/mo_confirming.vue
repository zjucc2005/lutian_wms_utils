<template>
    <uni-section title="查询生产订单编号" type="square" @click="$logger.info('>>>', $data)">
        <view class="searchbar-container">
            <uni-easyinput
                v-model="search_form.bill_no" 
                placeholder="请输入搜索内容"
                prefix-icon="scan"
                @confirm="handle_search"
                @clear="handle_search"
                @icon-click="searchbar_icon_click"
                primary-color="rgb(238, 238, 238)"
                :styles="{
                    color: '#000',
                    backgroundColor: 'rgb(238, 238, 238)',
                    borderColor: 'rgb(238, 238, 238)'
                }"
            />
        </view>
    </uni-section>
    
    <uni-section v-if="!ppbom.bill_no && ppboms.length" title="生产用料清单列表" type="square" class="above-uni-goods-nav"
        sub-title="查询到 2 个生产用料清单，请先选择" sub-title-color="#007aff">
        <!-- <uni-table ref="table" border stripe class="table-sm">
            <uni-tr>
                <uni-th align="center" width="100">单据编号</uni-th>
                <uni-th align="center" width="100">生产订单编号</uni-th>
                <uni-th align="center" width="110">生产订单状态</uni-th>
                <uni-th align="center" width="120">产品编号</uni-th>
                <uni-th align="center">产品名称</uni-th>
                <uni-th align="center">规格型号</uni-th>
                <uni-th align="center">生产数量</uni-th>
                <uni-th align="center">生产车间</uni-th>
                <uni-th align="center" width="70">操作</uni-th>
            </uni-tr>
            <uni-tr v-for="(obj, index) in ppboms" :key="index">
                <uni-td align="center">{{ obj['FBillNo'] }}</uni-td>
                <uni-td align="center">{{ obj['FMoBillNo'] }}</uni-td>
                <uni-td align="center">{{ mo_status_dict[obj['FMoEntryStatus']] }}</uni-td>
                <uni-td align="center">{{ obj['FMaterialId.FNumber'] }}</uni-td>
                <uni-td align="center">{{ obj['FMaterialId.FName'] }}</uni-td>
                <uni-td align="center">{{ obj['FMaterialId.FSpecification'] }}</uni-td>
                <uni-td align="center">{{ obj['FQty'] }} {{ obj['FUnitId.FName'] }}</uni-td>
                <uni-td align="center">{{ obj['FWorkShopId.FName'] }}</uni-td>
                <uni-td align="center">
                    <uni-tag text="选择" type="primary" @click="load_ppbom(obj)"/>
                </uni-td>
            </uni-tr>
        </uni-table> -->
        <uni-card spacing="0" padding="0">
            <uni-list>
                <uni-list-item v-for="(obj, index) in ppboms" :key="index"
                    @click="load_ppbom(obj)" clickable show-arrow>
                    <template #body>
                        <view class="uni-list-item__body">
                            <view class="title">
                                <uni-badge :text="`${obj.FMoEntrySeq}`" type="primary" />
                                {{ obj.FBillNo }}
                            </view>
                            <view class="note">
                                <view>产品编码：{{ obj['FMaterialId.FNumber'] }}</view>
                                <view>产品名称：{{ obj['FMaterialId.FName'] }}</view>
                                <view>规格型号：{{ obj['FMaterialId.FSpecification'] }}</view>
                                <view>
                                    生产订单：{{ obj.FMoBillNo }}
                                    <uni-tag :text="mo_status_dict[obj['FMoEntryStatus']]" type="success" size="small" circle/>
                                </view>
                                <view>生产车间：<text class="text-primary">{{ obj['FWorkShopId.FName'] }}</text></view>
                            </view>
                        </view>
                    </template>
                    <template #footer>
                        <view class="uni-list-item__foot">
                            <view>{{ obj.FQty }} {{ obj['FUnitId.FName'] }}</view>
                        </view>
                    </template>
                </uni-list-item>
            </uni-list>
        </uni-card>
    </uni-section>
    
    <uni-section v-if="ppbom.id" title="物料状态确认表" type="square" class="above-uni-goods-nav">
        <uni-list>
            <uni-row>
                <uni-col :sm="24" :md="8">
                    <uni-list-item title="计划跟踪单号" :right-text="ppbom.sale_order_no" />
                </uni-col>
                <uni-col :sm="24" :md="8">
                    <uni-list-item title="生产订单编号" :right-text="ppbom.mo_bill_no" />
                </uni-col>
                <uni-col :sm="24" :md="8">
                    <uni-list-item title="生产数量" :right-text="`${ppbom.qty} ${ppbom.unit_name}`" />
                </uni-col>
            </uni-row>
            <uni-row>
                <uni-col :sm="24" :md="8">
                    <uni-list-item title="生产车间" :right-text="ppbom.workshop" />
                </uni-col>
                <uni-col :sm="24" :md="8">
                    <uni-list-item title="产线" :right-text="ppbom.prd_line" />
                </uni-col>
                <uni-col :sm="24" :md="8">
                    <uni-list-item title="计划上线时间" :right-text="ppbom.prd_time" />
                </uni-col>
            </uni-row>
            <uni-row>
                <uni-col :sm="24" :md="8">
                    <uni-list-item title="产品名称" :right-text="ppbom.material_name" />
                </uni-col>
                <uni-col :sm="24" :md="16">
                    <uni-list-item title="规格型号" :right-text="ppbom.material_spec" />
                </uni-col>
            </uni-row>
        </uni-list>
        
        <uni-table ref="table" border stripe class="table-sm">
            <uni-tr>
                <uni-th align="center" width="50">序号</uni-th>
                <uni-th align="center">物料编码</uni-th>
                <uni-th align="center">物料名称</uni-th>
                <uni-th align="center">规格型号</uni-th>
                <uni-th align="center" width="50">分子</uni-th>
                <uni-th align="center" width="50">单位</uni-th>
                <uni-th align="center">数量</uni-th>
                <uni-th align="center" width="110">物料状态确认</uni-th>
                <uni-th align="center">工序地址</uni-th>
            </uni-tr>
            <uni-tr v-for="(obj, index) in ppbom.entry" :key="index">
                <uni-td align='center'>{{ obj.seq }}</uni-td>
                <uni-td align="center">{{ obj.material_no }}</uni-td>
                <uni-td align="center">{{ obj.material_name }}</uni-td>
                <uni-td align="center">{{ obj.material_spec }}</uni-td>
                <uni-td align="center">{{ obj.numerator }}</uni-td>
                <uni-td align="center">{{ obj.unit_name }}</uni-td>
                <uni-td align="center">{{ obj.qty }}</uni-td>
                <uni-td align="center">
                    <checkbox
                        :checked="obj.is_confirmed"
                        :data-id="obj.id"
                        @click="checkbox_click"
                    />
                </uni-td>
                <uni-td align="center">{{ obj.bzgx }}</uni-td>
            </uni-tr>
        </uni-table>
    </uni-section>
    
    <view class="uni-goods-nav-wrapper">
        <uni-goods-nav 
            :options="goods_nav.options" 
            :button-group="goods_nav.button_group"
            :fill="$store.state.goods_nav_fill"
            @click="goods_nav_click"
            @buttonClick="goods_nav_button_click"
        />
    </view>
</template>

<script>
    import store from '@/store'
    import { PrdPpbom, PrdMo } from '@/utils/model'
    import scan_code from '@/utils/scan_code'
    
    export default {
        data() {
            return {
                search_form: {
                    bill_no: ''
                },
                ppboms: [],
                ppbom: {},
                mo_status_dict: PrdMo.FStatusEnum,
                goods_nav: {
                    options: [
                        { icon: 'checkbox', text: '全选' }
                    ],
                    button_group: [
                        { text: '扫描单据', backgroundColor: store.state.goods_nav_color.red, color: '#fff' },
                        { text: '保存', backgroundColor: store.state.goods_nav_color.grey, color: '#fff' },
                    ]
                }
            }
        },
        mounted() {
            this.handle_search()
        },
        methods: {
            check_all() {
                if (!this.ppbom.id) return
                let checked_all = !this.ppbom.entry.find(x => !x.is_confirmed)
                for(let obj of this.ppbom.entry) {
                    obj.is_confirmed = !checked_all
                }
            },
            checkbox_click(e) {
                let obj = this.ppbom.entry.find(x => x.id === e.target.dataset.id)
                obj.is_confirmed = !obj.is_confirmed
            },
            searchbar_icon_click(e) {
                if (e == 'prefix') this.scan_code()
            },
            goods_nav_click(e) {
                if (e.index === 0) this.check_all()
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.scan_code() // btn:扫码查询单据
                if (e.index === 1) this.submit_save()
            },
            // helper
            scan_code() {
                scan_code().then(res => {
                    this.search_form.bill_no = res.result
                    this.handle_search()
                }).catch(err => {
                    uni.showToast({ icon: 'none', title: err })
                })
            },
            clear_data() {
                this.ppboms = []
                this.ppbom = {}
                this.goods_nav.button_group[1].backgroundColor = store.state.goods_nav_color.grey
            },
            async handle_search(e) {
                this.clear_data()
                if (this.search_form.bill_no) {
                    await this.load_ppboms()
                }
            },
            async load_ppboms() {
                let options = { FMoBillNo: this.search_form.bill_no.trim() }
                let meta = {
                    fields: [ 'FID', 'FBillNo', 'FMoBillNo', 'FMoEntrySeq', 'FSaleOrderNo', 'FWorkShopId.FName', 'FMoEntryStatus',
                              'FMaterialId', 'FMaterialId.FNumber', 'FMaterialId.FName', 'FMaterialId.FSpecification',
                              'FQty', 'FUnitId.FName' ],
                    order: 'FMoEntrySeq ASC'
                }
                uni.showLoading({ title: 'Loading' })
                let res = await PrdPpbom.query(options, meta)
                uni.hideLoading()
                if (res.data.length) {
                    if (res.data.length == 1) this.load_ppbom(res.data[0])
                    this.ppboms = res.data
                } else {
                    this.ppboms = []
                    uni.showToast({ icon: 'none' ,title: '没有相关数据' })
                }
            },
            async load_ppbom(obj) {
                let options = { FBillNo: obj.FBillNo, FMustQty_gt: 0 }
                let meta = {
                    fields: [ 'FEntity_FEntryId', 'FMaterialId2', 'FMaterialId2.FNumber', 'FMaterialId2.FName', 'FMaterialId2.FSpecification', 'FMaterialId2.F_PAEZ_Base1', 'FMaterialType',
                              'FNumerator', 'FDenominator', 'FUnitId2.FName', 'FMustQty', 'FStockId', 'FStockId.FName', 'FReplaceGroup', 'F_RGEN_CheckBox_wlztqr', 'FMaterialId2.F_RGEN_Text_bzgx'],
                    order: 'FReplaceGroup ASC'
                }
                uni.showLoading({ title: 'Loading' })
                let res = await PrdPpbom.query(options, meta)
                uni.hideLoading()
                let ppbom = {
                    id: obj.FID,
                    bill_no: obj.FBillNo,
                    mo_bill_no: obj.FMoBillNo,
                    sale_order_no: obj.FSaleOrderNo,
                    qty: obj.FQty,
                    unit_name: obj['FUnitId.FName'],
                    workshop: obj['FWorkShopId.FName'],
                    prd_line: '',
                    prd_time: '',
                    material_no: obj['FMaterialId.FNumber'],
                    material_name: obj['FMaterialId.FName'],
                    material_spec: obj['FMaterialId.FSpecification'],
                    entry: []
                }
                for (let d of res.data) {
                    ppbom.entry.push({
                        id: d['FEntity_FEntryId'],
                        seq: d['FReplaceGroup'],
                        material_id: d['FMaterialId2'],
                        material_no: d['FMaterialId2.FNumber'],
                        material_name: d['FMaterialId2.FName'],
                        material_spec: d['FMaterialId2.FSpecification'],
                        numerator: d['FNumerator'],
                        qty: d['FMustQty'],
                        unit_name: d['FUnitId2.FName'],
                        stock_id: d['FStockId'],
                        stock_name: d['FStockId.FName'],
                        storekeeper: d['FMaterialId2.F_PAEZ_Base1'],
                        is_confirmed: d['F_RGEN_CheckBox_wlztqr'],
                        bzgx: d['FMaterialId2.F_RGEN_Text_bzgx']
                    })
                }
                let mo_res = await PrdMo.query({ FBillNo: obj.FMoBillNo, FSeq: obj.FMoEntrySeq })
                if (mo_res.data.length) {
                    ppbom.prd_line = mo_res.data[0]['F_LT_CX.FName']
                    ppbom.prd_time = mo_res.data[0]['FPlanStartDate'].split('T')[0]
                }
                this.ppbom = ppbom
                this.goods_nav.button_group[1].backgroundColor = store.state.goods_nav_color.blue
            },
            async submit_save() {
                if (!this.ppbom.id) return
                let entity = []
                for (let obj of this.ppbom.entry) {
                    entity.push({ FEntryId: obj.id, F_RGEN_CheckBox_wlztqr: obj.is_confirmed })
                }
                uni.showLoading({ title: 'Loading' })
                let res = await PrdPpbom.update(this.ppbom.id, { FEntity: entity })
                uni.hideLoading()
                if (res.data.Result.ResponseStatus.IsSuccess) {
                    uni.showToast({ title: '保存成功' })
                } else {
                    uni.showModal({ title: '保存失败', content: `原因：${res.data.Result.ResponseStatus.Errors[0]?.Message}` })
                }
                
            }
        }
    }
</script>

<style lang="scss" scoped>
    .uni-list-item::v-deep {
        .uni-list-item__container {
            padding: 9px 15px;
        }
        .uni-list-item__content-title {
            font-weight: bold;
        }
        .uni-list-item__extra {
            flex: 2;
        }
        .uni-list-item__extra-text {
            color: #666;
            font-size: 13px;
        }
    }
</style>
