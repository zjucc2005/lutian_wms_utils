<template>
    <!-- 搜素 -->
    <uni-section title="查询单据编号" type="square" sub-title="生产发料通知单" sub-title-color="#007aff" @click="console.log('this.$data', this.$data)">
        <view class="searchbar-container">
            <uni-easyinput
                v-model="search_form.bill_no" 
                placeholder="请输入单据编号"
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
    <!-- 分配库位 -->
    <uni-section v-if="scfl.length" title="子项明细" type="square"
        :sub-title="`产线：${scfl[0]?.prd_line}`" sub-title-color="#007aff" class="above-uni-goods-nav">
        <uni-table v-if="$store.state.screen_type === 'h5'" ref="table" border stripe>
            <uni-tr>
                <uni-th align="center" width="60">序号</uni-th>
                <uni-th align="center">物料编码</uni-th>
                <uni-th align="center">物料名称</uni-th>
                <uni-th align="center">规格型号</uni-th>
                <uni-th align="center">单位</uni-th>
                <uni-th align="center">应发数量</uni-th>
                <uni-th align="center">已调拨数量</uni-th>
                <uni-th align="center">仓库</uni-th>
                <uni-th align="center">仓管员</uni-th>
                <uni-th align="center">操作</uni-th>
            </uni-tr>
            
            <uni-tr v-for="(obj, index) in scfl" :key="index">
                <uni-td align="center">{{ index + 1 }}</uni-td>
                <uni-td>{{ obj.material_no }}</uni-td>
                <uni-td>{{ obj.material_name }}</uni-td>
                <uni-td>{{ obj.material_spec }}</uni-td>
                <uni-td align="center">{{ obj.unit_name }}</uni-td>
                <uni-td align="center">{{ obj.must_qty }}</uni-td>
                <uni-td align="center">{{ inv_plans_map[obj.material_id] }}</uni-td>
                <uni-td><text :class="[obj.stock_id == $store.state.cur_stock.FStockId ? 'text-primary' : 'text-error']">{{ obj.stock_name }}</text></uni-td>
                <uni-td>{{ obj.storekeeper }}</uni-td>
                <uni-td align="center">
                    <uni-tag text="分配库位" type="primary" @click="allocate_loc_no(obj)"/>
                </uni-td>
            </uni-tr>
        </uni-table>
        
        <uni-list v-else>
            <uni-list-item v-for="(obj, index) in scfl" :key="index"
                @click="allocate_loc_no(obj)" clickable
                show-arrow>
                <template #body>
                    <view class="uni-list-item__body">
                        <text class="title">{{ obj.material_no }}</text>
                        <view class="note">
                            <view>名称：{{ obj.material_name }}</view> 
                            <view>规格：{{ obj.material_spec }}</view>
                            <view>仓库：<text :class="[obj.stock_id == $store.state.cur_stock.FStockId ? 'text-primary' : 'text-error']">{{ obj.stock_name }}</text></view>
                            <view>仓管员：{{ obj.storekeeper }}</view>
                        </view>
                    </view>
                </template>
                <template #footer>
                    <view class="uni-list-item__foot">
                        <view>{{ obj.must_qty }} {{ obj.unit_name }}</view>
                        <view v-if="inv_plans_map[obj.material_id]">已调拨：<text class="text-primary">{{ inv_plans_map[obj.material_id] }}</text></view>
                    </view>
                </template>
            </uni-list-item>
        </uni-list>
    </uni-section>
    
    <view v-if="$store.state.screen_type === 'app-plus'" class="uni-goods-nav-wrapper">
        <uni-goods-nav 
            :options="goods_nav.options" 
            :button-group="goods_nav.button_group"
            :fill="$store.state.goods_nav_fill"
            @click="goods_nav_click"
            @buttonClick="goods_nav_button_click"
        />
    </view>
    
    <cover-image v-if="is_completed" src="/static/icon/yiwancheng_stamp.png" class="yiwancheng-stamp" />
</template>

