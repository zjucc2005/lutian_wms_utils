<template>
    <uni-section title="查询物料" type="square"
        v-if="!bd_material.Id"
        >
        <template v-slot:right>
            <view class="uni-section__right">
                <uni-data-checkbox multiple
                    v-model="search_form.ex_cond"
                    :localdata="[{ text: '只查询成品', value: '3.' }]"
                    @change="ex_cond_change"
                    style="margin-right: -20px;"
                    >
                </uni-data-checkbox>
            </view>
        </template>
        <view class="searchbar-container">
            <uni-forms ref="form" :model="search_form" labelWidth="70px">
                <uni-forms-item label="编码" name="material_no">
                    <uni-easyinput
                        v-model="search_form.material_no"
                        trim="both"
                        prefix-icon="scan"
                        @icon-click="searchbar_icon_click"
                    />
                </uni-forms-item>
                <uni-forms-item label="名称" name="material_name">
                    <uni-easyinput v-model="search_form.material_name" trim="both"/>
                </uni-forms-item>
                <uni-forms-item label="规格" name="material_spec">
                    <uni-easyinput v-model="search_form.material_spec" trim="both"/>
                </uni-forms-item>
            </uni-forms>
        </view>
        <button @click="search" type="primary" class="form-btn">
            <uni-icons type="search" color="#fff"></uni-icons> 搜索
        </button>
    </uni-section>
    
    <uni-section title="物料详情" type="square"
        v-if="bd_material.Id"
        class="above-uni-goods-nav"
        >
        <uni-list>
            <uni-list-item title="编码" :right-text="bd_material.Number" />
            <uni-list-item title="名称" :right-text="bd_material.Name[0]?.Value" />
            <uni-list-item title="规格" :right-text="bd_material.Specification[0]?.Value" />
            <template v-if="['nrj_admin'].includes($store.state.role)">
                <uni-list-item title="仓管员" :right-text="bd_material.F_PAEZ_Base1 ? bd_material.F_PAEZ_Base1.Name[0].Value : '' " />
                <uni-list-item title="仓位" :right-text="bd_material.MaterialStock[0]?.StockPlaceId ? bd_material.MaterialStock[0].StockPlaceId.Name[0].Value : '' " />
                <template v-for="(stk_inv, index) in stk_inventories" :key="index">
                    <uni-list-item 
                        title="库存量(基本单位)"
                        :note="[
                            `组织：${stk_inv['FStockOrgId.FName']}`,
                            `仓库：${stk_inv.FStockName}`
                        ].join('\n')"
                        :right-text="[stk_inv.FBaseQty, bd_material.MaterialBase[0].BaseUnitId.Name[0].Value].join(' ')" />
                </template> 
            </template>
        </uni-list>
        
        <!-- 图片展示，缩略图占位，等待原图加载完毕 -->
        <view v-for="(image_url, index) in image_urls" :key="index" class="image-card">
            <uni-icons v-if="image_url.loading" type="spinner-cycle" size="24" color="#eee" class="image-loading"></uni-icons>
            <image v-if="image_url.loading" :src="image_url.thumbnail" mode="widthFix" style="width: 100%;" />
            <image
                :src="image_url.original" 
                mode="widthFix"
                :style="{
                    width: image_url.loading ? 0 : '100%',
                    height: image_url.loading ? 0 : ''
                }"
                @click="preview_image(image_url.original)"
                @load="image_load_over(image_url)"
                />
        </view>
    </uni-section>
    
    <view class="uni-goods-nav-wrapper">
        <uni-goods-nav 
            :options="goods_nav.options" 
            :button-group="goods_nav.button_group"
            @click="goods_nav_click"
            @buttonClick="goods_nav_button_click"
        />
    </view>
    
    <!-- 搜索候选列表 -->
    <uni-drawer ref="search_drawer" :width="$store.state.drawer_width">
        <scroll-view scroll-y style="height: 100%;" @touchmove.stop>
            <uni-section title="搜索结果" type="square"
                sub-title="最多展示20条搜索结果"
                >
                <template v-slot:right>
                    <view class="uni-section__right">
                        <uni-icons type="closeempty" size="24" color="#333" @click="$refs.search_drawer.close()"/>
                    </view>
                </template>
                <uni-list>
                    <uni-list-item
                        v-for="(material, index) in search_form.candidates"
                        :key="index"
                        :title="material.FNumber"
                        :note="[
                            `名称：${material.FName}`, 
                            `规格：${material.FSpecification}`,
                            `使用组织：${material['FUseOrgId.FName']}`
                        ].join('\n')"
                        :thumb="_thumbnail_url(material.FImageFileServer)"
                        thumb-size="lg"
                        @click="load_material(material.FMaterialId)" clickable
                        show-arrow
                        >
                    </uni-list-item>
                </uni-list>
            </uni-section>
        </scroll-view>
    </uni-drawer>
