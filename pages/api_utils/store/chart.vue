<template>
    <view class="container">
        <qiun-data-charts canvas-id="bar_chart" type="column" :chartData="bar_chart_data" />
        <button type="primary" @click="share_chart('bar_chart')">分享柱状表</button>
        <qiun-data-charts canvas-id="pie_chart" type="pie" :chartData="pie_chart_data" />
        <button type="primary" @click="share_chart('pie_chart')">分享饼表</button>
    </view>
</template>

<script>
    export default {
        data() {
            return {
                bar_chart_data: {},
                pie_chart_data: {}
            }
        },
        mounted() {
            this.init_chart()
        },
        methods: {
            init_chart() {
                this.bar_chart_data = {
                    categories: ["2016","2017","2018","2019","2020","2021"],
                    series: [
                        {
                            name: "目标值",
                            data: [35,36,31,33,13,34]
                        },
                        {
                            name: "完成量",
                            data: [18,27,21,24,6,28]
                        }
                    ]
                }
                
                this.pie_chart_data = {
                    series: [
                        {
                            data: [{"name":"一班","value":50},{"name":"二班","value":30},{"name":"三班","value":20},{"name":"四班","value":18,"labelText":"四班:18人"},{"name":"五班","value":8}]
                        }
                    ]
                }
            },
            share_chart(canvas_id) {
                uni.canvasToTempFilePath({
                  canvasId: canvas_id,
                  success: function(res) {
                    // 在H5平台下，tempFilePath 为 base64
                    this.$logger.info('uni.canvasToTempFilePath res:', res)
                    uni.share({
                    	provider: "weixin",
                    	scene: "WXSceneSession",
                    	type: 2,
                    	imageUrl: res.tempFilePath,
                    	success: function (res) {
                    		this.$logger.info("success:" + JSON.stringify(res));
                    	},
                    	fail: function (err) {
                    		this.$logger.info("fail:" + JSON.stringify(err));
                    	}
                    });                    
                  }
                })
            }
        }
    }
</script>

<style>

</style>
