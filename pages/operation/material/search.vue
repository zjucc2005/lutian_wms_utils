<template>
    <uni-section title="查询物料" type="square">
        <view class="container">
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
                <uni-forms-item label="存货类别" name="material_category_id">
                    <uni-data-select v-model="search_form.material_category_id" :localdata="material_categories" />
                </uni-forms-item>
                <button @click="search" type="primary">
                    <uni-icons type="search" color="#fff"></uni-icons> 搜索
                </button>
            </uni-forms>
        </view>
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
    
    <!-- 搜索候选列表 -->
    <uni-drawer ref="search_drawer" :width="$store.state.drawer_width">
        <scroll-view scroll-y style="height: 100%;" @touchmove.stop>
            <uni-section :title="`搜索结果 ${search_form.candidates.length} 条`" type="square"
                sub-title="最多展示50条搜索结果"
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
    import { BdMaterial } from '@/utils/model'
    import K3CloudApi from '@/utils/k3cloudapi'
    import scan_code from '@/utils/scan_code'
    export default {
        data() {
            return {
                search_form: {
                    material_no: '',
                    material_name: '',
                    material_spec: '',
                    material_category_id: '',
                    candidates: []
                },
                material_categories: [],
                goods_nav: {
                    options: [
                        // { icon: 'clear', text: '清空', info: 0 }
                    ],
                    button_group: [
                        { text: '扫码查询', color: '#fff', backgroundColor: store.state.goods_nav_color.red },
                    ]
                }
            }
        },
        mounted() {
            this.load_bd_materialcategories()
        },
        methods: {
            clear() {
                this.search_form.material_no = ''
                this.search_form.material_name = ''
                this.search_form.material_spec = ''
                this.search_form.material_category_id = ''
            },
            goods_nav_click(e) {
                // if (e.index === 0) this.clear()
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.scan_code() // btn:扫码查询
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
            // 物料模糊匹配
            async search() {
                if (!this.search_form.material_no && !this.search_form.material_name && !this.search_form.material_spec) return
                let options = {}
                if (store.state.cur_stock.FUseOrgId) options.FUseOrgId = store.state.cur_stock.FUseOrgId
                if (this.search_form.material_no) options.FNumber_lk = this.search_form.material_no
                if (this.search_form.material_name) options.FName_lk = this.search_form.material_name
                if (this.search_form.material_spec) options.FSpecification_lk = this.search_form.material_spec
                if (this.search_form.material_category_id) options.FCategoryId = this.search_form.material_category_id
                let meta = { per_page: 50, order: 'FNumber ASC' }
                uni.showLoading({ title: 'Loading' })
                BdMaterial.query(options, meta).then(res => {
                    uni.hideLoading()
                    this.search_form.candidates = res.data
                    if (res.data.length > 1) this.$refs.search_drawer.open()
                    if (res.data.length === 1) this.load_material(res.data[0]?.FMaterialId)
                    if (res.data.length < 1) uni.showToast({ icon: 'none', title: '无匹配结果' })
                })
            },
            async load_bd_materialcategories() {
                if (!store.state.bd_materialcategories?.length) {
                    uni.showLoading({ title: 'Loading' })
                    await BdMaterial.categories().then(res => {
                        uni.hideLoading()
                        store.commit('set_bd_materialcategories', res.data)
                    })
                }
                this.material_categories = store.state.bd_materialcategories.map(x => { return { value: x.FMasterId, text: x.FName } })
            },
            async load_material(material_id) {
                this.$refs.search_drawer.close()
                play_audio_prompt('success')
                uni.navigateTo({ url: '/pages/operation/material/show?id=' + material_id })
            },
            _thumbnail_url(file_id) {
                return K3CloudApi.thumbnail_url(file_id)
            }
        }
    }
</script>

<style lang="scss" scoped>

</style>
