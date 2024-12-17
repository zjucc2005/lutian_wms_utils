<template>
    <template v-if="step == 'search'">
        <uni-notice-bar single scrollable text="请尽可能提供详细的查询条件,查询范围过大时,可能会超时导致失败,模糊查找时 %(百分号) 可以代替任意数个字符" />
        <uni-forms ref="search_form" :model="search_form" :rules="search_form_rules" labelWidth="70px">
            <uni-section title="整机信息" type="square">
                <view class="container">
                    <uni-forms-item label="编码" name="material_no">
                        <uni-easyinput
                            v-model="search_form.material_no"
                            trim="both"
                            prefix-icon="scan"
                            @icon-click="scan_code('material_no')"
                        />
                    </uni-forms-item>
                    <uni-forms-item label="名称" name="material_name">
                        <uni-easyinput v-model="search_form.material_name" trim="both"/>
                    </uni-forms-item>
                    <uni-forms-item label="规格" name="material_spec">
                        <uni-easyinput v-model="search_form.material_spec" trim="both"/>
                    </uni-forms-item>
                    <uni-forms-item label="存货类别" name="material_category_id">
                        <uni-data-select v-model="search_form.material_category_id" :localdata="material_categories" />
                    </uni-forms-item>
                    <uni-forms-item label="使用组织" name="use_org_id">
                        <uni-data-select v-model="search_form.use_org_id" :localdata="$store.state.bd_stock_opts" />
                    </uni-forms-item>
                </view>
            </uni-section>
        
            <uni-section title="配件信息" type="square">
                <view class="container">
                    <uni-forms-item label="编码" name="child_material_no">
                        <uni-easyinput
                            v-model="search_form.child_material_no"
                            trim="both"
                            prefix-icon="scan"
                            @icon-click="scan_code('child_material_no')"
                        />
                    </uni-forms-item>
                    <uni-forms-item label="名称" name="child_material_name">
                        <uni-easyinput v-model="search_form.child_material_name" trim="both"/>
                    </uni-forms-item>
                    <uni-forms-item label="规格" name="child_material_spec">
                        <uni-easyinput v-model="search_form.child_material_spec" trim="both"/>
                    </uni-forms-item>
                    <uni-forms-item label="库存仓库">
                        <uni-data-picker
                            ref="stock_id_data_picker"
                            v-model="search_form.child_stock_id"
                            :localdata="bd_stock_opts"
                            popup-title="请选择配件仓库"
                            >
                        </uni-data-picker>
                    </uni-forms-item> 
 <!--                   <button @click="search" type="primary">
                        <uni-icons type="search" color="#fff"></uni-icons> 搜索
                    </button> -->
                </view>
            </uni-section>
        </uni-forms>
    </template>
    
    <template v-if="step == 'show'">
        <uni-section :title="`搜索结果 ${search_res.length} 条`" sub-title="库存数据取自金蝶即时库存" type="square" class="above-uni-goods-nav">
            <view class="container">
                <uni-load-more v-if="tree_data.length === 0" status="nomore" />
                <view v-for="(obj, index) in tree_data" :key="index" class="cc-tree-card">
                    <view class="cc-tree-card-item">
                        <view class="cc-tree-card-item__section">
                            <view class="cc-tree-card-item__card">
                                <view class="cc-tree-card-item__body">
                                    <view class="title">{{ obj.material_no }} / <text class="text-primary">{{ obj.bom_no }}</text></view>
                                    <view class="note">名称：{{ obj.material_name }}</view>
                                    <view class="note">规格：{{ obj.material_spec }}</view>
                                    <view class="note">使用组织：{{ obj.use_org_name }}</view>
                                </view>
                                <view class="cc-tree-card-item__foot">
                                    
                                </view>
                                <view class="cc-tree-card-item__arrow">
                                    <uni-icons type="bottom" size="14" color="#999" />
                                </view>
                            </view>
                        </view>
                        
                        <view v-if="obj.open" class="cc-tree-card__sub">
                            <view v-for="(child, child_index) in obj.children" :key="child_index" class="cc-tree-card-item">
                                <view class="vertical-line"></view>
                                <view class="cc-tree-card-item__section">
                                    <view class="horizontal-line"></view>
                                    <view class="cc-tree-card-item__card" @click="child.bom_id ? search_bom(child.bom_id, child.material_no) : ''">
                                        <view class="cc-tree-card-item__body">
                                            <view v-if="child.bom_id" class="title">{{ child.material_no }} / <text class="text-primary">{{ child.bom_no }}</text></view>
                                            <view v-else class="title">{{ child.material_no }}</view>
                                            <view class="note">名称：{{ child.material_name }}</view>
                                            <view class="note">规格：{{ child.material_spec }}</view>
                                            <template v-for="(inv, inv_index) in stk_inventory[child.material_no]" :key="inv_index">
                                                <view class="note">库存：{{ inv.FStockName }} <text class="text-primary">{{ inv.FBaseQty }} {{ inv['FBaseUnitId.FName'] }}</text></view>
                                            </template>
                                        </view>
                                        <view class="cc-tree-card-item__foot">
                                            
                                        </view>
                                        <view v-if="child.bom_id" class="cc-tree-card-item__arrow">
                                            <uni-icons type="right" size="14" color="#999" />
                                        </view>
                                    </view>
                                </view>
                            </view>
                        </view>
                    </view>
                </view>
            </view>
        </uni-section>
    </template>
    
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
    import { play_audio_prompt } from '@/utils'
    import { BdMaterial, EngBom, StkInventory } from '@/utils/model'
    import K3CloudApi from '@/utils/k3cloudapi'
    import scan_code from '@/utils/scan_code'
    export default {
        data() {
            return {
                step: 'search',
                search_form: {
                    material_no: '',
                    material_name: '',
                    material_spec: '',
                    material_category_id: '',
                    use_org_id: store.state.cur_stock.FUseOrgId,
                    child_material_no: '',
                    child_material_name: '',
                    child_material_spec: '',
                    child_stock_id: ''
                },
                search_form_rules: {
                    material_no: {
                        rules: [{ minLength: 4, errorMessage: '物料编码不能少于4个字符' },]
                    },
                    material_name: {
                        rules: [{ minLength: 2, errorMessage: '物料名称不能少于2个字符' },]
                    },
                    material_spec: {
                        rules: [{ minLength: 4, errorMessage: '规格型号不能少于4个字符' },]
                    },
                    child_material_no: {
                        rules: [{ minLength: 4, errorMessage: '物料编码不能少于4个字符' },]
                    },
                    child_material_name: {
                        rules: [
                            { required: true, errorMessage: '物料名称不能为空' },
                            { minLength: 2, errorMessage: '物料名称不能少于2个字符' },
                        ]
                    },
                    child_material_spec: {
                        rules: [{ minLength: 4, errorMessage: '规格型号不能少于4个字符' },]
                    },  
                },
                search_res: [], // 查询BOM结果
                tree_data: [], // 组装树形结构数据
                stk_inventory: {}, // 即时库存数据dict
                bd_stock_opts: store.state.bd_stock_opts,
                material_categories: [],
                goods_nav: {
                    options: [
                        { icon: 'clear', text: '重置' }
                    ],
                    button_group: [
                        { text: '搜索', color: '#fff', backgroundColor: store.state.goods_nav_color.blue },
                    ]
                }
            }
        },
        mounted() {
            this.load_bd_materialcategories()
        },
        methods: {
            activate_step(step) {
                this.step = step
                if (step == 'search') {
                    this.goods_nav.options[0] = { icon: 'clear', text: '清空' }
                    this.goods_nav.button_group[0] = { text: '搜索', color: '#fff', backgroundColor: store.state.goods_nav_color.blue }
                }
                if (step == 'show') {
                    this.goods_nav.options[0] = { icon: 'left', text: '返回' }
                    this.goods_nav.button_group[0] = { text: '返回', color: '#fff', backgroundColor: store.state.goods_nav_color.grey }
                }
            },
            clear() {
                this.search_form.material_no = ''
                this.search_form.material_name = ''
                this.search_form.material_spec = ''
                this.search_form.material_category_id = ''
                this.search_form.use_org_id = store.state.cur_stock.FUseOrgId
                this.search_form.child_material_no = ''
                this.search_form.child_material_name = ''
                this.search_form.child_material_spec = ''
                this.search_form.child_stock_id = ''
            },
            goods_nav_click(e) {
                if (e.index === 0) {
                    if (this.step == 'search') this.clear()
                    if (this.step == 'show') this.activate_step('search')
                } 
            },
            goods_nav_button_click(e) {
                if (e.index === 0) {
                    if (this.step == 'search') this.search() // btn:搜索
                    if (this.step == 'show') this.activate_step('search')
                    // if (this.step == 'show') console.log("this.$data", this.$data)
                }
            },
            scan_code(field) {
                scan_code().then(res => {
                    this.search_form[field] = res.result
                }).catch(err => {
                    uni.showToast({ icon: 'none', title: err })
                })
            },
            // 返回结果数量过多，则提示约束查询条件
            async search() {
                try {
                    // 验证表单
                    await this.$refs.search_form.validate()
                    // 查询BOM
                    let options = { 'FForbidStatus': 'A' }
                    if (this.search_form.material_no) options['FMaterialId.FNumber_lk'] = this.search_form.material_no
                    if (this.search_form.material_name) options['FMaterialId.FName_lk'] = this.search_form.material_name
                    if (this.search_form.material_spec) options['FItemModel_lk'] = this.search_form.material_spec
                    if (this.search_form.material_category_id) options['FMaterialId.FCategoryId'] = this.search_form.material_category_id
                    if (this.search_form.use_org_id) options['FUseOrgId'] = this.search_form.use_org_id
                    if (this.search_form.child_material_no) options['FMaterialIdChild.FNumber_lk'] = this.search_form.child_material_no
                    if (this.search_form.child_material_name) options['FMaterialIdChild.FName_lk'] = this.search_form.child_material_name
                    if (this.search_form.child_material_spec) options['FChildItemModel_lk'] = this.search_form.child_material_spec
                    console.log('search options', options)
                    uni.showLoading({ title: '查询BOM...' })
                    let res = await EngBom.query(options, {})
                    uni.hideLoading()
                    if (res.data?.Result && !res.data.Result.ResponseStatus.IsSuccess) {
                        uni.showToast({
                            icon: 'none', title: res.data.Result.ResponseStatus.Errors[0]?.Message, duration: 3000
                        })
                        return
                    }
                    if (res.data.length > 1000) {
                        uni.showToast({
                            icon: 'none', title: '查询超时', duration: 3000
                        })
                        return
                    }
                    // 查询即时库存数据
                    uni.showLoading({ title: '查询库存...' })
                    for (let d of res.data) {
                        let material_no = d['FMaterialIdChild.FNumber']
                        if (!this.stk_inventory[material_no]) {
                            let options = { 'FMaterialId.FNumber': material_no }
                            if (this.search_form.child_stock_id) options.FStockId = this.search_form.child_stock_id // 判断仓库查询条件
                            let inv_res = await StkInventory.query(options)
                            let _inventories = [] // 按不同仓库分开
                            for (let item of inv_res.data) {
                                let stk_inv = _inventories.find(x => x.FStockId == item.FStockId)
                                if (stk_inv) {
                                    stk_inv.FBaseQty += item.FBaseQty
                                    continue
                                }
                                _inventories.push(item)
                            }
                            this.stk_inventory[material_no] = _inventories
                        }
                    }
                    uni.hideLoading()
                    // 判断仓库查询条件，过滤数据
                    let search_res = []
                    if (this.search_form.child_stock_id) {
                        for (let d of res.data) {
                            if (this.stk_inventory[d['FMaterialIdChild.FNumber']].length) search_res.push(d)
                        }
                    } else {
                        search_res = res.data
                    }
                    this.search_res = search_res
                    // 组装树形数据
                    let tree_data = []
                    for (let d of search_res) {
                        let child = {
                            material_id: d.FMaterialIdChild,
                            material_no: d['FMaterialIdChild.FNumber'],
                            material_name: d['FMaterialIdChild.FName'],
                            material_spec: d.FChildItemModel,
                            unit_id: d.FChildUnitId,
                            unit_name: d['FChildUnitId.FName'],
                        }
                        let bom = tree_data.find(x => x.bom_id == d.FID)
                        if (bom) {
                            bom.children.push(child)
                        } else {
                            tree_data.push({
                                bom_id: d.FID,
                                bom_no: d.FNumber,
                                material_id: d.FMaterialId,
                                material_no: d['FMaterialId.FNumber'],
                                material_name: d['FMaterialId.FName'],
                                material_spec: d.FItemModel,
                                use_org_id: d.FUseOrgId,
                                use_org_name: d['FUseOrgId.FName'],
                                open: true,
                                children: [child]
                            })
                        }
                    }
                    this.tree_data = tree_data
                    this.activate_step('show')      
                } catch (err) {
                    this.$logger.info('search err', err)
                } 
            },
            // 加载存货类别
            async load_bd_materialcategories() {
                if (!store.state.bd_materialcategories?.length) {
                    uni.showLoading({ title: 'Loading' })
                    await BdMaterial.categories().then(res => {
                        uni.hideLoading()
                        store.commit('set_bd_materialcategories', res.data)
                    })
                }
                this.material_categories = store.state.bd_materialcategories.map(x => { return { value: x.FName, text: x.FName } })
            },
            _thumbnail_url(file_id) {
                return K3CloudApi.thumbnail_url(file_id)
            }
        }
    }
