<template>
    <view>
        <uni-section title="查询物料编码" type="line">
            <uni-search-bar
                v-model="search_form.no"
                :focus="true"
                bgColor="#EEEEEE"
                cancelButton="none"
                @confirm="handle_search"
                @clear="handle_search"
            />
            <uni-list v-if="material.material_no">
                <uni-list-item
                    :title="material.material_no"
                    :note="[material.material_name, material.material_spec].join('\n')"
                    :show-extra-icon="true"
                    :extra-icon="{ color: '#007bff', size: '24', type: 'info' }"
                />
            </uni-list>
        </uni-section>
        
        <uni-section v-if="invs.length" title="库存列表" type="line" class="above-uni-goods-nav">
            <uni-list>
                <template
                    v-for="(inv, index) in invs"
                    :key="index"
                >
                    <uni-list-item
                        :title="inv['FStockLocId.FNumber']"
                        :note="inv['FBatchNo']"
                        :rightText="[inv['FQty'], inv['FStockUnitId.FName']].join(' ')"
                        @click="open_move_dialog(inv)" clickable
                        showArrow
                    />
                    <uni-list-item
                        v-for="(move_item, move_index) in move_cart.move_list.filter(x => x.inv.FID == inv.FID)"
                        :key="move_index"
                        :title="move_item.loc_no"
                        :rightText="[move_item.qty, move_item.inv['FStockUnitId.FName']].join(' ')"
                        :show-extra-icon="true"
                        :extra-icon="{ color: '#007bff', size: '24', type: 'redo' }"
                        @click="open_move_dialog(inv, move_item)" clickable
                        showArrow
                        style="background-color: #f0f0f0;"
                    />
                </template>
                
            </uni-list>
        </uni-section>
        
        <view class="uni-goods-nav-wrapper">
            <uni-goods-nav 
                :options="goods_nav.options" 
                :button-group="goods_nav.button_group"
                @click="goods_nav_click"
                @buttonClick="goods_nav_button_click"
            />
        </view>
        
        <uni-popup ref="move_dialog" type="dialog">
            <uni-popup-dialog
                type="error"
                title="调整计划"
                cancelText="关闭"
                :confirmText="move_dialog.confirm_text"
                @close="close_move_dialog"
                @confirm="confirm_move_dialog"
                :beforeClose="true"
            >
                <view class="move-form">
                    <uni-forms ref="move_form" :model="move_form" :rules="move_form_rules">
                        <uni-row>
                            <uni-col :span="8" class="move-form-left">
                                {{ move_form.inv['FStockLocId.FNumber'] || '-' }}                            
                            </uni-col>
                            <uni-col :span="4" class="move-form-center">
                                <uni-icons type="redo" :size="20" color="#007bff"></uni-icons>
                            </uni-col>
                            <uni-col :span="12" class="move-form-right">
                                <uni-forms-item name="loc_no">
                                    <uni-data-picker
                                        v-model="move_form.loc_no"
                                        :localdata="stock_loc_opts"
                                        split="-"
                                        popup-title="请选择库位"
                                        :readonly="this.move_form.action == 'edit'"
                                    />
                                </uni-forms-item>
                            </uni-col>
                        </uni-row>
                        <uni-row>
                            <uni-col :span="8" class="move-form-left">
                                {{ move_form.inv['FBatchNo'] || '-' }}
                            </uni-col>
                            <uni-col :span="4" class="move-form-center">
                                <uni-icons type="redo" :size="20" color="#007bff"></uni-icons>
                            </uni-col>
                            <uni-col :span="12" class="move-form-right">
                                {{ move_form.inv['FBatchNo'] }}
                            </uni-col>
                        </uni-row>
                        <uni-row>
                            <uni-col :span="8" class="move-form-left">
                                {{ move_form.inv['FQty'] || '-' }}
                                <text v-if="move_form.qty" class="moving-qty">- {{ move_form.qty }}</text>
                            </uni-col>
                            <uni-col :span="4" class="move-form-center">
                                <uni-icons type="redo" :size="20" color="#007bff"></uni-icons>
                            </uni-col>
                            <uni-col :span="12" class="move-form-right">   
                                <uni-forms-item name="qty" style="padding-top: 5px;">
                                    <uni-number-box 
                                        v-model="move_form.qty"
                                        :min="0"
                                        :max="move_form.inv['FQty']"
                                        :width="60"
                                    />
                                </uni-forms-item>
                            </uni-col>
                        </uni-row>
                    </uni-forms>
                </view>
            </uni-popup-dialog>
        </uni-popup>
    </view>
