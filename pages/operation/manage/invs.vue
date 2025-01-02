<template>
    <uni-notice-bar single scrollable text="点击库存列表，可查询库存明细;长按弹出功能栏" />
    <uni-section title="当前仓库" type="square"
        :sub-title="[
            $store.state.cur_stock['FUseOrgId.FName'],
            $store.state.cur_stock['FGroup.FName'] || '未分组',
            $store.state.cur_stock.FName
        ].join(' / ')"
        class="above-uni-goods-nav"
        >
        <view class="searchbar-container">
            <uni-easyinput
                v-model="search_form.no" 
                placeholder="请输入搜索内容"
                prefix-icon="scan"
                @icon-click="searchbar_icon_click"
                primary-color="rgb(238, 238, 238)"
                :styles="{
                    color: '#000',
                    backgroundColor: 'rgb(238, 238, 238)',
                    borderColor: 'rgb(238, 238, 238)'
                }"
            />
        </view>
        
        <uni-list>
            <uni-list-item
                v-for="(inv_group, index) in inv_groups_filtered()"
                :key="index"
                :title="inv_group.material_no"
                :note="[
                    `名称：${inv_group.material_name}`, 
                    `规格：${inv_group.material_spec}`
                ].join('\n')"
                :thumb="_thumbnail_url(inv_group.material_image)"
                thumb-size="lg"
                :rightText="[inv_group.qty, inv_group.base_unit_name].join(' ')"
                @click="show_invs(inv_group.material_no)" clickable
                show-arrow
                @longpress="inv_longpress(inv_group)"
                >
            </uni-list-item>
        </uni-list>
        
        <uni-load-more v-if="inv_groups.length === 0" status="nomore" />
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
    import { Inv } from '@/utils/model'
    import { play_audio_prompt } from '@/utils'
    import K3CloudApi from '@/utils/k3cloudapi'
    import scan_code from '@/utils/scan_code'
    export default {
        data() {
            return {
                invs: [],
                inv_groups: [],
                last_refresh_time: 0,
                refresh_interval: 30 * 1000, // 30s
                search_form: {
                    no: ''
                },
                goods_nav: {
                    options: [
                        { icon: 'refreshempty', text: '刷新' },
                    ],
                    button_group: [
                        {
                            text: '扫码查询',
                            backgroundColor: store.state.goods_nav_color.red,
                            color: '#fff'
                        },
                        {
                            text: '库存地图',
                            backgroundColor: store.state.goods_nav_color.green,
                            color: '#fff'
                        }
                    ]
                }
            }
        },
        // 头部导航栏自定义按键绑定事件
        onNavigationBarButtonTap(e) {
            if (e.index === 0) {
                uni.showActionSheet({
                    itemList: ['库存盘点'],
                    success: (e) => {
                        if (e.tapIndex === 0) {
                            play_audio_prompt('success')
                            uni.navigateTo({ url: '/pages/operation/manage/inv_check' })
                            // uni.showToast({ icon: 'error', title: '请联系开发人员' })
                        }
                    }
                })
            }
        },
        onPullDownRefresh() {
            this.refresh()
            uni.stopPullDownRefresh()
        },
        mounted() {
            this.load_invs()
        },
        methods: {
            goods_nav_click(e) {
                if (e.index === 0) this.refresh() // btn:刷新
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.scan_code() // btn:扫码
                if (e.index === 1) this.inv_map() // btn:库存地图
            },
            searchbar_icon_click(e) {
                if (e == 'prefix') this.scan_code()
            },
            scan_code() {
                scan_code().then(res => {
                    this.search_form.no = res.result
                }).catch(err => {
                    uni.showToast({ icon: 'none', title: err })
                })
            },
            show_invs(material_no) {
                play_audio_prompt('success')
                uni.navigateTo({ url: '/pages/operation/manage/inv_search?t=' + material_no })
            },
            show_material(material_id) {
                if (!material_id) uni.showToast({ icon: 'none', title: '物料ID不能为空' })
                play_audio_prompt('success')
                uni.navigateTo({ url: `/pages/operation/material/show?id=${material_id}` })
            },
            inv_longpress(inv_group) {
                uni.showActionSheet({
                    itemList: ['物料详情', '库存明细'],
                    success: (e) => {
                        if (e.tapIndex === 0) this.show_material(inv_group.material_id)
                        if (e.tapIndex === 1) this.show_invs(inv_group.material_no)
                    }
                })
            },
            inv_map() {
                uni.navigateTo({
                    url: '/pages/operation/manage/inv_map',
                    success: (res) => {
                        play_audio_prompt('success')
                        res.eventChannel.emit('sendInvs', { invs: this.invs })
                    }
                })
            },
            async load_invs() {
                const options = {
                    FStockId: store.state.cur_stock.FStockId
                }
                uni.showLoading({ title: 'Loading' })
                return Inv.get_all(options).then(res => {
                    uni.hideLoading()
                    this.invs = res
                    this._set_inv_groups(res)
                })
            },
            async refresh() {
                if (this.last_refresh_time + this.refresh_interval > Date.now()) {
                    uni.showToast({ icon: 'none', title: '请不要频繁刷新' })
                    return
                }
                await this.load_invs()
                this.last_refresh_time = Date.now()
            },
            inv_groups_filtered() {
                let no = this.search_form.no.trim()
                if (!no) return this.inv_groups
                return this.inv_groups.filter(inv_group => {
                    return inv_group.material_no.includes(no) ||
                    inv_group.material_name.toUpperCase().includes(no.toUpperCase()) ||
                    inv_group.material_spec.toUpperCase().includes(no.toUpperCase())
                })
            },
            _set_inv_groups(data) {
                let inv_groups = []
                data.forEach(inv => {
                    let group = inv_groups.find(x => x.material_id == inv.FMaterialId)
                    if (group) {
                        group.qty += inv.FQty
                    } else {
                        inv_groups.push({
                            material_id: inv.FMaterialId,
                            material_no: inv['FMaterialId.FNumber'],
                            material_name: inv['FMaterialId.FName'],
                            material_spec: inv['FMaterialId.FSpecification'],
                            material_image: inv['FMaterialId.FImageFileServer'],
                            qty: inv.FQty,
                            base_unit_name: inv['FStockUnitId.FName']
                        })
                    }
                })
                this.inv_groups = inv_groups
                console.log('inv_groups', inv_groups)
            },
            _thumbnail_url(file_id) {
                return K3CloudApi.thumbnail_url(file_id)
            }
        }
    }
</script>

<style>

</style>
