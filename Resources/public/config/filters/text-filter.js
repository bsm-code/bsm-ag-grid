/**
 * Custom text filter for ag-grid
 * @author Slimen Arnaout <arnaout.slimen@gmail.com>
 */
class SBCTextFilter {

    elements = [];
    filtered = [];
    selected = [];
    data = [];
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
            this.elementChecked(true,'All');
            this.gui.querySelector('#select-all-checkbox').checked = true;
        }
    }

    /**
     * Prepare the UI
     * @param params
     */
    setupGui(params){
        this.params = params;
        let idFilterInput = `${params.colDef.field}-filter-input`;

        this.gui = document.createElement('div');
        this.gui.classList.add('sbc-text-filter-container');
        this.gui.innerHTML = `
            <div>
                <input id="${idFilterInput}" type="text" placeholder="Recherche...">
            </div>
            <div class="all-checkbox-container">
                <label>
                    <input id="select-all-checkbox" type="checkbox"> 
                    Tout sélectionner
                </label>
            </div>
            <div class="elements">
                <!--========== filtered elements goes here =========-->
            </div>
            <div>
                <button id="clear-btn">Vider</button>
                <button id="filter-btn">Filtrer</button>
            </div>
        `;

        // run first search with empty string
        this.loadDistinctFromDB();

        // handle search field changes
        this.gui.querySelector(`#${idFilterInput}`)
            .addEventListener("keyup", ($event) => {
                this.filterInElements($event.target.value);
            });

        // handle "select all checkbox" changes
        this.gui.querySelector('#select-all-checkbox')
            .addEventListener('click', (elem) => {
                this.elementChecked(elem.target.checked, 'All');
            });

        // handle clear button event
        this.gui.querySelector('#clear-btn')
            .addEventListener('click', () => {
                this.filterIsActive = false;
                this.elementChecked(true, 'All');
                this.gui.querySelector(`#${idFilterInput}`).value = "";
                this.filterInElements("");
                let field = this.params.colDef.field;
                let fieldNode = agGridInstance.getSearchedField(field)[0];
                let queryField = fieldNode.field;
                this.removeFilter(queryField);
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

    /**
     * Run server side filtering based on the selected data
     */
    invokeFilter(){
        let field = this.params.colDef.field;
        let fieldNode = agGridInstance.getSearchedField(field)[0];
        let queryField = fieldNode.field;
        let array = [];
        let type = fieldNode.type;
        if(type === 'html' ){
            let stype = this.getTypeOfHtml(this.data[0].value);
            if(stype !== 'boolean'){
                type = 'string';
            }else{
                type = stype;
            }
        }
        console.clear();
        console.log(this.data);
        console.log(this.elements);
        if(type === "boolean"){
            for(let j=0; j<this.data.length; j++){
                if(this.selected.includes(this.data[j].formatted)){
                    if(this.data[j].value === true)
                        array.push('1');
                    else {
                        if(this.data[j].value === false) array.push('0');
                        else array.push(this.data[j].value);
                    }
                }
            }
            if(this.filterExist(queryField) === false){
                agGridInstance.searchNode.columns.data.push({
                    field : queryField,
                    type: type,
                    data: array
                });
            }else{
                this.removeFilter(queryField);
                agGridInstance.searchNode.columns.data.push({
                    field : queryField,
                    type: type,
                    data: array
                });
            }
        }else{
            var stype = this.getTypeOfHtml(this.data[0].value);
            for(let j=0; j<this.data.length; j++){
                console.log(this.data[j]);
                if(this.selected.includes(String(this.data[j].formatted))){
                    if(stype !== 'boolean'){
                        array.push(String(this.data[j].value));
                    }else{
                        (this.data[j].value === true) ?
                            array.push('1') : (this.data[j].value === false) ? array.push('0') : array.push('null');
                    }
                }
            }
            if(this.filterExist(queryField) === false){
                agGridInstance.searchNode.columns.data.push({
                    field : queryField,
                    type: type,
                    data: array,
                    stype: stype
                });
            }else{
                this.removeFilter(queryField);
                agGridInstance.searchNode.columns.data.push({
                    field : queryField,
                    type: type,
                    data: array,
                    stype: stype
                });
            }
        }

        this.hideFilter();
        if(array.length>0){
            agGridInstance.paginateData(1);
        }else{
            UIkit.modal.alert('(NB) : Vous devez selectionner au moin un valeur!');
        }
    }

    getTypeOfHtml(value){
        return (value!= 'null') ? typeof (value) : 'boolean';
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
     * Used when component first initialized to load all distinct values of this field
     * Invoked when the gui is created
     */
    loadDistinctFromDB(){
        this.gui.querySelector('.elements').innerHTML = '<div style="text-align: center; padding: 10px">Chargement...</div>'
        let path = url_filter_Column;
        let entity = this.params.extraFilterParams.entity;
        let bundle = this.params.extraFilterParams.bundle;
        let fieldName = this.params.colDef.field;
        let fieldNode = agGridInstance.getSearchedField(fieldName)[0];

        let field = fieldNode.field;

        if(fieldNode.type === "entity"){
            let fieldChild = this.getEntityField(field);
            this.elements = this.data = [];
            if(Array.isArray(fieldChild)){
                fetch(path, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({entity, bundle, field, type: "entity"})
                })
                    .then((response) => response.json())
                    .then((data) => {
                        this.elements = data.map(o => {
                            if(o[fieldChild[0]+'0']!== null) return agGridInstance.getFormatter(fieldName,o[fieldChild[0]+'0']);
                            else return agGridInstance.getFormatter(fieldName,o[fieldChild[1]+'1']);
                        }).filter(a => a!== null);

                        this.data = data.map(function(o) {
                            return (o[fieldChild[0]+'0']!== null) ? {
                                value: o[fieldChild[0]+'0'],
                                formatted: agGridInstance.getFormatter(fieldName,o[fieldChild[0]+'0'])
                            }: {
                                value: o[fieldChild[1]+'1'],
                                formatted: agGridInstance.getFormatter(fieldName,o[fieldChild[1]+'1'])
                            }})
                            .filter(a => typeof (a.value)!=='undefined');
                        this.filtered = [...this.elements];
                        this.selected = [...this.filtered];

                        this.buildElementsList();
                        this.handleSelectAllCheckbox();
                    });
            }else{
                fetch(path, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({entity, bundle, field, type: "entity"})
                })
                    .then((response) => response.json())
                    .then((data) => {
                        this.elements = data.map(o => agGridInstance.getFormatter(fieldName,o[fieldChild])).filter(a => a!== null);
                        this.data = data.map(function(o){
                            if(o[fieldChild]!= null){
                                return {value: o[fieldChild],formatted: agGridInstance.getFormatter(fieldName,o[fieldChild]) }
                            }else return {value: 'null',formatted: agGridInstance.getFormatter(fieldName,o[fieldChild]) }
                        });
                        this.filtered = [...this.elements];
                        this.selected = [...this.filtered];
                        console.log('--- dats s  s');
                        console.log(this.data);
                        console.log(this.elements);
                        this.buildElementsList();
                        this.handleSelectAllCheckbox();
                    });
            }
        }else{
            if(fieldNode.type === 'html'){
                fetch(path, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({entity, bundle, field, type: "text"})
                })
                    .then((response) => response.json())
                    .then((data) => {
                        this.elements = data.map(o => agGridInstance.getFormatter(fieldName,o[field])).filter( onlyUnique );
                        this.data = data.map(
                            function(o){
                                if(o[field] != null){
                                    return {value: o[field],formatted: agGridInstance.getFormatter(fieldName,o[field]) }
                                } else{
                                    return {value: 'null',formatted: agGridInstance.getFormatter(fieldName,o[field]) }
                                }
                            }
                            ).filter(a => typeof (a.value)!=='undefined').filter( onlyUnique );
                        this.filtered = [...this.elements];
                        this.selected = [...this.filtered];
                        this.buildElementsList();
                        this.handleSelectAllCheckbox();
                    });
            }else{
                fetch(path, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({entity, bundle, field, type: "text"})
                })
                    .then((response) => response.json())
                    .then((data) => {
                        if(fieldNode.type === 'choice'){
                            this.elements = data.map((o) =>
                                fieldNode.choices[parseInt(o[field],10) -1]).filter(a => a!== null)
                            .filter( onlyUnique );
                            this.data = data.map(function(o){
                                if(typeof (o[field]) !== 'undefined')
                                    return {value: o[field],formatted: fieldNode.choices[parseInt(o[field],10) -1]}
                            }).filter(a => typeof (a.value)!=='undefined').filter( onlyUnique );;
                        }else{
                            this.data = data.map(function(o){
                                if(typeof (o[field]) !== 'undefined') {
                                    if(typeof (o[field]) !== 'number'){
                                        return {value: o[field],formatted: agGridInstance.getFormatter(fieldName,o[field]) }
                                    }else{
                                        var valueData = o[field].toFixed(7);
                                        return {value: valueData,formatted: agGridInstance.getFormatter(fieldName,valueData) }
                                    }
                                }
                            }).filter(a => typeof (a.value)!=='undefined').filter( onlyUnique );;
                            this.elements = data.map(o =>
                                    agGridInstance.getFormatter(fieldName,o[field])).filter(a => a!== null).filter( onlyUnique );;
                        }
                        console.log('elements');
                        console.log(this.elements);
                        console.log('data');
                        console.log(this.data);
                        this.filtered = [...this.elements];
                        this.selected = [...this.filtered];

                        this.buildElementsList();
                        this.handleSelectAllCheckbox();
                    });
            }
        }
    }

    /**
     * Filter in the list of available elements
     * Invoked after loadDistinctFromDB() when user type in the search field
     *
     * @param value (user input)
     */
    filterInElements(value){
        this.filtered = this.elements.filter(x => String(x).toLowerCase().indexOf(value.toLowerCase()) !== -1);
        this.selected = [...this.filtered];
        this.buildElementsList();
        this.handleSelectAllCheckbox();
    }

    /**
     * Build the list elements (when initialized or filtered)
     */
    buildElementsList(){
        let view = '';
        this.filtered.forEach((element) => {
            view += `
                <div>
                    <label>
                        <input 
                            type="checkbox" 
                            class="element-checkbox"
                            value="${element}" 
                            ${(this.selected.includes(element)) ? 'checked' : null}> 
                        ${element}
                    </label>
                </div>
            `;
        });

        // update the view
        this.gui.querySelector('.elements').innerHTML = view;

        // make sure to add listener to newly created DOMs
        this.gui.querySelectorAll('.element-checkbox').forEach((elem) => {
            elem.addEventListener('click', (e) => {
                this.elementChecked(e.target.checked, e.target.value);
            })
        });
    }

    /**
     * Handle checkbox click event
     * @param checked (status: checked or not)
     * @param value (value if the checkbox)
     */
    elementChecked(checked, value){
        if(value === 'All'){
            this.gui.querySelector('#select-all-checkbox').checked = true;
            this.selected = (checked) ? [...this.filtered] : [];
            // update checkboxes with the new value
            this.gui.querySelectorAll('.element-checkbox').forEach((elem) => {
                elem.checked = checked;
            });
        }else{
            if(checked) this.selected.push(value);
            else this.selected.splice(this.selected.indexOf(value), 1);
            this.handleSelectAllCheckbox();
        }
    }

    /**
     * Handle the "select all checkbox" (selected or not) based on the selected and filtered elements
     */
    handleSelectAllCheckbox(){
        this.gui.querySelector('#select-all-checkbox').checked = (this.selected.length === this.filtered.length);
    }

    /**
     * CSS style of the component
     * @return {string}
     */
    style = () => {
        return `
        .sbc-text-filter-container{
            width: 200px;
            padding: 5px;
        }
        
        .sbc-text-filter-container input{
            width: 96%;
        }
        
        .sbc-text-filter-container .all-checkbox-container{
            margin-top: 5px;
        }
        
        .sbc-text-filter-container .elements{
            border: solid 1px #ababab;
            margin-top: 5px;
            margin-bottom: 5px;
            height: 150px;
            overflow: auto;
        }
        
        .sbc-text-filter-container input[type=checkbox]{
            opacity: 1;
            position: unset;
            width: auto;
            vertical-align: middle;
        }
        
        .sbc-text-filter-container label{
            color: #8d8d8d;
            font-size: 11px;
            white-space: nowrap;
        }
        
        .sbc-text-filter-container button{
            margin-right: 5px;
        }
    `;
    }
}