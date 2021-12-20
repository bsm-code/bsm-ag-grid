/**
 * Custom ag-grid Config
 * @author Ben Salah Meher <meherbensalah4@gmail.com>
 */
class SBCExcelAgGrid {
    /**
     * function that export the all data in params with the specified columns choosed
     * @param data
     */
    export_excel_all(data) {
        var actives = JSON.parse(localStorage.getItem(agGridInstance.uid)).excelColumns;
        var columns = agGridInstance.columnsList;
        var xlsHeader = [];
        var activeCols = [];
        /** JSON Header excel  */
        for (var j in actives) {
            for (var s in columns) {
                if (actives[j].field === columns[s].field) {
                    xlsHeader.push(columns[s].displayedName);
                    activeCols.push(columns[s]);
                }
            }
        }
        var res = [];
        var createXLSLFormatObj = [];
        $.each(data, function (index, node) {
            var val = {};
            for (var c = 0; c < activeCols.length; c++) {
                if (activeCols[c].type === 'date' || activeCols[c].type === 'datetime') {
                    val[activeCols[c].field] = dateFormat(node[activeCols[c].field].date, columnsInstance.getDateFormatByField(activeCols[c].field), true);
                } else {
                    if (activeCols[c].type === 'entity') {
                        var fieldTmp = ('' + activeCols[c].queryField).split('.');
                        let formatter = (activeCols[c].valueFormatter) ? activeCols[c].valueFormatter : function(params){
                            return agGridInstance.getFormatter(fieldTmp[0],params.data[fieldTmp[0]][fieldTmp[1]]);
                        };
                        val[activeCols[c].field] = formatter( {data: node} );
                    } else {
                        if(activeCols[c].type === 'boolean'){
                            val[activeCols[c].field] = agGridInstance.getFormatter(activeCols[c].field,node[activeCols[c].field]);
                        }else{
                            if(activeCols[c].type === 'html'){
                                val[activeCols[c].field] = agGridInstance.getFormatter(activeCols[c].field,node[activeCols[c].queryField]);
                            }else{
                                val[activeCols[c].field] = agGridInstance.getFormatter(activeCols[c].field,node[activeCols[c].field]);
                            }
                        }
                    }
                }
            }
            res.push(val);
        });

        var xlsRows = res;

        console.log(xlsRows);
        createXLSLFormatObj.push(xlsHeader);
        $.each(xlsRows, function (index, value) {
            var innerRowData = [];
            $.each(value, function (ind, val) {
                innerRowData.push(val);
            });
            createXLSLFormatObj.push(innerRowData);
        });

        /* File Name */
        var filename = agGridInstance.searchNode.entity + ".xlsx";

        /* Sheet Name */
        var ws_name = agGridInstance.searchNode.entity + " Sheet";

        if (typeof console !== 'undefined') console.log(new Date());
        var wb = XLSX.utils.book_new(),
            ws = XLSX.utils.aoa_to_sheet(createXLSLFormatObj);

        /* Add worksheet to workbook */
        XLSX.utils.book_append_sheet(wb, ws, ws_name);

        /* Write workbook and Download */
        if (typeof console !== 'undefined') console.log(new Date());
        XLSX.writeFile(wb, filename);
        if (typeof console !== 'undefined') console.log(new Date());
    }

    /**
     * function to export all the data to excel file
     */
    export_all_data_excel() {
        setTimeout(function () {
            document.getElementById('loading').style.display = 'block';
        }, 200);
        var dataArray = [];
        var nb = parseInt(localStorage.getItem('nbData'), 10);
        var repNB = 1;
        if (nb > 4000) {
            repNB = Math.ceil(nb / 4000);
        }
        agGridInstance.donnes = [];
        agGridInstance.requestData(1, repNB);
    }

