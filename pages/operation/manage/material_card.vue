<template>
    <scroll-view scroll-x="true" class="above-uni-goods-nav">  
        <view :id="card_template.id" :class="card_template.class" :style="card_template.style">
            <uni-row 
                v-for="(row, row_index) in card_template.rows" 
                :key="row_index"
                :class="row.class"
                :style="row.style"
                >
                <uni-col 
                    v-for="(col, col_index) in row.cols"
                    :key="col_index"
                    :span="col.span"
                    :class="col.class"
                    :style="col.style"
                    >
                    <!-- <canvas v-if="col.canvas" :canvas-id="col.canvas.id" :style="col.canvas.style" :class="col.canvas.class"></canvas> -->
                    <image v-if="col.image" mode="aspectFit" :src="col.image.url" :style="col.image.style" :class="col.image.class"/>
                    <text v-if="col.text" :style="col.text.style" :class="col.text.class">{{ col.text.text }}</text>
                    <uqrcode v-if="col.qrcode" :ref="col.qrcode.ref" :canvas-id="col.qrcode.id" :value="col.qrcode.value" :size="col.qrcode.size"></uqrcode>
                </uni-col>
            </uni-row>
        </view>
    </scroll-view>

    <sp-html2canvas-render
        :domId="card_template.id"
        ref="pdf_render"
        @render-over="render_over"></sp-html2canvas-render>
    
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
    import K3CloudApi from '@/utils/k3cloudapi'
    import { urlToBase64 } from "@/uni_modules/sp-html2canvas-render/utils/index.js"
    export default {
        data() {
            return {
                category: 'wlzlk', // 模板类型
                bd_material: {},
                // card > row > col
                card_template: {
                    id: '',
                    class: '',
                    style: {},
                    rows: []
                },
                text: '1.01.04.06.0090',
                window_height: 1920, // 屏幕高度设定值
                window_width: 1080,  // 屏幕宽度设定值，作为模板尺寸参考基准，使得APP/H5渲染的尺寸保持一致
                render_image: '',
                goods_nav: {
                    options: [
                        { icon: 'tune', text: '调试', info: 0 }
                    ],
                    button_group: [
                        { text: '导出图片', color: '#fff', backgroundColor: store.state.goods_nav_color.green }
                    ]
                }
            }
        },
        onLoad(options) {
            const eventChannel = this.getOpenerEventChannel();
            eventChannel.on('sendMaterial', res => {
                console.log('eventChannel.on sendMaterial', res)
                this.bd_material = res.bd_material
                this.set_wlzlk_template(this.bd_material)
            })
        },
        mounted() {
            // this.$nextTick(_ => {
            //     if (!this.bd_material.Id) this.load_material() // dev
            // })
        },
        methods: {
            // 各端兼容的image url
            async compatible_url(url) {
                // #ifdef APP-PLUS
                return urlToBase64(url)
                // #endif
                // #ifdef H5
                return url
                // #endif
            },
            goods_nav_click(e) {
                if (e.index === 0) this.test()
            },
            goods_nav_button_click(e) {
                if (e.index === 0) {
                    uni.showLoading({ title: '渲染图片文件' })
                    this.$refs.pdf_render.h2cRenderDom() // btn:渲染模板
                } 
                // if (e.index === 1) this.select_material_card() // btn:物料资料卡模板
            },
            load_material() {
                K3CloudApi.view('BD_Material', { Number: '2.03.21.11.0002' }).then(res => {
                    if (res.data.Result.ResponseStatus.IsSuccess) {
                        this.bd_material = res.data.Result.Result
                        this.set_wlzlk_template(this.bd_material)
                    }
                })
            },
            // == 物料资料卡模板 ==
            async set_wlzlk_template(bd_material) {
                this.card_template.id = this.category
                this.card_template.class = 'card-default'
                this.card_template.style = {
                    width: this.window_width + 'px',
                    height: this.window_width / 1.414 + 'px'
                }
                let rows = []
                // header
                rows.push({
                    cols:[
                        { 
                            span: 24,
                            image: {
                                url: await this.compatible_url('./static/image/wlzlk_header.png'),
                                style: { width: this.window_width + 'px', height: this.window_width * 540 / 3508 + 'px'  },
                            },
                        }
                    ]
                })
                // body
                rows.push({
                    class: 'wlzlk-row',
                    cols: [
                        { span: 6, text: { text: '物料代码' } },
                        { span: 18,text: { text: bd_material.Number } }
                    ]
                })
                rows.push({
                    class: 'wlzlk-row',
                    cols: [
                        { span: 6, text: { text: '物料名称' } },
                        { span: 18, text: { text: bd_material.Name[0].Value } }
                    ]
                })
                rows.push({
                    class: 'wlzlk-row',
                    cols: [
                        { span: 6, text: { text: '物料型号' } },
                        { span: 18, text: { text: bd_material.Specification[0].Value } }
                    ]
                })
                rows.push({
                    class: 'wlzlk-row',
                    cols: [
                        { span: 6, text: { text: '标准装箱量' } },
                        { span: 18, text: { text: bd_material.MaterialStock[0].BoxStandardQty } }
                    ]
                })
                rows.push({
                    cols: [
                        {   
                            span: 6, style: { height: this.window_width * 0.25 + 'px' }, 
                            text: { text: '参考图' }
                        },
                        {   
                            span: 12,
                            image: {
                                url: await K3CloudApi.download_url(bd_material.ImageFileServer),
                                style: { width: this.window_width * 0.5 + 'px', height: this.window_width * 0.25 + 'px' }
                            }
                        },
                        {   
                            span: 6,
                            style: { padding: '5px'},
                            qrcode: {
                                ref: 'qrcode',
                                id: 'qrcode',
                                value: bd_material.Number,
                                size: this.window_width * 0.24
                            }
                        }
                    ]
                })
                // footer
                rows.push({
                    cols: [
                        { 
                            span: 24, 
                            image: {
                                url: await this.compatible_url('./static/image/card_footer.png'), 
                                style: { width: this.window_width + 'px', height: this.window_width * 125 / 1790 + 'px'  },
                            }
                        }
                    ]
                })
                this.card_template.rows = rows
            },
            render_over(e) {
                // e为导出的图片（base64）
                // console.log("==== renderOver :", e);
                let filename = `${this.category}_${Date.now()}`
                // #ifdef APP-PLUS
                    this.save_base64_data_app_plus(e, filename)
                // #endif
                // #ifdef H5
                    this.save_base64_data_h5(e, filename)
                // #endif
            },
            save_base64_data_app_plus(base64_data, filename) {
                uni.showLoading({ title: '正在保存文件' })
                const bitmap = new plus.nativeObj.Bitmap('base64')
                bitmap.loadBase64Data(base64_data, () => {
                    let arr = base64_data.split(',');
                    let extname = arr[0].match(/:image\/(.*?);/)[1]
                    let url = `${filename}.${extname}`
                    bitmap.save(
                        url,
                        { 
                            overwrite: true // 是否覆盖
                            // quality: 'quality' // 图片清晰度
                        },
                        (i) => {
                            uni.saveImageToPhotosAlbum({
                                filePath: url,
                                success: () => {
                                    console.log('>>> APP-PLUS图片保存成功')
                                    uni.hideLoading()
                                    uni.showToast({ title: '已保存到相册' })
                                    bitmap.clear()
                                }
                            })
                        },
                        (e) => {
                            console.log('>>> APP-PLUS图片保存失败')
                            bitmap.clear()
                        }
                    ),
                    (e) => {
                        console.log('>>> APP-PLUS图片保存失败')
                        bitmap.clear()
                    }
                })
            },
            save_base64_data_h5(base64_data, filename) {
                uni.showLoading({ title: '正在保存文件' })
                // 将base64转换为blob对象
                let arr = base64_data.split(',');
                let mime = arr[0].match(/:(.*?);/)[1];
                let bstr = atob(arr[1]);
                let n = bstr.length;
                let u8arr = new Uint8Array(n);
                while (n--) {
                    u8arr[n] = bstr.charCodeAt(n);
                }
                const blob = new Blob([u8arr], { type: mime });
                // 创建一个链接元素
                let link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = filename;
                // 触发下载
                link.click();
                // 清理
                URL.revokeObjectURL(link.href);
                uni.hideLoading()
                console.log('>>> H5图片保存成功')
            },
            test() {
                try{
                    console.log('DEBUG', this.$data)
                } catch (err) {
                    console.log('err', err)
                }
            }
        }
    }
</script>

<style lang="scss" scoped>
    .m-card {
        image {
            width: 100%;
        }
    }
    .card-default::v-deep {
        line-height: 2;
        font-weight: bold;
        font-size: 26px;
        .uni-col {
            display: flex;
            align-items: center;
            justify-content: space-around;
            border-top: 1px solid #333;
            border-left: 1px solid #333;
            &:last-child {
                border-right: 1px solid #333;
            }
        }
        
        .wlzlk-row {
            .uni-col {
                padding: 4px;
            }
        }
    }
</style>
