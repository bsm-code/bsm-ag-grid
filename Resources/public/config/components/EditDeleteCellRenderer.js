function EditDeleteCellRenderer() {
}

// editDeletecomponent init
// init method gets the details of the cell to be renderer
EditDeleteCellRenderer.prototype.init = function(params) {

    var field = params.value.id;
    var id = params.data[field];
    var activateDelete = (params.value.activeDeleteButton !== undefined) ? ((params.value.activeDeleteButton !== null) ? params.value.activeDeleteButton : true) : true;
    this.eGui = document.createElement('span');

    /**  edit button  node creation */
    var path_ed = params.value.edit;
    var indexPa = params.value.index;
    var type = (params.value.type != null) ? params.value.type : "marque";
    path_ed = path_ed.replace("_code",id);

    /**  delete button  node creation */
    //var del = id.toString();

    if(activateDelete === true){
        this.eGui.innerHTML = `<a href="${path_ed}"><i class='material-icons md-24'>edit</i></a>
                           <a href='#' onclick='deleteFunction("${id}","${indexPa}");'>
                                <i class='material-icons md-24'>delete</i></a>`;
    }else{
        this.eGui.innerHTML = `<a href="${path_ed}"><i class='material-icons md-24'>edit</i></a>`;
    }

    this.eGui.style.textAlign = 'center';
    this.eGui.style.cssFloat = 'left';
    this.eGui.style.margin = 'auto';
    this.eGui.style.width = '100%';
};

/**
 * function that return the dom element rendered
 * @return {HTMLElement | *}
 */
EditDeleteCellRenderer.prototype.getGui = function() {
    return this.eGui;
};

/**************************************************/
/*
=============== Show Edit Delete Cell Render
*/
/**************************************************/

function ShowEditDeleteCellRenderer(){}

ShowEditDeleteCellRenderer.prototype.init = function(params){
    var field = params.value.id;
    var id = params.data[field];
    this.eGui = document.createElement('span');
    /**  edit delete show buttons  nodes creation */
    var path_ed = params.value.edit;
    var indexPa = params.value.index;
    var show_path = params.value.show;

    var type = (params.value.type != null) ? params.value.type : "marque";
    path_ed = path_ed.replace("_code",id);
    show_path = show_path.replace("_code",id);

    /**  delete button  node creation */
    //var del = id.toString();
    this.eGui.innerHTML = `<a href="${show_path}"><i class='material-icons md-24'>visibility</i></a>
                        <a href="${path_ed}"><i class='material-icons md-24'>edit</i></a>
                       <a href='#' onclick='deleteFunction("${id}","${indexPa}","${type}");'>
                            <i class='material-icons md-24'>delete</i></a>`;
    this.eGui.style.textAlign = 'center';
    this.eGui.style.cssFloat = 'left';
    this.eGui.style.margin = 'auto';
    this.eGui.style.width = '100%';
}

ShowEditDeleteCellRenderer.prototype.getGui = function(){
    return this.eGui;
};