</template>

<script>
    import store from '@/store'
    import { play_audio_prompt } from '@/utils'
    import { get_bd_material } from '@/utils/api'
    import { Inv, MoveCart } from '@/utils/model'
    // #ifdef APP-PLUS
    const myScanCode = uni.requireNativePlugin('My-ScanCode')
    // #endif 
    export default {
        data() {
            return {
                cur_stock: {},
                cur_staff: {},
                stock_locs: [],
                stock_loc_opts: [],
                bd_materials: [], // 物料基础数据Array，cache
                invs: [],
                move_cart: { move_list: [] },
                material: {
                    material_no: '',
                    material_name: '',
                    material_spec: '',
                    base_unit_name: ''
                },
                search_form: {
                    no: ''
                },
                move_dialog: {
                    confirm_text: '新增'
                },
                move_form: {
                    action: 'new',
                    inv: {},
                    loc_no: '',
                    qty: 0
                },
                move_form_rules: {
                    loc_no: {
                        rules: [
                            { required: true, errorMessage: '库位号不能为空' },
                            {
                                validateFunction: (rule, value, data, callback) => {
                                    if (value == this.move_form.inv['FStockLocId.FNumber']) return callback('库位号不能相同')
                                }
                            }
                        ]
                    },
                    qty: {
                        rules: [
                            {
                                validateFunction: (rule, value, data, callback) => {
                                    if (value < 0) return callback('调整数量不能小于0')
                                    let rest_qty = this.move_form.inv.FQty
                                    this.move_cart.move_list.forEach(x => {
                                        if (x.inv.FID == this.move_form.inv.FID && x.loc_no != this.move_form.loc_no) {
                                            rest_qty -= x.qty
                                        } 
                                    })
                                    if (rest_qty < value) return callback('调整总数不能超过当前库存')
                                }
                            }
                        ]
                    }                    
                },
                goods_nav: {
                    options: [
                        { icon: 'cart', text: '计划', info: 0 }
                    ],
                    button_group: [
                        {
                            text: '扫码查询',
                            backgroundColor: 'linear-gradient(90deg, #FE6035, #EF1224)',
                            color: '#fff'
                        },
                        {
                            text: '预览计划',
                            backgroundColor: 'linear-gradient(90deg, #1E83FF, #0053B8)',
                            color: '#fff'
                        }
                    ]
                }
            }
        },
        mounted() {
            this.cur_stock = store.state.cur_stock
            this.cur_staff = store.state.cur_staff
            this.move_cart = MoveCart.current()
            this.refresh_cart_info()
            this.load_stock_locs()
            if (this.search_form.no) this.handle_search()
            let _this_ = this
            uni.$off('syncMoveCart') // 移除同名监听事件
            uni.$on('syncMoveCart', function(res) {
                _this_.move_cart = MoveCart.current()
                _this_.refresh_cart_info()
                _this_.handle_search()
                console.log('全局监听事件syncMoveCart res:', res);
            })
        },
        methods: {
            // >>> component
            goods_nav_click(e) {
                if (e.index == 0) this.preview_cart()
            },
            goods_nav_button_click(e) {
                if (e.index == 0) this.scan_code() // btn:库存查询
                if (e.index == 1) {
                    this.preview_cart()
                    console.log('debug:', this.$data) // btn:提交确认
                }
            },
            // >>> action
            load_stock_locs() {
                this.stock_locs = store.state.stock_locs // 加载当前仓库的库位数据
                this.stock_loc_opts = store.state.stock_loc_opts
                // StockLoc.query({ FStockId: this.cur_stock.FStockId }).then(res => {
                //     this.stock_locs = res.data // 加载当前仓库的库位数据
                //     this.set_stock_loc_opts() // 生成库位tree数据
                // })
            },
            preview_cart() {
                uni.navigateTo({ url: '/pages/operation/move/move_cart' })
                // if (this.move_cart.move_list.length) {
                //     uni.navigateTo({ url: '/pages/operation/move/move_cart' })
                // } else {
                //     uni.showToast({ icon: 'none', title: '当前计划为空' })
                // }
            },
            scan_code() {
                // #ifdef APP-PLUS
                myScanCode.scanCode({}, (res) => {
                    console.log('myScanCode res:', res)
                    if (res.success == 'true') this.handle_inv_search(res.result)
                })
                // #endif               
                // #ifndef APP-PLUS
                uni.scanCode({
                    success: (res) => {
                        console.log('uni.scanCode res:', res)
                        this.handle_inv_search(res.result)
                    }
                })
                // #endif
            },
            handle_inv_search(text) {
                this.search_form.no = text
                this.handle_search()
            },
            async handle_search(e) {
                uni.showLoading({ title: 'Loading' })
                if (this.search_form.no) {
                    let material_no = this.search_form.no
                    let bd_material = this.bd_materials.find(x => x.FNumber == material_no)
                    bd_material ||= await this.load_material(material_no)
                    this.set_material(bd_material)
                    if (bd_material) {
                        this.load_invs(material_no)
                    } else {
                        this.invs = []
                    }
                } else {
                    this.set_material()
                    this.invs = []
                }
                uni.hideLoading()
            },
            async load_material(material_no) {
                let res = await get_bd_material(material_no, this.cur_stock.FUseOrgId)
                if (res.data[0]) {                  
                    this.bd_materials.push(res.data[0])
                    return res.data[0]
                }
            },
            set_material(bd_material) {
                if (bd_material) {
                    this.material.material_no = bd_material.FNumber
                    this.material.material_name = bd_material.FName
                    this.material.material_spec = bd_material.FSpecification
                    this.material.base_unit_name = bd_material['FBaseUnitId.FName']
                } else {
                    this.material.material_no = ''
                    this.material.material_name = ''
                    this.material.material_spec = ''
                    this.material.base_unit_name = 'Pcs'
                }
            },
            load_invs(material_no) {               
                Inv.query({
                    FStockId: this.cur_stock.FStockId,
                    'FMaterialId.FNumber': material_no,
                    FQty_gt: 0 }, { order: 'FStockLocId.FNumber ASC, FBatchNo ASC' }
                ).then(res => { 
                    this.invs = res.data
                })
            },
            open_move_dialog(inv, move_item) {
                console.log('open_move_dialog inv:', inv)
                this.move_form.inv = inv
                if (move_item) {
                    this.move_form.loc_no = move_item.loc_no
                    this.move_form.qty = move_item.qty
                    this.move_form.action = 'edit'
                    this.move_dialog.confirm_text = '修改'
                } else {
                    this.move_form.action = 'new'
                    this.move_dialog.confirm_text = '新增'
                }
                this.$refs.move_dialog.open()
            },
            close_move_dialog() {
                // console.log('close_move_dialog')
                this.$refs.move_dialog.close()
                this.move_form = { inv: {}, loc_no: '', qty: 0 }
            },
            confirm_move_dialog() {
                this.$refs.move_form.validate().then(res => {
                    let move_cart = new MoveCart(this.move_cart)
                    this.move_cart = move_cart.update(this.move_form)
                    // console.log('confirm_move_dialog', this.move_form)
                    this.refresh_cart_info()
                    this.close_move_dialog()
                }).catch(err => console.log('validate err:', err) )
            },
            refresh_cart_info() {
                let sum_qty = 0
                this.move_cart.move_list.map(x=> sum_qty += x.qty)
                this.goods_nav.options[0].info = sum_qty // 更新cart角标数量
            }
        }
    }
</script>

<style lang="scss">
    .move-form {
        flex: 1;
        font-size: 14px;
        line-height: 35px;
        .move-form-left {
            color: $uni-text-color-grey;
            .moving-qty {
                color: $uni-color-error;
                font-weight: bold;
            }
        }
        .move-form-right {
            color: $uni-text-color;
            height: 50px;
        }
    }
</style>
