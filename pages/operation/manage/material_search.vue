<template>
    <uni-section title="查询物料" type="square">
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
            <uni-easyinput
                v-model="search_form.no" 
                placeholder="请输入搜索内容"
                prefix-icon="scan"
                @confirm="before_search"
                @clear="before_search"
                @icon-click="searchbar_icon_click"
                primary-color="rgb(238, 238, 238)"
                :styles="{
                    color: '#000',
                    backgroundColor: 'rgb(238, 238, 238)',
                    borderColor: 'rgb(238, 238, 238)'
                }"
                class="uni-mb-5"
            />
            <!-- 搜索候选列表 -->
            <uni-drawer ref="search_drawer" :width="320">
                <scroll-view scroll-y style="height: 100%;" @touchmove.stop>
                <uni-section :title="`模糊匹配：${search_form.no}`" type="square"
                    sub-title="最多展示20条匹配结果"
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
                                `规格：${material.FSpecification}`
                            ].join('\n')"
                            @click="search(material.FNumber)" clickable
                            show-arrow
                            >
                        </uni-list-item>
                    </uni-list>
                </uni-section>
                </scroll-view>
            </uni-drawer>
        </view>
    </uni-section>
    
    <uni-section title="物料详情" type="square"
        v-if="bd_material.Id"
        class="above-uni-goods-nav"
        >
        <uni-list>
            <uni-list-item title="编码" :right-text="bd_material.Number" />
            <uni-list-item title="名称" :right-text="bd_material.Name[0]?.Value" />
            <uni-list-item title="规格" :right-text="bd_material.Specification[0]?.Value" />
        </uni-list>
        
<!--        <image v-for="(image_url, index) in image_urls"
            :key="index"
            :src="image_url"
            mode="aspectFit"
            :style="{
                width: '100%'
            }"
            >
        </image> -->
        
       <uni-card v-for="(image_url, index) in image_urls"
            :key="index"
            :cover="image_url"
            padding="5px"
            >
        </uni-card>
    </uni-section>
    
    <view class="uni-goods-nav-wrapper">
        <uni-goods-nav 
            :options="goods_nav.options" 
            :button-group="goods_nav.button_group"
            @click="goods_nav_click"
            @buttonClick="goods_nav_button_click"
        />
    </view>
</template>

<script>
    import store from '@/store'
    import { play_audio_prompt } from '@/utils'
    import { search_bd_materials } from '@/utils/api'
    import K3CloudApi from '@/utils/k3cloudapi'
    // #ifdef APP-PLUS
    const myScanCode = uni.requireNativePlugin('My-ScanCode')
    // #endif 
    export default {
        data() {
            return {
                bd_material: {}, // 查看实例
                image_urls: [], // 实例图片
                search_form: {
                    no: '',
                    ex_cond: uni.getStorageSync('mv_ex_cond') || [], // get
                    candidates: []
                },
                goods_nav: {
                    options: [
                        { icon: 'clear', text: '清空', info: 0 }
                    ],
                    button_group: [
                        { text: '扫码查询', color: '#fff', backgroundColor: store.state.goods_nav_color.red }
                    ]
                }
            }
        },
        methods: {
            clear() {
                this.bd_material = {}
                this.image_urls = []
                this.search_form.no = ''
            },
            ex_cond_change(e) {
                uni.setStorageSync('mv_ex_cond', e.detail.value) // set
            },
            goods_nav_click(e) {
                if (e.index === 0) this.clear()
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.scan_code() // btn:扫码查询
            },
            scan_code() {
                // #ifdef APP-PLUS
                myScanCode.scanCode({}, (res) => {
                    // console.log('myScanCode res:', res)
                    if (res.success == 'true') {
                        this.search_form.no = res.result
                        this.before_search()
                    }
                })
                // #endif               
                // #ifndef APP-PLUS
                uni.scanCode({
                    success: (res) => {
                        // console.log('uni.scanCode res:', res)
                        this.search_form.no = res.result
                        this.before_search()
                    }
                })
                // #endif
            },
            searchbar_icon_click(e) {
                if (e == 'prefix') this.scan_code()
            },
            // 物料模糊匹配
            async before_search() {
                this.bd_material = {} // init
                this.image_urls = []
                this.search_form.no = this.search_form.no.trim()
                if (!this.search_form.no) return
                let options = { 
                    no: this.search_form.no, 
                    FUseOrgId: store.state.cur_stock.FUseOrgId,
                }
                
                if (this.search_form.ex_cond.includes('3.')) options.FNumber_pre = '3.'
                let meta = { per_page: 20, order: 'FMaterialId DESC' }
                uni.showLoading({ title: 'Loading' })
                search_bd_materials(options, meta).then(res => {
                    uni.hideLoading()
                    this.search_form.candidates = res.data
                    if (res.data.length > 1) this.$refs.search_drawer.open()
                    if (res.data.length === 1) this.search(res.data[0]?.FNumber)
                    if (res.data.length < 1) uni.showToast({ icon: 'none', title: '无匹配结果' })
                })
            },
            async search(material_no) {
                this.$refs.search_drawer.close()
                let view_res = await K3CloudApi.view('BD_MATERIAL', { Number: material_no })
                if (view_res.data.Result.ResponseStatus.IsSuccess) {
                    let raw_data = view_res.data.Result.Result
                    this.bd_material = raw_data
                    let image_fields = ['ImageFileServer', 'F_PAEZ_ImageFileServer', 'F_PAEZ_ImageFileServer1']
                    for (let field of image_fields) {
                        if (raw_data[field]?.trim()) {
                            let image_url = await K3CloudApi.download_url(raw_data[field])
                            this.image_urls.push(image_url)
                        }
                    }
                }
            }
        }
    }
</script>

<style>

</style>
