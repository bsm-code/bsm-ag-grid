/**
 * Custom ag-grid Config
 * @author Ben Salah Meher <meherbensalah4@gmail.com>
 */
class SBCColumnsAgGrid {

    filterType = 'view';

    /**
     * function that format a boolean value in params to a specified text format
     * @param params
     * @return {*}
     */
    booLeanFormatter(params) {
        if(typeof params.value === 'boolean'){
            if(params.value != null){
                if (params.value === true) {
                    return 'OUI';
                } else {
                    return 'NON';
                }
            }else{
                if (params === true) {
                    return 'OUI';
                } else {
                    return 'NON';
                }
            }
        }else{
            return params.value;
        }
    }

    getDateFormatByField(field) {
        var keys = agGridInstance.columnsList;
        for (var k in keys) {
            if (keys[k].field === field) {
                if (keys[k].dateFormat !== null)
                    return keys[k].dateFormat;
                else {
                    return 'dd/mm/yyyy';
                }
            }
        }
        return 'dd/mm/yyyy';
    }


    /**
     * function to check if the val string contain character or not
     * @param val
     * @return {boolean}
     */
    hasCharacter(val) {
        var chars = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'y', 'x', 'w', 'z'];
        for (var i = 0; i < val.length; i++) {
            if (chars.includes(val.toLowerCase().charAt(i)) === true) {
                return true;
            }
        }
        return false;
    }

    /**
     * function to check if the value is a date value or not
     * @param value
     * @return {boolean}
     */
    isDateValue(value) {
        // You want to check again for !isNaN(parsedDate) here because Dates can be converted
        // to numbers, but a failed Date parse will not.
        if (value.date !== null) {
            var parsedDate = Date.parse(value.date);
            if (isNaN(value.date) && !isNaN(parsedDate) && !this.hasCharacter(value.date)) {
                return true;
            } else {
                return false;
            }
        } else {
            var parsedDate = Date.parse(value);
            if (isNaN(value) && !isNaN(parsedDate) && !this.hasCharacter(value)) {
                return true;
            } else {
                return false;
            }
        }
    }

    /**
     * function void that reset the column Definition of the ag grid table
     */
    refresh_columns() {
        var configurations = JSON.parse(localStorage.getItem(agGridInstance.uid));
        // fetch viewed columns on modal
        var array = configurations.viewedColumns;
        var resultColumns = [];
        for(var a in array){
            for(var t in agGridInstance.columnConfigger){
                if(array[a].field === agGridInstance.columnConfigger[t].field){
                    var node = agGridInstance.columnConfigger[t];
                    resultColumns.push(node);
                }
            }
        }
        console.log(resultColumns);
        agGridInstance.gridOptions.api.setColumnDefs(resultColumns);
        this.reOrderColumns(array);
        //agGridInstance.config(config, false);
    }

    reOrderColumns(array){
        for (var index=0; index<array.length; index++){
            agGridInstance.gridOptions.columnApi.moveColumn(array[index].field,index);
        }
    }

    /**
     * function to close the column config modal
     */
    closeModalColumns() {
        $('#myModal').remove();
    }

    /**
     * function to open the columns config every click on column config button
     */
    openColumnsConfig() {
        this.filterType = 'view';
        $('#initial-columns').empty();
        $('#results-columns').empty();
        $('#myModal').remove();
        var modal = componentsInstance.columnConfigModal.clone();
        $('body').append(modal);
        $('#myModal').attr('datasrc', 'modal');
        $('#myModal').css({'display': "block"});
        componentsInstance.init_column_config_section(agGridInstance.columnsList);
    }


    /**
     * function to remove all filters of the ag grid table
     */
    deleteFilters() {
        agGridInstance.paginateData(1);
    }

    /**
     * cancel btn (of the columns config modal )click action
     */
    cancelSettingColumns() {
        $('#initial-columns').empty();
        $('#results-columns').empty();
        $('#myModal').remove();
    }

    /**
     * confirm columns config button (in the columns config modal) click event
     */
    confirmColumnConfig() {
        if (this.filterType === 'view') {
            var columnsF = [];
            var configurations = JSON.parse(localStorage.getItem(agGridInstance.uid));
            $('#results-columns > .column-item').each(function () {
                var ke = $(this).attr("data-controls");
                columnsF.push(agGridInstance.columnConfigger[parseInt(ke, 10)]);
            });
            configurations.viewedColumns = columnsF.map( (item, index) => { return {field: item.field, displayedName: item.headerName, width: item.width }});
            localStorage.setItem(agGridInstance.uid, JSON.stringify(configurations));
            this.refresh_columns();
        } else {
            var columnsF = [];
            var configurations = JSON.parse(localStorage.getItem(agGridInstance.uid));
            $('#results-columns > .column-item').each(function () {
                var ke = $(this).attr("data-controls");
                columnsF.push(agGridInstance.columnsList[parseInt(ke, 10)]);
            });
            if (this.filterType === 'print') {
                configurations.printedColumns = columnsF.map( (item, index) => { return {field: item.field, displayedName: item.headerName } });
                localStorage.setItem(agGridInstance.uid, JSON.stringify(configurations));
                printInstance.print_table();
            } else {
                if (this.filterType === 'excel') {
                    configurations.excelColumns = columnsF.map( (item, index) => { return {field: item.field, displayedName: item.headerName } });
                    localStorage.setItem(agGridInstance.uid, JSON.stringify(configurations));
                    excelInstance.export_table_excel();
                }
            }
        }
        $('#myModal').remove();
    }
}

