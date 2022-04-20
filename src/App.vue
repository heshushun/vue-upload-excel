<template>
  <div class="app">
    <UploadExcel :beforeUpload="beforeUpload" :onSuccess="handleSuccess" :showData="showData" @tableData="excelData"></UploadExcel>
  </div>
</template>

<script>
    import UploadExcel from "@/components/UploadExcel.vue";
    export default {
        name: "app",
        components: {
            UploadExcel
        },
        data() {
            return {
                showData: true
            };
        },
        methods: {
            // 文件读取前执行
            beforeUpload(file) {
                // 取文件大小，限制文件大小超过1mb
                const isLt1M = file.size / 1024 / 1024 < 1;
                if (isLt1M) {
                    return true;
                }
                this.$message({
                    message: "上传的Excel文件不能大于1mb.",
                    type: "warning"
                });
                return false;
            },
            // 文件读取后执行
            handleSuccess({ headerList, resultsList, sheetList }) {
                console.log("headerList",headerList);
                console.log("resultsList",resultsList);
                console.log("sheetList",sheetList);
            },
            excelData(data){
                console.log("excelData",data);
            }
        }
    };
</script>
