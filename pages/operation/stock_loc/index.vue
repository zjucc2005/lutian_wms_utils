<template>
    <uni-section title="当前仓库" type="square"
        :sub-title="breadcrumb_stockname()"
        sub-title-color="#007aff"
        @click="debug"
        >
        <uni-row v-if="$store.state.screen_type === 'h5'" >
            <uni-col :span="6">
                <uni-group title="搜索栏" mode="card" style="margin-top: 0;">
                    <uni-forms ref="search_form" :model="search_form" >
                        <uni-forms-item label="编码">
                            <uni-easyinput v-model="search_form.no" trim />
                        </uni-forms-item>
                        <uni-forms-item label="库位备注">
                            <uni-easyinput v-model="search_form.remark" trim />
                        </uni-forms-item>
                        <uni-forms-item label="禁用状态">
                            <uni-data-select v-model="search_form.forbid_status" :localdata="[{ value: 'B', text: '是' },{ value: 'A', text: '否' }]" />
                        </uni-forms-item>
                    </uni-forms>
                    <button type="primary" size="mini" @click="search">搜索</button>
                    <button size="mini" @click="reset_search_form" class="uni-ml-5">重置</button>
                </uni-group>
                
                <uni-group title="批量更新(勾选库位号)" mode="card">
                    <uni-forms ref="edit_form" :model="edit_form" >
                        <uni-forms-item label="库位备注">
                            <uni-easyinput v-model="edit_form.remark" trim />
                        </uni-forms-item>
                    </uni-forms>
                    <button type="primary" size="mini" @click="batch_update">提交</button>
                </uni-group>
                
                <uni-group title="其他操作" mode="card">
                    <button size="mini" @click="link_to('/pages/operation/stock_loc/map')">库位平面图</button>
                    <button v-if="$store.state.config.log" type="primary" size="mini" @click="link_to('/pages/operation/stock_loc/new')" class="uni-ml-5">新增库位</button>
                </uni-group>
            </uni-col>
            
            <uni-col :span="18">
                <uni-table ref="table" type="selection" stripe class="cc-list-scroll">
                    <uni-tr>
                        <uni-th align="center">编码</uni-th>
                        <uni-th align="center">分组</uni-th>
                        <uni-th align="center">横向位置</uni-th>
                        <uni-th align="center">纵向位置</uni-th>
                        <uni-th align="center">位数</uni-th>
                        <uni-th align="center">库位备注</uni-th>
                        <uni-th align="center">禁用状态</uni-th>
                        <!-- <uni-th align="center"></uni-th> -->
                    </uni-tr>
                    <uni-tr v-for="(loc, index) in table_data" :key="index" :style="{ backgroundColor: loc.FForbidStatus == 'B' ? 'rgb(254, 240, 240)' : '' }">
                        <uni-td align="center">{{ loc.FNumber }}</uni-td>
                        <uni-td align="center">{{ loc.FGroup }}</uni-td>
                        <uni-td align="center">{{ loc.FPosX }}</uni-td>
                        <uni-td align="center">{{ loc.FPosY }}</uni-td>
                        <uni-td align="center">{{ loc.FPalletSpace }}</uni-td>
                        <uni-td align="center">{{ loc.FRemark }}</uni-td>
                        <uni-td align="center">
                            <view v-if="loc.FForbidStatus == 'B'" class="text-error">是</view>
                            <view v-else>否</view>
                        </uni-td>
                        <!-- <uni-td align="center">
                            <uni-tag v-if="loc.FForbidStatus == 'B'" text="解禁" type="success" size="small" @click="stock_loc_enable(loc.FNumber)" />
                            <uni-tag v-else text="禁用" type="error" size="small" @click="stock_loc_forbid(loc.FNumber)" />
                        </uni-td> -->
                    </uni-tr>
                </uni-table>
                
                <uni-pagination v-if="stock_locs_q.length > 0"
                    :total="stock_locs_q.length" 
                    :current="cur_page" 
                    :page-size="per_page" 
                    show-icon
                    @change="change_page"
                    class="uni-mt-5"
                />
            </uni-col>
        </uni-row>
        
        <template v-else>
            <uni-list class="cc-list-scroll">
                <uni-list-item v-for="(loc, index) in table_data" 
                    :key="index"
                    :title="loc.FNumber"
                    :right-text="loc.FRemark"
                    :style="{ backgroundColor: loc.FForbidStatus == 'B' ? 'rgb(254, 240, 240)' : '' }"
                    />
            </uni-list>
            <uni-pagination v-if="stock_locs_q.length > 0"
                :total="stock_locs_q.length" 
                :current="cur_page" 
                :page-size="per_page" 
                show-icon
                @change="change_page"
            />
            <view class="uni-goods-nav-wrapper">
                <uni-goods-nav 
                    :options="goods_nav.options" 
                    :button-group="goods_nav.button_group"
                    :fill="$store.state.goods_nav_fill"
                    @click="goods_nav_click"
                    @buttonClick="goods_nav_button_click"
                />
            </view>
            <uni-popup ref="search_dialog" type="dialog">
                <uni-popup-dialog
                    type="info"
                    title="搜索条件"
                    cancelText="关闭"
                    @close="$refs.search_dialog.close()"
                    @confirm="search_dialog_confirm"
                    :before-close="true"
                    :style="{ width: $store.state.system_info.windowWidth - 20 + 'px', minWidth: '360px', maxWidth: '1200px' }"
                    >
                    <view style="flex: 1;">
                        <uni-forms ref="search_form" :model="search_form" >
                            <uni-forms-item label="编码">
                                <uni-easyinput v-model="search_form.no" trim />
                            </uni-forms-item>
                            <uni-forms-item label="库位备注">
                                <uni-easyinput v-model="search_form.remark" trim />
                            </uni-forms-item>
                            <uni-forms-item label="禁用状态">
                                <uni-data-select v-model="search_form.forbid_status" :localdata="[{ value: 'B', text: '是' },{ value: 'A', text: '否' }]" />
                            </uni-forms-item>
                        </uni-forms>
                    </view>
                </uni-popup-dialog>
            </uni-popup>
        </template>
    </uni-section>