</script>

<style lang="scss" scoped>
    .cc-tree-card__sub {
        &>.cc-tree-card-item {
            &:first-child {
                .vertical-line {
                    height: 60%;
                }
            }
        }
    }
    .cc-tree-card-item {
        position: relative;
        .vertical-line {
            position: absolute;
            width: 1px;
            height: 120%;
            bottom: 50%;
            background-color: #c0c0c0;
        }
        
        &__section {
            display: flex;
            align-items: center;
            position: relative;
            .horizontal-line {
                width: 10px; 
                height: 1px;
                background-color: #c0c0c0;
            }
        }
        
        &__card {
            flex: 1;
            max-width: 480px;
            display: flex;
            margin: 3px 0;
            padding: 6px 12px;
            background-color: #fff;
            border: 1px solid #e5e5e5;
            border-left: 3px solid #007aff;
            border-radius: 5px;
            // #ifdef H5
            &:hover {
                background-color: #f1f1f1 !important;
            }
            // #endif
        }
        
        &__body {
            display: flex;
            flex: 1; 
            flex-direction: column;
            justify-content: center;
            overflow: hidden;
            .title {
                color: $uni-text-color;
                font-size: $uni-font-size-base;
                overflow: hidden;
            }
            .note {
                color: $uni-text-color-grey;
                font-size: $uni-font-size-sm;
            }
        }
        
        &__foot {
            display: flex;
            flex-direction: column;
            justify-content: center;
            text-align: right;
            font-size: $uni-font-size-sm;
            color: $uni-text-color-grey;
        }
        
        &__arrow {
            display: flex;
            box-sizing: border-box;
            align-items: center;
            justify-content: center;
            transform: rotate(0deg);
            margin-left: 10px;
            transition: transform 0.3s ease;
            &-active {
            	transform: rotate(-180deg);
            }
        }
    }
</style>

