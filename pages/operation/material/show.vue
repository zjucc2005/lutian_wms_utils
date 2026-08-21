<template>
    <uni-popup ref="flash" type="message">
        <uni-popup-message :type="flash_type" :message="flash_msg" :duration="2000"></uni-popup-message>
    </uni-popup>
    
    <uni-row v-if="bd_material?.Id" :gutter="15" class="above-uni-goods-nav">
        <uni-col :md="8">
            <uni-section title="基本" type="square" @click="debug">
                <uni-list class="cc-list">
                    <uni-list-item title="物料编码" :right-text="bd_material.Number" />
                    <uni-list-item title="物料名称" :right-text="bd_material.Name[0]?.Value" />
                    <uni-list-item title="规格型号" :right-text="bd_material.Specification[0]?.Value" />
                    <uni-list-item title="存货类别" :right-text="bd_material.MaterialBase[0].CategoryID.Name[0].Value" />
                    <uni-list-item
                        title="销售简称" 
                        :right-text="bd_material.F_RGEN_xsjc_83g"
                        @click="edit_field('F_RGEN_xsjc_83g')"
                        :clickable="is_admin"
                        :show-arrow="is_admin"
                        />
                    <uni-list-item
                        title="产品简称" 
                        :right-text="bd_material.F_RGEN_Text_cpjc"
                        @click="edit_field('F_RGEN_Text_cpjc')"
                        :clickable="is_admin || is_storekeeper"
                        :show-arrow="is_admin || is_storekeeper"
                        />
                    <uni-list-item
                        title="单箱标准数量"
                        :right-text="bd_material.MaterialStock[0].BoxStandardQty.toString()"
                        @click="edit_field('FBoxStandardQty')"
                        :clickable="is_admin || is_storekeeper"
                        :show-arrow="is_admin || is_storekeeper"
                        />
                    <uni-list-item
                        title="单托标准数量"
                        :right-text="bd_material.F_RGEN_Text_qtr"
                        @click="edit_field('F_RGEN_Text_qtr')"
                        :clickable="is_admin || is_storekeeper"
                        :show-arrow="is_admin || is_storekeeper"
                        />
                    <uni-list-item
                        title="仓库"
                        :right-text="bd_material.MaterialStock[0].StockId?.Name[0].Value"
                        @click="edit_field('StockId')"
                        :clickable="is_admin"
                        :show-arrow="is_admin"
                        />
                    <uni-list-item 
                        title="仓管员"
                        :right-text="bd_material.F_PAEZ_Base1 ? [bd_material.F_PAEZ_Base1.Name[0].Value, bd_material.F_PAEZ_Base1.FStaffNumber].join(' / ') : ''"
                        @click="edit_field('CangGuanYuan')"
                        :clickable="is_admin"
                        :show-arrow="is_admin"
                        />
                    <uni-list-item
                        title="库位"
                        :right-text="bd_material.F_PAEZ_Text_qtr2"
                        @click="edit_field('F_PAEZ_Text_qtr2')"
                        :clickable="is_admin"
                        :show-arrow="is_admin"
                        />
                    <uni-list-item
                        title="部装工序"
                        :right-text="bd_material.F_RGEN_Text_bzgx"
                        @click="edit_field('F_RGEN_Text_bzgx')"
                        :clickable="is_admin"
                        :show-arrow="is_admin"
                        />
                </uni-list>
            </uni-section>
        </uni-col>
        <uni-col :md="8">
            <uni-section title="金蝶即时库存" type="square">
                <template #right>
                    <view class="text-bold">{{ sum_stk_inv }}</view>
                </template>
                <uni-list v-if="stk_invs.length">
                    <uni-list-item v-for="(stk_inv, index) in stk_invs" :key="index"
                        :title="stk_inv['FStockId.FName']"
                        :right-text="[stk_inv['FBaseQty'], stk_inv['FBaseUnitId.FName']].join(' ')">
                    </uni-list-item>
                </uni-list>
                <view v-else class="text-nodata">NO DATA</view>
            </uni-section>
        </uni-col>
        <uni-col :md="8">
            <uni-section title="图片" type="square">
                <uni-row>
                    <uni-col :md="8" v-for="(e, i) in 3" :key="i">
                        <view class="image-card">
                            <image
                                :src="image_urls[i]?.original || image_urls[i]?.thumbnail" 
                                mode="aspectFill"
                                :style="{
                                    width: image_urls[i]?.loading ? 0 : '100%',
                                    height: image_urls[i]?.loading ? 0 : ''
                                }"
                                @click="image_preview(i)"
                                />
                            <view class="image-card-footer" v-if="$store.state.screen_type === 'h5' && (is_admin || is_storekeeper)">
                                <view class="text-grey">{{ `图片 ${i+1}` }}</view>
                                <view>
                                    <uni-icons v-if="image_urls[i]?.id" type="trash" size="24" color="#dd524d" @click="if_image_delete(i)"></uni-icons>
                                    <uni-icons type="upload" size="24" color="#007aff" class="uni-ml-3" @click="image_upload(i)"></uni-icons>
                                </view>
                            </view>
                        </view>
                    </uni-col>
                </uni-row>
            </uni-section>
            <uni-group v-if="$store.state.screen_type === 'h5'" title="其他操作" mode="card">
                <button size="mini" @click="search_bom">浏览BOM</button>
                <button type="primary" size="mini"class="uni-ml-5" @click="select_material_card">打印模板</button>
            </uni-group>
        </uni-col>
    </uni-row>
        
    <!--
    <uni-section title="物料详情" type="square" v-if="bd_material.Id" class="above-uni-goods-nav">
        <uni-list>
            <uni-list-item title="物料编码" :right-text="bd_material.Number" />
            <uni-list-item title="物料名称" :right-text="bd_material.Name[0]?.Value" />
            <uni-list-item title="规格型号" :right-text="bd_material.Specification[0]?.Value" />
            <uni-list-item title="存货类别" :right-text="bd_material.MaterialBase[0].CategoryID.Name[0].Value" />
            <uni-list-item 
                title="销售简称" 
                :right-text="bd_material.F_RGEN_xsjc_83g"
                @click="edit_field('F_RGEN_xsjc_83g')"
                :clickable="is_admin"
                :show-arrow="is_admin"
                />
            <uni-list-item
                title="产品简称" 
                :right-text="bd_material.F_RGEN_Text_cpjc"
                @click="edit_field('F_RGEN_Text_cpjc')"
                :clickable="is_admin || is_storekeeper"
                :show-arrow="is_admin || is_storekeeper"
                />
            <uni-list-item
                title="单箱标准数量"
                :right-text="bd_material.MaterialStock[0].BoxStandardQty.toString()"
                @click="edit_field('FBoxStandardQty')"
                :clickable="is_admin || is_storekeeper"
                :show-arrow="is_admin || is_storekeeper"
                />
            <uni-list-item
                title="单托标准数量"
                :right-text="bd_material.F_RGEN_Text_qtr"
                @click="edit_field('F_RGEN_Text_qtr')"
                :clickable="is_admin || is_storekeeper"
                :show-arrow="is_admin || is_storekeeper"
                />
            <uni-list-item
                title="仓库"
                :right-text="bd_material.MaterialStock[0].StockId?.Name[0].Value"
                @click="edit_field('StockId')"
                :clickable="is_admin"
                :show-arrow="is_admin"
                />
            <uni-list-item 
                title="仓管员"
                :right-text="bd_material.F_PAEZ_Base1 ? [bd_material.F_PAEZ_Base1.Name[0].Value, bd_material.F_PAEZ_Base1.FStaffNumber].join(' / ') : ''"
                @click="edit_field('CangGuanYuan')"
                :clickable="is_admin"
                :show-arrow="is_admin"
                />
            <uni-list-item
                title="库位"
                :right-text="bd_material.F_PAEZ_Text_qtr2"
                @click="edit_field('F_PAEZ_Text_qtr2')"
                :clickable="is_admin"
                :show-arrow="is_admin"
                />
            <uni-list-item
                title="部装工序"
                :right-text="bd_material.F_RGEN_Text_bzgx"
                @click="edit_field('F_RGEN_Text_bzgx')"
                :clickable="is_admin"
                :show-arrow="is_admin"
                />
            <template v-for="(stk_inv, index) in stk_invs" :key="index">
                <uni-list-item
                    title="库存量(基本单位)"
                    :note="[
                        `组织：${stk_inv['FStockOrgId.FName']}`,
                        `仓库：${stk_inv.FStockName}`
                    ].join('\n')"
                    :right-text="[stk_inv.FBaseQty, bd_material.MaterialBase[0].BaseUnitId.Name[0].Value].join(' ')">
                    <template #body>
                        <view class="uni-list-item__body">
                            <view class="title">库存量(金蝶账面)</view>
                            <view class="note">
                                <view>组织：<text :class="stk_inv.FStockOrgId == $store.state.cur_stock.FUseOrgId ? 'text-primary' : ''">{{ stk_inv['FStockOrgId.FName'] }}</text></view> 
                                <view>仓库：{{ stk_inv.FStockName }}</view>
                            </view>
                        </view>
                    </template>
                </uni-list-item>
            </template> 
        </uni-list>
        
        <view v-for="(image_url, index) in image_urls" :key="index" class="image-card">
            <image
                :src="image_url.original || image_url.thumbnail" 
                mode="widthFix"
                :style="{
                    width: image_url.loading ? 0 : '100%',
                    height: image_url.loading ? 0 : ''
                }"
                @click="image_preview(index)"
                />
        </view>       
    </uni-section>
    -->
    
    <view v-if="$store.state.screen_type === 'app-plus'" class="uni-goods-nav-wrapper">
        <uni-goods-nav 
            :options="goods_nav.options" 
            :button-group="goods_nav.button_group"
            :fill="$store.state.goods_nav_fill"
            @click="goods_nav_click"
            @buttonClick="goods_nav_button_click"
        />
    </view>
    <!-- 上传图片 -->
    <uni-popup ref="image_popup" type="share" safe-area>
        <uni-section title="上传图片" type="square"
            :style="{ borderRadius: '10px 10px 0 0' }"
            >
            <template v-slot:right>
                <view class="uni-section__right">
                    <uni-icons type="closeempty" size="20" color="#333" @click="$refs.image_popup.close()"/>
                </view>
            </template>
            <uni-list>
                <uni-list-item v-for="(field, index) in image_fields" 
                    :key="index"
                    :title="`图片 ${index + 1}`"
                    :thumb="thumbnail_url(bd_material[field])"
                    thumb-size="lg"
                    >
                    <template #footer>
                        <view v-if="is_admin || is_storekeeper" class="uni-list-item__foot">
                            <uni-icons v-if="bd_material[field].trim()" type="trash" size="24" color="#dd524d" @click="if_image_delete(index)" class="uni-mr-5" />
                            <button type="primary" size="mini" @click="image_upload(index)">选择上传</button>
                        </view>
                        <view v-else class="uni-list-item__foot text-grey text-sm">
                            创建组织下才可上传
                        </view>
                    </template>
                </uni-list-item>
            </uni-list>
        </uni-section>
    </uni-popup>
    
    <uni-popup ref="qrcode_popup" type="dialog">
        <uni-popup-dialog title="分享二维码" type="info" confirm-text="完成" :show-close="false" style="min-width: 400px;">
            <view align="center">
                <uqrcode ref="qrcode" :canvas-id="canvas_id" :value="bd_material.Number" :size="280"></uqrcode>
                <view class="text-grey uni-mt-5">{{ bd_material.Number }}</view>
            </view>
        </uni-popup-dialog>
    </uni-popup>
    
    <uni-popup ref="edit_popup" type="dialog">
        <uni-popup-dialog :title="edit_form.name"
            confirm-text="提交更新"
            @close="$refs.edit_popup.close()"
            @confirm="submit_edit_field"
            :before-close="true"
            :style="{ width: $store.state.system_info.windowWidth - 20 + 'px', minWidth: '360px', maxWidth: '1200px' }"
            >
            <view class="edit-form">
                <uni-data-picker v-if="edit_form.field == 'StockId'"
                    ref="stock_id_data_picker"
                    v-model="edit_form.value"
                    :localdata="$store.state.bd_stock_opts"
                    popup-title="请选择仓库"
                    />
                <uni-easyinput v-else-if="edit_form.field == 'CangGuanYuan'"
                    v-model="edit_form.value"
                    :type="edit_form.type"
                    :placeholder="edit_form.placeholder"
                    suffixIcon="search"
                    trim="both"
                    />
                <uni-easyinput v-else 
                    v-model="edit_form.value"
                    :type="edit_form.type"
                    :placeholder="edit_form.placeholder"
                    trim="both"
                    />
            </view>
        </uni-popup-dialog>
    </uni-popup>