<script>
    import store from '@/store'
    import { play_audio_prompt } from '@/utils'
    import scan_code from '@/utils/scan_code'
    import { PrdIssueMtrNotice, InvPlan } from '@/utils/model'
    export default {
        data() {
            return {
                scfl: [], // 发料物料
                inv_plans: [], // 已计划
                inv_plans_map: {}, // 优化计划查询性能
                search_form: {
                    bill_no: ''
                },
                goods_nav: {
                    options: [
                        // { icon: 'cart', text: '计划', info: '' }
                    ],
                    button_group: [
                        { text: '扫码查询单据', backgroundColor: store.state.goods_nav_color.red, color: '#fff' }
                    ]
                }
            }
        },
        onShow() {
            this.load_inv_plans()
        },
        computed: {
            is_completed() {
                let res = true
                if (this.scfl.length) {
                    for (let m of this.scfl) {
                        if (!this.inv_plans_map[m.material_id] || this.inv_plans_map[m.material_id] < m.must_qty) {
                            res = false
                            break
                        }
                    }
                } else {
                    res = false
                }
                return res
            }
        },
        methods: {
            // 页面动作
            goods_nav_click(e) {
                if (e.index === 0) this.$logger.info('this.$data', this.$data)
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.scan_code() // btn:扫码查询单据
            },
            searchbar_icon_click(e) {
                if (e == 'prefix') this.scan_code()
            },
            scan_code() {
                scan_code().then(res => {
                    this.search_form.bill_no = res.result
                    this.handle_search()
                }).catch(err => {
                    uni.showToast({ icon: 'none', title: err })
                })
            },
            // 搜索
            async handle_search() {
                if (this.search_form.bill_no) {
                    this.search_form.bill_no = this.search_form.bill_no.trim().toUpperCase()
                    if (this.search_form.bill_no.match(/^\d+$/)) {
                        this.search_form.bill_no = 'SCFLTZD' + this.search_form.bill_no // 自动补充前缀
                    }
                    await this.load_scfltzd()
                } else {
                    this.scfl = []
                    this.inv_plans = []
                }
            },
            // 选择库位
            allocate_loc_no(obj) {
                uni.navigateTo({
                    url: '/pages/operation/move/unpack_allocate',
                    events: {
                        eventOutput: (data) => {
                            // this.preview(data.allocate_info)
                            // this.submit_save()
                        }
                    },
                    success: (res) => {
                        play_audio_prompt('success')
                        res.eventChannel.emit('eventInput', { bill_no: this.search_form.bill_no, material: obj }) // 候选的库位列表
                    }
                })
            },
            // ** 加载数据 **
            async load_scfltzd() {
                try {
                    uni.showLoading({ title: 'Loading' })
                    // 区分仓管员
                    let res = await PrdIssueMtrNotice.query({ FBillNo: this.search_form.bill_no, F_PAEZ_BaseProperty1: store.state.cur_staff.FName })
                    uni.hideLoading()
                    if (res.data.length == 0) {
                        uni.showToast({ icon: 'none' ,title: '没有相关数据' })
                        return
                    }
                    let materials = []
                    for (let d of res.data) {
                        let material = materials.find(m => m.material_id === d.FMaterialId)
                        if (material) {
                            material.must_qty += d.FMustQty
                            material.base_must_qty += d.FBaseMustQty
                        } else {
                            materials.push({
                                material_id: d.FMaterialId,
                                material_no: d['FMaterialId.FNumber'],
                                material_name: d['FMaterialId.FName'],
                                material_spec: d['FMaterialId.FSpecification'],
                                storekeeper: d['F_PAEZ_BaseProperty1'],
                                stock_id: d.FStockId,
                                stock_name: d['FStockId.FName'],
                                prd_line: d['F_PAEZ_Base.FName'],
                                must_qty: d.FMustQty,
                                unit_id: d.FUnitId1,
                                unit_name: d['FUnitId1.FName'],
                                base_must_qty: d.FBaseMustQty,
                                base_unit_id: d.FBaseUnitId1,
                                base_unit_name: d['FBaseUnitId1.FName']
                            })
                        }
                    }
                    this.scfl = materials
                    await this.load_inv_plans()
                } catch (err) { }
            },
            async load_inv_plans() {
                let res = await InvPlan.query({ FBillNo: this.search_form.bill_no, FDocumentStatu: 'C', FOpType: 'mv' })
                this.inv_plans = res.data
                let inv_plans_map = {}
                for (let inv_plan of this.inv_plans) {
                    inv_plans_map[inv_plan.FMaterialId] ||= 0
                    inv_plans_map[inv_plan.FMaterialId] += inv_plan.FOpQTY
                }
                this.inv_plans_map = inv_plans_map
            }
        }
    }
</script>

<style>

</style>
