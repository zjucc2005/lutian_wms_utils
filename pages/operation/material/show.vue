<template>
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
                <uni-list-item title="库位" :right-text="bd_material.F_PAEZ_Text_qtr2" />
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
</template>

<script>
    import store from '@/store'
    import { play_audio_prompt } from '@/utils'
    import { StkInventory } from '@/utils/model'
    import K3CloudApi from '@/utils/k3cloudapi' 
    export default {
        props: {
            id: {
                type: String
            }
        },
        data() {
            return {
                bd_material: {}, // 物料实例
                stk_inventories: [], // 即时库存实例
                image_urls: [], // 实例图片
                goods_nav: {
                    options: [
                        { icon: 'left', text: '返回', info: 0 }
                    ],
                    button_group: [
                        // { text: '扫码查询', color: '#fff', backgroundColor: store.state.goods_nav_color.red },
                        { text: '物料资料卡模板', color: '#fff', backgroundColor: store.state.goods_nav_color.grey }
                    ]
                }
            }
        },
        onLoad(options) {
            if (options.id) {
                this.load_material(options.id)
                // this.search_form.material_id = options.m_id
                // this.$nextTick(_ => {
                //     this.search()
                // })
            }
        },
        methods: {
            goods_nav_click(e) {
                if (e.index === 0) uni.navigateBack()
            },
            goods_nav_button_click(e) {
                // if (e.index === 0) this.scan_code() // btn:扫码查询
                if (e.index === 0) this.select_material_card() // btn:物料资料卡模板
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
            select_material_card() {
                if (!this.bd_material.Id) return
                uni.showActionSheet({
                    itemList: ['物料资料卡'],
                    success: (e) => {
                        if (e.tapIndex === 0) {
                            this.$logger.info('>>> 生成物料资料卡')
                            uni.navigateTo({
                                url: '/pages/operation/material/card',
                                success: (res) => {
                                    play_audio_prompt('success')
                                    res.eventChannel.emit('sendMaterial', { bd_material: this.bd_material })
                                }
                            })
                        }
                    }
                })
            },
            async load_material(material_id) {
                uni.showLoading({ title: 'Loading' })
                let view_res = await K3CloudApi.view('BD_MATERIAL', { Id: material_id })
                if (view_res.data.Result.ResponseStatus.IsSuccess) {
                    let raw_data = view_res.data.Result.Result
                    this.bd_material = raw_data
                    let image_fields = ['ImageFileServer', 'F_PAEZ_ImageFileServer', 'F_PAEZ_ImageFileServer1']
                    for (let field of image_fields) {
                        if (raw_data[field]?.trim()) {
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
                    this.goods_nav.button_group[0].backgroundColor = store.state.goods_nav_color.green
                }
                uni.hideLoading()
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
</style>