</template>

<script>
    import store from '@/store'
    import { play_audio_prompt, link_to } from '@/utils'
    import { BdMaterial, StkInventory } from '@/utils/model'
    import { choose_image, read_file_as_base64 } from '@/utils/file'
    import K3CloudApi from '@/utils/k3cloudapi'
    export default {
        props: {
            id: {
                type: String
            }
        },
        data() {
            return {
                bd_material: {},        // 物料实例
                stk_invs: [],    // 即时库存实例
                image_urls: [],         // 实例图片
                image_fields: ['ImageFileServer', 'F_PAEZ_ImageFileServer', 'F_PAEZ_ImageFileServer1'], // 图片字段
                f_image_fields: ['FImageFileServer', 'F_PAEZ_ImageFileServer', 'F_PAEZ_ImageFileServer1'], // F + 图片字段
                flash_type: '',
                flash_msg: '',
                canvas_id: '',
                edit_form: { name: '', type: 'text', field: '', value: '', value_was: '' },
                goods_nav: {
                    options: [
                        { icon: 'image', text: '上传图片'},
                        { icon: 'search', text: 'BOM' }
                    ],
                    button_group: [
                        { text: '打印模板', color: '#fff', backgroundColor: store.state.goods_nav_color.grey }
                    ]
                }
            }
        },
        onLoad(options) {
            if (options.id) {
                this.load_material(options.id)
            }
        },
        mounted() {
            // BdMaterial.update(2554297, { FImageFileServer: "9e56ca4797164f128d37fca3dbc9eaa3" })
        },
        computed: {
            can_edit() {
                return ['wh_admin', 'nrj_admin'].includes(store.state.role)
            },
            is_admin() {
                return (store.state.cur_stock.FUseOrgId && store.state.cur_stock.FUseOrgId === 1 && ['wh_admin', 'nrj_admin'].includes(store.state.role))
            },
            is_storekeeper() {
                return store.state.cur_staff.FName === this.bd_material.F_PAEZ_Base1?.Name[0]?.Value
            },
            sum_stk_inv() {
                let res = 0
                for (let stk_inv of this.stk_invs) {
                    res += stk_inv.FBaseQty
                }
                return res
            }
        },
        methods: {
            debug() {
                this.$logger.info('>>>', this.$data)
            },
            edit_field(field) {
                if (!this.can_edit) {
                    this.flash('warn', '创建组织下才可修改')
                    return
                }
                if (field == 'F_RGEN_xsjc_83g') {
                    this.edit_form = {
                        field,
                        type: 'text',
                        name: '销售简称',
                        value: this.bd_material.F_RGEN_xsjc_83g,
                        value_was: this.bd_material.F_RGEN_xsjc_83g
                    }
                } else if (field == 'F_RGEN_Text_cpjc'){
                    this.edit_form = {
                        field,
                        type: 'text',
                        name: '产品简称',
                        value: this.bd_material.F_RGEN_Text_cpjc,
                        value_was: this.bd_material.F_RGEN_Text_cpjc
                    }
                } else if (field == 'FBoxStandardQty') {
                    this.edit_form = {
                        field,
                        type: 'number',
                        name: '单箱标准数量',
                        value: this.bd_material.MaterialStock[0].BoxStandardQty,
                        value_was: this.bd_material.MaterialStock[0].BoxStandardQty
                    }
                } else if (field == 'F_RGEN_Text_qtr') {
                    this.edit_form = {
                        field,
                        type: 'text',
                        name: '单托标准数量',
                        value: this.bd_material.F_RGEN_Text_qtr,
                        value_was: this.bd_material.F_RGEN_Text_qtr
                    }
                } else if (field == 'StockId') {
                    this.edit_form = {
                        field,
                        type: 'text',
                        name: '仓库',
                        value: 0,
                        value_was: this.bd_material.MaterialStock[0].StockId?.Name[0].Value
                    }
                } else if (field == 'CangGuanYuan') {
                    this.edit_form = {
                        field,
                        type: 'text',
                        name: '仓管员',
                        value: this.bd_material.F_PAEZ_Base1?.FStaffNumber,
                        value_was: this.bd_material.F_PAEZ_Base1?.FStaffNumber,
                        placeholder: '请填写员工编号'
                    }
                } else if (field == 'F_PAEZ_Text_qtr2') {
                    this.edit_form = {
                        field,
                        type: 'text',
                        name: '库位',
                        value: this.bd_material.F_PAEZ_Text_qtr2,
                        value_was: this.bd_material.F_PAEZ_Text_qtr2
                    }
                } else if (field == 'F_RGEN_Text_bzgx') {
                    this.edit_form = {
                        field,
                        type: 'text',
                        name: '部装工序',
                        value: this.bd_material.F_RGEN_Text_bzgx,
                        value_was: this.bd_material.F_RGEN_Text_bzgx
                    }
                }
                this.$refs.edit_popup.open()
            },
            flash(type, msg) {
                this.flash_type = type
                this.flash_msg = msg
                this.$refs.flash.open()
            },
            goods_nav_click(e) {
                if (e.index === 0) this.$refs.image_popup.open()
                if (e.index === 1) this.search_bom()
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.select_material_card() // btn:物料资料卡模板
            },
            search_bom() {
                link_to(`/pages/k3cloud/eng_bom/show?no=${this.bd_material.Number}`)
                // uni.showActionSheet({
                //     itemList: ['查询父项物料', '查询子项物料'],
                //     success: (e) => {
                //         // console.log('search_bom e', e)
                //         if (e.tapIndex === 0) {
                //             play_audio_prompt('success')
                //             uni.navigateTo({ url: `/pages/k3cloud/eng_bom/tree?material_no=${this.bd_material.Number}&sup=true`})
                //         }
                //         if (e.tapIndex === 1) {
                //             play_audio_prompt('success')
                //             uni.navigateTo({ url: `/pages/k3cloud/eng_bom/tree?material_no=${this.bd_material.Number}&sup=false`})
                //         }
                //     }
                // })
            },
            select_material_card() {
                if (!this.bd_material.Id) return
                uni.showActionSheet({
                    itemList: ['物料资料卡'],
                    success: async (e) => {
                        if (e.tapIndex === 0) {
                            this.$logger.info('>>> 生成物料资料卡')
                            await this.load_original_image()
                            uni.navigateTo({
                                url: '/pages/operation/material/card',
                                success: (res) => {
                                    play_audio_prompt('success')
                                    res.eventChannel.emit('sendMaterial', { bd_material: this.bd_material, image_urls: this.image_urls.filter(x => x.id) })
                                }
                            })
                        }
                    }
                })
            },
            show_qrcode() {
                this.canvas_id = 'qrcode_' + Date.now() // 每次设定不一样的canvas_id，修复popup重新打开后canvas显示空白的问题
                this.$refs.qrcode_popup.open()
            },
            if_image_delete(image_field_index) {
                uni.showActionSheet({
                    itemList: [`删除图片${image_field_index + 1}`],
                    success: (e) => {
                        if (e.tapIndex === 0) this.image_delete(image_field_index)
                    }
                })
            },
            async image_delete(image_field_index) {
                let params = {}
                params[this.f_image_fields[image_field_index]] = ''
                await BdMaterial.update(this.bd_material.Id, params)
                await this.load_material(this.bd_material.Id)
            },
            async image_upload(image_field_index) {
                const { tempFiles } = await choose_image({ count: 1, sizeType: ['compressed'] })
                uni.showLoading({ title: 'Loading', mask: true })
                for (let i = 0; i < tempFiles.length; i++) {
                    let temp_file = tempFiles[i]
                    let base64_data = await read_file_as_base64(temp_file.path)
                    let data = {
                        FileName: temp_file.name,
                        SendByte: base64_data
                    }
                    let upload_res = await K3CloudApi.upload_file(data)
                    this.$logger.info('upload_res', upload_res)
                    if (upload_res.data.Result.ResponseStatus.IsSuccess) {
                        let params = {}
                        params[this.f_image_fields[image_field_index]] = upload_res.data.Result.FileId
                        let update_res = await BdMaterial.update(this.bd_material.Id, params)
                        if (!update_res.data.Result.ResponseStatus.IsSuccess) {
                            this.flash('error', update_res.data.Result.ResponseStatus.Errors[0]?.Message)
                            uni.hideLoading()
                            return
                        }
                    }
                }
                uni.hideLoading()
                this.load_material(this.bd_material.Id) // reload
            },
            async image_preview(current) {
                await this.load_original_image()
                let urls = this.image_urls.filter(x => x.id).map(x => x.original)
                if (urls.length) uni.previewImage({ current, urls })
            },
            async load_material(material_id) {
                uni.showLoading({ title: 'Loading', mask: true })
                this.image_urls = []
                let view_res = await BdMaterial.view(material_id)
                if (view_res.data.Result.ResponseStatus.IsSuccess) {
                    let raw_data = view_res.data.Result.Result
                    this.bd_material = raw_data
                    for (let i = 0; i < 3; i++) {
                        let field = this.image_fields[i]
                        if (raw_data[field]?.trim()) {
                            this.image_urls[i] = {
                                field, i,
                                id: raw_data[field],
                                orignal: '',
                                thumbnail: await K3CloudApi.thumbnail_url(raw_data[field])
                            }
                        } else {
                            this.image_urls[i] = {
                                field, i, id: '', original: '', thumbnail: '/static/default_40x40.png'
                            }
                        }
                    }
                    // 加载即时库存数据
                    let inv_res = await StkInventory.query({ 'FMaterialId.FNumber': raw_data.Number }, { fields: ['FStockId', 'FStockId.FName', 'FBaseQty', 'FBaseUnitId.FName'] })
                    let stk_invs = [] // 按不同仓库分开
                    for (let item of inv_res.data) {
                        let stk_inv = stk_invs.find(x => x.FStockId == item.FStockId)
                        if (stk_inv) {
                            stk_inv.FBaseQty += item.FBaseQty
                            continue
                        }
                        stk_invs.push(item)
                    }
                    this.stk_invs = stk_invs
                    this.goods_nav.button_group[0].backgroundColor = store.state.goods_nav_color.green
                }
                uni.hideLoading()
            },
            async load_original_image() {
                uni.showLoading({ title: 'Loading' })
                for (let field of this.image_fields) {
                    if (this.bd_material[field]?.trim()) {
                        let obj = this.image_urls.find(x => x.field === field)
                        if (obj.original) continue // 避免重复加载
                        obj.original = await K3CloudApi.download_image_cache(this.bd_material[field])
                    }
                }
                uni.hideLoading()
            },
            async submit_edit_field() {
                if (this.edit_form.value == this.edit_form.value_was) {
                    this.$refs.edit_popup.close()
                    return // 数值未变，直接跳过
                }
                let params = {}
                if (this.edit_form.field == 'FBoxStandardQty') {
                    params = { SubHeadEntity1: { FBoxStandardQty: this.edit_form.value } }
                } else if (this.edit_form.field == 'StockId') {
                    params = { SubHeadEntity1: { FStockId: { FStockId: this.edit_form.value || 0 } } }
                } else if (this.edit_form.field == 'CangGuanYuan') {
                    params = { F_PAEZ_Base1: { FStaffNumber: this.edit_form.value } }
                } else {
                    params[this.edit_form.field] = this.edit_form.value
                }
                uni.showLoading({ title: 'Loading', mask: true })
                let update_res = await BdMaterial.update(this.bd_material.Id, params)
                uni.hideLoading()
                this.$refs.edit_popup.close()
                if (!update_res.data.Result.ResponseStatus.IsSuccess) {
                    this.flash('error', update_res.data.Result.ResponseStatus.Errors[0]?.Message)
                    return
                } 
                await this.load_material(this.bd_material.Id)
                this.flash('success', '修改成功')
                play_audio_prompt('success')
            },
            thumbnail_url(file_id) {
                let image_url = this.image_urls.find(x => x.id == file_id.trim())
                return image_url?.thumbnail || '/static/default_40x40.png'
            }
        }
    }
