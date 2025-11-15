<template>
    <!-- <uni-notice-bar single scrollable text="点击库存列表，可查询库存明细;长按弹出功能栏" /> -->
    <uni-section title="当前仓库" type="square"
        :sub-title="[
            $store.state.cur_stock['FUseOrgId.FName'],
            $store.state.cur_stock['FGroup.FName'] || '未分组',
            $store.state.cur_stock.FName
        ].join(' / ')"
        sub-title-color="#007aff"
        class="above-uni-goods-nav"
        @click="$logger.info('>>>', this.$data)"
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
                    borderColor: 'rgb(238, 238, 238)',
                    height: '100px'
                }"
            />
        </view>
        <uni-table v-if="$store.state.screen_type === 'h5'" ref="table" border stripe>
            <uni-tr>
                <uni-th align="center" width="60">序号</uni-th>
                <uni-th align="center" width="60">ICON</uni-th>
                <uni-th align="center">物料编码</uni-th>
                <uni-th align="center">物料名称</uni-th>
                <uni-th align="center">规格型号</uni-th>
                <uni-th align="center">单位</uni-th>
                <uni-th align="center">数量</uni-th>
                <uni-th align="center" width="230">操作</uni-th>
            </uni-tr>
            
            <uni-tr v-for="(obj, index) in inv_groups_filtered()" :key="index">
                <uni-td align="center">{{ index + 1 }}</uni-td>
                <uni-td><image :src="obj.thumbnail" mode="aspectFill" class="thumbnail" /></uni-td>
                <uni-td>
                    <view class="text-primary" @click="link_to(`/pages/operation/material/show?id=${obj.material_id}`)">
                        {{ obj.material_no }}
                    </view>
                </uni-td>
                <uni-td>{{ obj.material_name }}</uni-td>
                <uni-td>{{ obj.material_spec }}</uni-td>
                <uni-td align="center">{{ obj.base_unit_name }}</uni-td>
                <uni-td align="center">{{ obj.qty }}</uni-td>
                <uni-td align="center">
                    <uni-tag text="库存明细" type="primary" inverted @click="link_to(`/pages/operation/manage/inv_search?t=${obj.material_no}&m=0`)"/>
                    <uni-tag text="库存调整" type="primary" @click="link_to(`/pages/operation/move/v2/plan_new?material_no=${obj.material_no}`)" class="uni-ml-2"/>
                    <uni-tag text="库存日志" type="primary" inverted @click="link_to(`/pages/operation/list/inv_logs?material_no=${obj.material_no}`)" class="uni-ml-2"/>
                </uni-td>
            </uni-tr>
        </uni-table>
        
        <uni-list v-else>
            <uni-list-item
                v-for="(obj, index) in inv_groups_filtered()" :key="index"
                :title="obj.material_no"
                :note="[
                    `名称：${obj.material_name}`, 
                    `规格：${obj.material_spec}`
                ].join('\n')"
                :thumb="obj.thumbnail" thumb-size="lg"
                :rightText="[obj.qty, obj.base_unit_name].join(' ')"
                @click="inv_menu(obj)" clickable show-arrow
                @longpress="inv_menu(obj)"
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
    import { play_audio_prompt, link_to } from '@/utils'
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
                        // #ifdef H5
                        { icon: 'more-filled', text: '更多' },
                        // #endif
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
        onPullDownRefresh() {
            this.refresh()
            uni.stopPullDownRefresh()
        },
        mounted() {
            this.load_invs()
        },
        methods: {
            link_to,
            goods_nav_click(e) {
                if (e.index === 0) this.refresh() // btn:刷新
                if (e.index === 1) this.more()
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
                    console.log('scan code:', res.result)
                    this.search_form.no = this.parse_scan_code(res.result)
                }).catch(err => {
                    uni.showToast({ icon: 'none', title: err })
                })
            },
            parse_scan_code(text) {
                if (text.includes('||')) {
                    return text.split('||')[1]
                } else {
                    return text
                }
            },
            inv_menu(obj) {
                if (!obj.material_id) {
                    uni.showToast({ icon: 'none', title: '物料ID不能为空' })
                    return
                } 
                uni.showActionSheet({
                    itemList: ['库存明细', '库存调整', '库存日志', '物料详情'],
                    success: (e) => {
                        if (e.tapIndex === 0) link_to(`/pages/operation/manage/inv_search?t=${obj.material_no}&m=0`)
                        if (e.tapIndex === 1) link_to(`/pages/operation/move/v2/plan_new?material_no=${obj.material_no}`)
                        if (e.tapIndex === 2) link_to(`/pages/operation/list/inv_logs?material_no=${obj.material_no}`)
                        if (e.tapIndex === 3) link_to(`/pages/operation/material/show?id=${obj.material_id}`)
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
            more() {
                uni.showActionSheet({
                    itemList: ['库存盘点'],
                    success: (e) => {
                        if (e.tapIndex === 0) {
                            play_audio_prompt('success')
                            uni.navigateTo({ 
                                url: '/pages/operation/manage/inv_check',
                                success: (res) => {
                                    play_audio_prompt('success')
                                    // res.eventChannel.emit('sendInvs', { invs: this.invs })
                                }
                            })
                        }
                    }
                })
            },
            async load_invs() {
                const options = {
                    FStockId: store.state.cur_stock.FStockId
                }
                uni.showLoading({ title: 'Loading' })
                let res = await Inv.get_all(options)
                uni.hideLoading()
                this.invs = res
                this.set_inv_groups(res)
                this.get_thumbnail()
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
            set_inv_groups(data) {
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
                            base_unit_name: inv['FStockUnitId.FName'],
                            thumbnail: '/static/default_40x40.png'
                        })
                    }
                })
                this.inv_groups = inv_groups
            },
            async get_thumbnail() {
                for (let obj of this.inv_groups) {
                    let res = await K3CloudApi.thumbnail_url(obj.material_image)
                    obj.thumbnail = res
                }
            }
        }
    }
</script>

<style lang="scss" scoped>
    .thumbnail {
        width: 40px;
        height: 40px;
        display: block;
    }
</style>