</template>

<script>
    import store from '@/store'
    import { breadcrumb_stockname, link_to } from '@/utils'
    import { StockLoc } from '@/utils/model'
    
    export default {
        data() {
            return {
                stock_locs: store.state.stock_locs,
                stock_locs_q: store.state.stock_locs, // 过滤结果
                cur_page: 1,
                per_page: 40,
                search_form: {
                    no: '',
                    remark: '',
                    forbid_status: ''
                },
                edit_form: {
                    remark: ''
                },
                goods_nav: {
                    options: [
                        { icon: 'search', text: '搜索' },
                        { icon: 'clear', text: '重置' },
                        { icon: 'map', text: '平面图' }
                    ],
                    button_group: [
                        // { text: '搜索', backgroundColor: store.state.goods_nav_color.blue, color: '#fff' },
                    ]
                }
            }
        },
        computed: {
            table_data() {
                let a = (this.cur_page - 1) * this.per_page
                return this.stock_locs_q.slice(a, a + this.per_page)
            }
        },
        methods: {
            breadcrumb_stockname,
            link_to,
            debug() {
                this.$logger.info('>>> $data', this.$data)
                console.log('>>> store', store)
            },
            change_page(e) {
                this.cur_page = e.current
            },
            goods_nav_click(e) {
                if (e.index === 0) this.$refs.search_dialog.open()
                if (e.index === 1) this.reset_search_form()
                if (e.index === 2) link_to('/pages/operation/stock_loc/map')
            },
            goods_nav_button_click(e) {
                // if (e.index === 0) this.$refs.search_dialog.open()
            },
            refresh_page() {
                let o_cur_page = this.cur_page
                this.search()
                this.cur_page = o_cur_page
            },
            reset_edit_form() {
                this.edit_form = { remark: '' }
            },
            reset_search_form() {
                this.search_form = { no: '', remark: '', forbid_status: '' }
                this.search()
            },
            search() {
                this.stock_locs_q = this.stock_locs.filter(stock_loc => {
                    if (this.search_form.no && !stock_loc.FNumber.includes(this.search_form.no.toUpperCase())) return false
                    if (this.search_form.remark && !stock_loc.FRemark.includes(this.search_form.remark)) return false
                    if (this.search_form.forbid_status && stock_loc.FForbidStatus != this.search_form.forbid_status) return false
                    return true
                })
                this.cur_page = 1
            },
            search_dialog_confirm() {
                this.search()
                this.$refs.search_dialog.close()
            },
            async batch_update() {
                let checked_idx = this.$refs.table.backIndexData
                if (!checked_idx.length) {
                    uni.showToast({ icon: 'none', title: '请先选择库位号' })
                    return
                }
                let params = []
                for (let idx of checked_idx) {
                    let obj = this.table_data[idx]
                    params.push({ FID: obj.FID, FRemark: this.edit_form.remark })
                }
                uni.showLoading({ title: 'Loading' })
                await StockLoc.batch_save(params)
                await this.load_stock_locs() // 重新加载库位数据
                uni.hideLoading()
                this.refresh_page()
                this.$refs.table.clearSelection()
                this.reset_edit_form()
                uni.showToast({ title: '更新成功' })
            },
            async load_stock_locs() {
                let stock_locs = await StockLoc.get_all()
                store.commit('set_stock_locs', stock_locs)
                this.stock_locs = stock_locs
            },
            async stock_loc_enable(loc_no) {
                uni.showLoading({ title: 'Loading' })
                await StockLoc.enable([loc_no])
                await this.load_stock_locs()
                uni.hideLoading()
                uni.showToast({ icon: 'none', title: `${loc_no} 解禁成功`})
                this.refresh_page()
            },
            async stock_loc_forbid(loc_no) {
                uni.showLoading({ title: 'Loading' })
                await StockLoc.forbid([loc_no])
                await this.load_stock_locs()
                uni.hideLoading()
                uni.showToast({ icon: 'none', title: `${loc_no} 禁用成功`})
                this.refresh_page()
            },
            
        }
    }
</script>

<style lang="scss" scoped>
    .cc-list-scroll {
        width: 100%;
        overflow-x: auto;
        height: calc(100vh - 187px);
    }
    .uni-table-tr::v-deep {
        .uni-table-td {
            padding: 4px 5px;
        }
    }
    .uni-group--card::v-deep {
        overflow: visible;
    }
</style>