    /**
     * function to export the viewed data to excel file
     */
    export_viewed_data_excel() {
        var cols = JSON.parse(localStorage.getItem(agGridInstance.uid)).excelColumns;
        var exportedCols = [];
        var xlsHeader = [];
        var columns = agGridInstance.columnsList;
        for (var d in cols) {
            for(var s in columns){
                if(cols[d].field === columns[s].field){
                    xlsHeader.push(columns[s].displayedName);
                    exportedCols.push(columns[s]);
                }
            }
        }
        var res = [];
        var createXLSLFormatObj = [];

        agGridInstance.gridOptions.api.forEachNodeAfterFilterAndSort(function (node, index) {
            var val = {};
            for (var c = 0; c < exportedCols.length; c++) {
                if (exportedCols[c].type === 'date' || exportedCols[c].type === 'datetime') {
                    val[exportedCols[c].field] = node.data[exportedCols[c].field] ;
                } else {
                    if (exportedCols[c].type === 'entity') {
                        var fieldTmp = ('' + exportedCols[c].queryField).split('.');
                        if (typeof (node.data[fieldTmp[0]]) !== 'undefined') {
                            let formatter = (exportedCols[c].valueFormatter) ? exportedCols[c].valueFormatter : function(params){
                                return agGridInstance.getFormatter(fieldTmp[0],params.data[fieldTmp[0]][fieldTmp[1]]);
                            };
                            val[exportedCols[c].field] = formatter(node);
                        } else {
                            let formatter = (exportedCols[c].valueFormatter) ? exportedCols[c].valueFormatter : function(params){
                                return agGridInstance.getFormatter(fieldTmp[0],params.data[fieldTmp[0]]);
                            };
                            val[exportedCols[c].field] = formatter(node);
                        }
                    } else {
                        if(exportedCols[c].type === 'boolean'){
                            if(typeof node.data[exportedCols[c].field] === 'boolean'){
                                val[exportedCols[c].field] = agGridInstance.getFormatter(exportedCols[c].field,node.data[exportedCols[c].field]);
                            }else{
                                val[exportedCols[c].field] = node.data[exportedCols[c].field];
                            }
                        }else{
                            if(exportedCols[c].type === 'html'){
                                val[exportedCols[c].field] = agGridInstance.getFormatter(exportedCols[c].field,node.data[exportedCols[c].queryField]);
                            }else{
                                val[exportedCols[c].field] = agGridInstance.getFormatter(exportedCols[c].field,node.data[exportedCols[c].field]);
                            }
                        }
                    }
                }
            }
            res.push(val);
        });

        var xlsRows = res;

        createXLSLFormatObj.push(xlsHeader);
        $.each(xlsRows, function (index, value) {
            var innerRowData = [];
            $.each(value, function (ind, val) {
                innerRowData.push(val);
            });
            createXLSLFormatObj.push(innerRowData);
        });

        /* File Name */
        var filename = agGridInstance.searchNode.entity + ".xlsx";

        /* Sheet Name */
        var ws_name = agGridInstance.searchNode.entity+ " Sheet";

        if (typeof console !== 'undefined') console.log(new Date());
        var wb = XLSX.utils.book_new(),
            ws = XLSX.utils.aoa_to_sheet(createXLSLFormatObj);

        /* Add worksheet to workbook */
        XLSX.utils.book_append_sheet(wb, ws, ws_name);

        /* Write workbook and Download */
        if (typeof console !== 'undefined') console.log(new Date());
        XLSX.writeFile(wb, filename);
        if (typeof console !== 'undefined') console.log(new Date());
    }

    /**
     * export to excel function after columns export submit
     * this function will show a prompt message to the user to choose the export type ('all data' or 'viewed data')
     */

    export_table_excel() {
        agGridInstance.questionModal = UIkit.modal.confirm(`
            <div class="close-modal-ag"><span onclick="excelInstance.closeUIKITModal()">X</span></div> 
            <div> <span class="modal-icon-ag" uk-icon="question"> </span> </div>
            <h2 style="text-align: center"> Exporter le tableau en fichier excel </h2> 
            <p style="text-align: center"> exporter la page actuel ou tous les pages ? </p>
            <hr class="hr-table-setting">`
            , function () {
                columnsInstance.filterType = 'excel';
                excelInstance.export_all_data_excel();
            }
            , function () {
                columnsInstance.filterType = 'excel';
                excelInstance.export_viewed_data_excel();
            },
            {
                labels: {
                    'Ok': 'Exporter tous les pages',
                    'Cancel': 'Exporter la page actuel'
                }
            }
        );
    }

    closeUIKITModal() {
        agGridInstance.questionModal.hide();
    }

    /**
     * function that show the columns chooser modal to set the exported columns
     */
    openExcelExport() {
        columnsInstance.filterType = 'excel';
        $('#initial-columns').empty();
        $('#results-columns').empty();
        $('#myModal').remove();
        var modal = componentsInstance.columnConfigModal.clone();
        $('body').append(modal);
        $('#myModal').attr('datasrc', 'modal');
        $('#myModal').css({'display': "block"});
        //$('#submit-column-setting').text('export');
        componentsInstance.init_column_config_section(agGridInstance.columnsList);
    }
}