</script>

<style lang="scss" scoped>
    // .uni-list-item::v-deep {
    //     .uni-list-item__container {
    //         padding: 9px 15px;
    //     }
    //     .uni-list-item__content-title {
    //         font-weight: bold;
    //     }
    //     .uni-list-item__extra {
    //         flex: 2;
    //     }
    //     .uni-list-item__extra-text {
    //         color: #666;
    //         font-size: 13px;
    //     }
    // }
    .image-card::v-deep {
        uni-image {
            max-height: 200px;
        }
        margin: 0 10px 10px 10px;
        padding: 5px 5px 1px 5px;
        border: 1px solid #eee;
        border-radius: 5px;
        box-shadow: rgba(0, 0, 0, 0.08) 0px 0px 3px 1px;
        .image-loading {
            position: absolute;
            z-index: 10;
            animation: rotate 2s linear infinite;
        }
        .image-card-footer {
            padding: 3px 0;
            display: flex;
            justify-content: space-between;
        }
    }
    
    // .image-card {
    //     margin: 10px;
    //     padding: 5px 5px 1px 5px;
    //     border: 1px solid #eee;
    //     border-radius: 5px;
    //     box-shadow: rgba(0, 0, 0, 0.08) 0px 0px 3px 1px;
    //     .image-loading {
    //         position: absolute;
    //         z-index: 10;
    //         animation: rotate 2s linear infinite;
    //     }
    // }
    
    @keyframes rotate {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
    .uni-list-item__foot {
        flex-direction: row;
        align-items: center;
    }
    .edit-form {
        width: 100%;
        display: flex;
        justify-content: center;
    }
</style>