</template>

<script>
    import store from '@/store'
    import { play_audio_prompt } from '@/utils'
    import { search_bd_materials } from '@/utils/api'
    import { StkInventory } from '@/utils/model'
    import K3CloudApi from '@/utils/k3cloudapi'
    import scan_code from '@/utils/scan_code'
    export default {
        props: {
            m_id: {
                type: String
            }
        },
        data() {
            return {
                bd_material: {}, // 物料实例
                stk_inventories: [], // 即时库存实例
                image_urls: [], // 实例图片
                search_form: {
                    material_id: '',
                    material_no: '',
                    material_name: '',
                    material_spec: '',
                    ex_cond: uni.getStorageSync('mv_ex_cond') || [], // get
                    candidates: []
                },
                goods_nav: {
                    options: [
                        { icon: 'clear', text: '清空', info: 0 }
                    ],
                    button_group: [
                        { text: '扫码查询', color: '#fff', backgroundColor: store.state.goods_nav_color.red },
                        { text: '物料资料卡模板', color: '#fff', backgroundColor: store.state.goods_nav_color.grey }
                    ]
                }
            }
        },
        onLoad(options) {
            if (options.m_id) {
                this.search_form.material_id = options.m_id
                this.$nextTick(_ => {
                    this.search()
                })
            }
        },
        methods: {
            clear() {
                this.bd_material = {}
                this.image_urls = []
                this.search_form.material_id = ''
                this.search_form.material_no = ''
                this.search_form.material_name = ''
                this.search_form.material_spec = ''
                this.goods_nav.button_group[1].backgroundColor = store.state.goods_nav_color.grey
            },
            ex_cond_change(e) {
                uni.setStorageSync('mv_ex_cond', e.detail.value) // set
            },
            goods_nav_click(e) {
                if (e.index === 0) this.clear()
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.scan_code() // btn:扫码查询
                if (e.index === 1) this.select_material_card() // btn:物料资料卡模板
            },
            image_load_over(image_url) {
                image_url.loading = false
            },
            preview_image(current) {
                uni.previewImage({
                    current: current,
                    urls: this.image_urls.map(x => x.original)
                });
            },
            scan_code() {
                scan_code().then(res => {
                    this.search_form.material_no = res.result
                    this.search()
                }).catch(err => {
                    uni.showToast({ icon: 'none', title: err })
                })
            },
            searchbar_icon_click(e) {
                if (e == 'prefix') this.scan_code()
            },
            select_material_card() {
                if (!this.bd_material.Id) return
                uni.showActionSheet({
                    itemList: ['物料资料卡'],
                    success: (e) => {
                        if (e.tapIndex === 0) {
                            this.$logger.info('>>> 生成物料资料卡')
                            uni.navigateTo({
                                url: '/pages/operation/manage/material_card',
                                success: (res) => {
                                    play_audio_prompt('success')
                                    res.eventChannel.emit('sendMaterial', { bd_material: this.bd_material })
                                }
                            })
                        }
                    }
                })
            },
            // 物料模糊匹配
            async search() {
                this.bd_material = {} // init
                this.image_urls = []
                if (this.search_form.material_id) {
                    this.load_material(this.search_form.material_id)
                    return
                } 
                if (!this.search_form.material_no && !this.search_form.material_name && !this.search_form.material_spec) return
                let options = {}
                if (store.state.cur_stock.FUseOrgId) options.FUseOrgId = store.state.cur_stock.FUseOrgId
                if (this.search_form.material_no) options.FNumber_cont = this.search_form.material_no
                if (this.search_form.material_name) options.FName_cont = this.search_form.material_name
                if (this.search_form.material_spec) options.FSpecification_cont = this.search_form.material_spec
                if (this.search_form.ex_cond.includes('3.')) options.FNumber_pre = '3.'
                let meta = { per_page: 20, order: 'FMaterialId DESC' }
                uni.showLoading({ title: 'Loading' })
                search_bd_materials(options, meta).then(res => {
                    uni.hideLoading()
                    this.search_form.candidates = res.data
                    if (res.data.length > 1) this.$refs.search_drawer.open()
                    if (res.data.length === 1) this.load_material(res.data[0]?.FMaterialId)
                    if (res.data.length < 1) uni.showToast({ icon: 'none', title: '无匹配结果' })
                })
            },
            async load_material(material_id) {
                this.$refs.search_drawer.close()
                uni.showLoading({ title: 'Loading' })
                let view_res = await K3CloudApi.view('BD_MATERIAL', { Id: material_id })
                if (view_res.data.Result.ResponseStatus.IsSuccess) {
                    let raw_data = view_res.data.Result.Result
                    this.bd_material = raw_data
                    let image_fields = ['ImageFileServer', 'F_PAEZ_ImageFileServer', 'F_PAEZ_ImageFileServer1']
                    for (let field of image_fields) {
                        if (raw_data[field]?.trim()) {
                            // let image_url = await K3CloudApi.download_url(raw_data[field])
                            // this.image_urls.push(image_url)
                            this.image_urls.push({
                                id: raw_data[field],
                                original: await K3CloudApi.download_url(raw_data[field]),
                                thumbnail: await K3CloudApi.download_url(raw_data[field], 1),
                                loading: true
                            })
                        }
                    }
                    // 加载即时库存数据
                    let inv_res = await StkInventory.query({ 'FMaterialId.FNumber': raw_data.Number })
                    let stk_inventory = { FBaseQty: 0 }
                    let stk_inventories = [] // 按不同仓库分开
                    for (let item of inv_res.data) {
                        let stk_inv = stk_inventories.find(x => x.FStockId == item.FStockId)
                        if (stk_inv) {
                            stk_inv.FBaseQty += item.FBaseQty
                            continue
                        }
                        stk_inventories.push({
                            FBaseQty: item.FBaseQty,
                            'FBaseUnitId.FName': item['FBaseUnitId.FName'],
                            FStockName: item.FStockName,
                            FStockId: item.FStockId,
                            'FStockOrgId.FName': item['FStockOrgId.FName'],
                            'FMaterialId.FNumber': item['FMaterialId.FNumber']
                        })
                    }
                    this.stk_inventories = stk_inventories
                    this.goods_nav.button_group[1].backgroundColor = store.state.goods_nav_color.green
                }
                uni.hideLoading()
            },
            _thumbnail_url(file_id) {
                if(file_id.trim()) {
                    return K3CloudApi.download_url_sync(file_id, 1, true)
                } else {
                    return '/static/default_40x40.png'
                }
            }
        }
    }
</script>

<style lang="scss" scoped>
    .image-card {
        margin: 10px;
        padding: 5px 5px 1px 5px;
        border: 1px solid #eee;
        border-radius: 5px;
        box-shadow: rgba(0, 0, 0, 0.08) 0px 0px 3px 1px;
        .image-loading {
            position: absolute;
            z-index: 10;
            animation: rotate 2s linear infinite;
        }
    }
    
    @keyframes rotate {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
    
    .form-btn {
        border-radius: 0;
    }
</style>
