
<template>
  <div>
    <!-- 文件上传区域 -->
    <input
      ref="excel-upload-input"
      class="excel-upload-input"
      type="file"
      accept=".xlsx, .xls"
      @change="handleClick"
    />
    <div class="drop" @drop="handleDrop" @dragover="handleDragover" @dragenter="handleDragover">
      拖动Excel文件到此处或者
      <el-button
        :loading="loading"
        style="margin-left:16px;"
        size="mini"
        type="primary"
        @click="handleUpload"
      >选择文件</el-button>
    </div>
    <!-- 数据显示区域 -->
    <div v-if="showData">
      <el-tabs v-model="chooseTable" @tab-click="tabClick">
        <el-tab-pane
          v-for="(sheet,index) of excelData.sheetList"
          :label="sheet"
          :name="index.toString()"
          :key="sheet"
        ></el-tab-pane>
      </el-tabs>
      <el-button v-show="JSON.stringify(tableData) !== '[]'" size="mini" type="primary" @click="pushData">输出该表数据</el-button>
      <el-table :data="tableData" border highlight-current-row style="width: 100%;margin-top:20px;">
        <el-table-column v-for="item of tableHeader" :prop="item" :label="item" :key="item" />
      </el-table>
    </div>
  </div>
</template>
 
<script>
import XLSX from "xlsx";
export default {
  props: {
    beforeUpload: Function, 
    onSuccess: Function, 
    showData: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      loading: false,
      excelData: {
        headerlist: null,
        resultslist: null,
        sheetList: []
      },
      chooseTable: 0,
      tableData: [],
      tableHeader: [],
      sheetList: []
    };
  },
  methods: {
    //选择文件点击上传
    handleClick(e) {
      const files = e.target.files;
      const rawFile = files[0];
      if (!rawFile) return;
      this.upload(rawFile);
    },
    //拖动文件上传
    handleDrop(e) {
      e.stopPropagation();
      e.preventDefault();
      if (this.loading) return;
      const files = e.dataTransfer.files;
      if (files.length !== 1) {
        this.$message.error("Only support uploading one file!");
        return;
      }
      const rawFile = files[0];
      if (!this.isExcel(rawFile)) {
        this.$message.error(
          "Only supports upload .xlsx, .xls, .csv suffix files"
        );
        return false;
      }
      this.upload(rawFile);
      e.stopPropagation();
      e.preventDefault();
    },
    handleDragover(e) {
      e.stopPropagation();
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    },
    handleUpload() {
      this.$refs["excel-upload-input"].click();
    },
    //上传文件
    upload(rawFile) {
      this.$refs["excel-upload-input"].value = null; 
      if (!this.beforeUpload) {
        this.readerData(rawFile);
        return;
      }
      const before = this.beforeUpload(rawFile);
      if (before) {
        this.readerData(rawFile);
      }
    },
    //读取上传文件数据
    readerData(rawFile) {
      this.loading = true;
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => {
          const data = e.target.result;
          const fixedData = this.fixData(data);
          const workbook = XLSX.read(btoa(fixedData), { type: "base64" });
          //1.先获取excel中工具表的列表
          const sheetList = workbook.SheetNames;
          let headerlist = [];
          let resultslist = [];
          let newWorkSheet = "";
          //2.传回所有工作表的表头和数据
          for (let i = 0; i < sheetList.length; i++) {
            newWorkSheet = workbook.Sheets[sheetList[i]];
            // newWorkSheet = this.formatSheet(workbook.Sheets[SheetList[i]]);
            headerlist.push(this.getHeaderRow(newWorkSheet));
            resultslist.push(XLSX.utils.sheet_to_json(newWorkSheet));
          }
          this.generateData({ headerlist, resultslist, sheetList });
          this.loading = false;
          resolve();
          if (!reader) {
            reject();
          }
        };
        reader.readAsArrayBuffer(rawFile);
      });
    },
    //输出数据
    generateData({ headerlist, resultslist, sheetList }) {
      this.excelData.headerlist = headerlist;
      this.excelData.resultslist = resultslist;
      this.excelData.sheetList = sheetList;
      this.onSuccess && this.onSuccess(this.excelData);
      this.tableData = this.excelData.resultslist[this.chooseTable];
      this.tableHeader = this.excelData.headerlist[this.chooseTable];
    },
    fixData(data) {
      let o = "";
      let l = 0;
      const w = 10240;
      for (; l < data.byteLength / w; ++l)
        o += String.fromCharCode.apply(
          null,
          new Uint8Array(data.slice(l * w, l * w + w))
        );
      o += String.fromCharCode.apply(null, new Uint8Array(data.slice(l * w)));
      return o;
    },
    getHeaderRow(sheet) {
      const headers = [];
      const range = XLSX.utils.decode_range(sheet["!ref"]);
      let C;
      const R = range.s.r;
      /* start in the first row */
      for (C = range.s.c; C <= range.e.c; ++C) {
        /* walk every column in the range */
        const cell = sheet[XLSX.utils.encode_cell({ c: C, r: R })];
        /* find the cell in the first row */
        let hdr = "UNKNOWN " + C; // <-- replace with your desired default
        if (cell && cell.t) hdr = XLSX.utils.format_cell(cell);
        headers.push(hdr);
      }
      return headers;
    },
    isExcel(file) {
      return /\.(xlsx|xls|csv)$/.test(file.name);
    },
    tabClick(tab) {
      this.chooseTable = tab.name;
      this.tableData = this.excelData.resultslist[this.chooseTable];
      this.tableHeader = this.excelData.headerlist[this.chooseTable];
    },
    pushData(){
      this.$emit('tableData',this.excelData.resultslist[this.chooseTable])
    }
  }
};
</script>
 
<style scoped>
.excel-upload-input {
  display: none;
  z-index: -9999;
}
.drop {
  border: 2px dashed #bbb;
  width: 600px;
  height: 160px;
  line-height: 160px;
  margin: 0 auto;
  font-size: 24px;
  border-radius: 5px;
  text-align: center;
  color: #bbb;
  position: relative;
}
</style>
