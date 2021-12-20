class SBCNumberFilter {

    hideFilter;
    filterIsActive = false;

    /**
     * AgGrid function used to init the component
     * @param params (configuration of the grid provided by AgGrid)
     */
    init(params){
        this.valueGetter = params.valueGetter;
        this.filterText = null;
        this.setupGui(params);
        this.appendStylesToBody();
    }

    afterGuiAttached(params){
        this.hideFilter = params.hidePopup;
    }

    /**
     * Create <style/> tag and append it to the body
     */
    appendStylesToBody(){
        let elem =  document.createElement('style');
        elem.innerHTML = this.style();
        document.head.appendChild(elem);
    }

    setModel(model){
        if (model === null){
            this.filterIsActive = false;
            //this.setupGui(this.params);
        }
    }

    /**
     * Prepare the UI
     * @param params
     */
    setupGui(params){
        this.params = params;
        let idFilterInput = `${params.colDef.field}-`;

        this.gui = document.createElement('div');
        this.gui.classList.add('sbc-number-filter-container');
        this.gui.innerHTML = `
            <div>
                <select id="select-filter-type">
                    <option value="0">Equals</option>
                    <option value="1">Not Equals</option>
                    <option value="2">Less than</option>
                    <option value="3">Less than or Equals</option>
                    <option value="4">Greater than</option>
                    <option value="5">Greater than or Equals</option>
                    <option value="6">In Range</option>
                </select>
            </div>
            <div class="elements">
                <div id="equals-area">
                    <input id="${idFilterInput}filter" type="number" step="0.001" placeholder="filter">
                </div>
                <div id="in-range-area" style="display: none">
                    <input id="${idFilterInput}from" type="number" step="0.001" placeholder="from">
                    <input id="${idFilterInput}to" type="number" step="0.001" placeholder="to">
                </div>
                <!--========== filtered elements goes here =========-->
            </div>
            <div>
                <button id="clear-btn" disabled="disabled">Vider</button>
                <button id="filter-btn" disabled="disabled">Filtrer</button>
            </div>
        `;

        this.gui.querySelector('#'+idFilterInput+'from')
            .addEventListener('input', () => {
                // in range
                var from = this.gui.querySelector('#'+idFilterInput+'from').value;
                var to = this.gui.querySelector('#'+idFilterInput+'to').value;
                if(from!=='' && to!==''){
                    this.gui.querySelector('#clear-btn').disabled = false;
                    this.gui.querySelector('#filter-btn').disabled = false;
                }else{
                    this.gui.querySelector('#clear-btn').disabled = true;
                    this.gui.querySelector('#filter-btn').disabled = true;
                }
            });

        this.gui.querySelector('#'+idFilterInput+'to')
            .addEventListener('input', () => {
                // in range
                var from = this.gui.querySelector('#'+idFilterInput+'from').value;
                var to = this.gui.querySelector('#'+idFilterInput+'to').value;
                if(from!=='' && to!==''){
                    this.gui.querySelector('#clear-btn').disabled = false;
                    this.gui.querySelector('#filter-btn').disabled = false;
                }else{
                    this.gui.querySelector('#clear-btn').disabled = true;
                    this.gui.querySelector('#filter-btn').disabled = true;
                }
            });

        this.gui.querySelector('#'+idFilterInput+'filter')
            .addEventListener('input', () => {
                // filter equals
                var value = this.gui.querySelector('#'+idFilterInput+'filter').value;
                if(value !== ''){
                    this.gui.querySelector('#clear-btn').disabled = false;
                    this.gui.querySelector('#filter-btn').disabled = false;
                }else{
                    this.gui.querySelector('#clear-btn').disabled = true;
                    this.gui.querySelector('#filter-btn').disabled = true;
                }
            });

        // handle "select all checkbox" changes
       this.gui.querySelector('#select-filter-type')
            .addEventListener('change', () => {
                var select = this.gui.querySelector('#select-filter-type').value;
                if(select==='6'){
                    this.gui.querySelector('#equals-area').style.display = 'none';
                    this.gui.querySelector('#in-range-area').style.display = 'block';
                }else{
                    this.gui.querySelector('#in-range-area').style.display = 'none';
                    this.gui.querySelector('#equals-area').style.display = 'block';
                }
            });

        // handle clear button event
        this.gui.querySelector('#clear-btn')
            .addEventListener('click', () => {
                this.filterIsActive = false;
                let field = this.params.colDef.field;
                let fieldNode = agGridInstance.getSearchedField(field)[0];
                let queryField = fieldNode.field;
                this.removeFilter(queryField);
                this.gui.querySelector(`#${idFilterInput}filter`).value = "";
                this.gui.querySelector(`#${idFilterInput}to`).value = "";
                this.gui.querySelector(`#${idFilterInput}from`).value = "";
                this.gui.querySelector('#select-filter-type').value = "0";
                this.gui.querySelector('#equals-area').style.display = 'block';
                this.gui.querySelector('#in-range-area').style.display = 'none';
                agGridInstance.paginateData(1);
            });

        // handle filter button event
        this.gui.querySelector('#filter-btn')
            .addEventListener('click', () => {
                this.filterIsActive = true;
                // lancement des recherche de filter column
                this.invokeFilter();
            });
    }

    filterType(num){
        switch (num) {
            case '0': return 'eq';
            case '1': return 'neq';
            case '2': return 'lt';
            case '3': return 'lte';
            case '4': return 'gt';
            case '5': return 'gte';
            case '6': return 'ir';

            default : return 'eq';
        }
    }

    /**
     * Run server side filtering based on the selected data
     */
    invokeFilter(){
        let field = this.params.colDef.field;
        let fieldNode = agGridInstance.getSearchedField(field)[0];
        let queryField = fieldNode.field;
        let array = [];
        let type = fieldNode.type;
        let idFilterInput = `${this.params.colDef.field}-`;

        var select = this.gui.querySelector('#select-filter-type').value;
        if(select === '6'){
            var from = this.gui.querySelector('#'+idFilterInput+'from').value;
            var to = this.gui.querySelector('#'+idFilterInput+'to').value;
            array.push({
                'filter': this.filterType(select),
                'value': {
                    'from': from,
                    'to': to
                }
            });
        }else{
            var value = this.gui.querySelector('#'+idFilterInput+'filter').value;
            array.push({
                'filter': this.filterType(select),
                'value': value
            });
        }

        if(this.filterExist(queryField) === false){
            agGridInstance.searchNode.columns.data.push({
                field : queryField,
                type: 'number',
                data: array
            });
        }else{
            this.removeFilter(queryField);
            agGridInstance.searchNode.columns.data.push({
                field : queryField,
                type: 'number',
                data: array
            });
        }
        this.hideFilter();
        if(array.length>0){
            agGridInstance.paginateData(1);
        }else{
            UIkit.modal.alert('(NB) : Vous devez selectionner au moin un valeur!');
        }
    }

    getTypeOfHtml(value){
        return typeof (value);
    }

    filterExist(field){
        for(let j in agGridInstance.searchNode.columns.data){
            if(agGridInstance.searchNode.columns.data[j].field === field ){
                return true;
            }
        }
        return false;
    }

    isFilterActive(){
        return this.filterIsActive;
    }

    removeFilter(field){
        for(let j in agGridInstance.searchNode.columns.data){
            if(agGridInstance.searchNode.columns.data[j].field === field ){
                agGridInstance.searchNode.columns.data.splice(j,1);
            }
        }
    }

    // The grid will ask each active filter, in turn, whether each row in the grid passes. If any
    // filter fails, then the row will be excluded from the final set. A params object is supplied
    // containing attributes of node (the rowNode the grid creates that wraps the data) and data (the data
    // object that you provided to the grid for that row).
    doesFilterPass(params){
        return true;
    }

    // Gets called when new rows are inserted into the grid. If the filter needs to change its
    // state after rows are loaded, it can do it here. For example the set filters uses this
    // to update the list of available values to select from (e.g. 'Ireland', 'UK' etc for
    // Country filter).
    onNewRowsLoaded(){
        console.log('new rows loaded');
    }

    getGui(){ return this.gui; }

    resetModel(){
        this.elementChecked(true, 'All');
    }

    getEntityField(field){
        if(field.toString().indexOf("+")>0){
            let list = field.toString().split('+');
            let l1 = list[0].split('.');
            let l2 = list[1].split('.');
            return [ l1[l1.length-1], l2[l2.length-1] ];
        }else{
            if(field.toString().indexOf(".")>0){
                let list = field.toString().split('.');
                return list[list.length -1].toString();
            }else{
                return field.toString();
            }
        }
    }

    /**
     * CSS style of the component
     * @return {string}
     */
    style = () => {
        return `
        .sbc-number-filter-container{
            width: 200px;
            padding: 5px;
        }
        
        .sbc-number-filter-container select{
            width: 100%;
            height: 30px;
            border-radius: 1px;
        }
        
        .sbc-number-filter-container .elements{
            border: solid 1px #ababab;
            margin-top: 5px;
            margin-bottom: 5px;
            height: fit-content;
            overflow: auto;
        }
        
        .sbc-number-filter-container input{
            width: 96%;
            margin: 1%;
            height: 20px;
            font-size: 15px;
        }
       
        .sbc-number-filter-container button{
            margin-right: 5px;
        }
    `;
    }
}