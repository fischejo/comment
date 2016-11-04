// ==UserScript==
// @name        comment
// @namespace   hagen-online-uebungssystem-comment
// @include     https://online-uebungssystem.fernuni-hagen.de/desel/KorrektorKorrekturAccessAufgabe/01613/*
// @description	Inserts a treeview of comments to Online Uebungssystem.
// @downloadURL	https://github.com/pecheur/comment/raw/usability/comment.user.js
// @updateURL	https://github.com/pecheur/comment/raw/usability/comment.user.js
// @version	2
// @grant	GM_addStyle
// @grant	GM_getResourceText
// @grant	GM_getResourceURL
// @grant	GM_setValue
// @grant	GM_getValue
// @grant	GM_setClipboard
// @grant	GM_openInTab
// @require https://cdnjs.cloudflare.com/ajax/libs/jquery/1.12.1/jquery.min.js
// @require https://cdnjs.cloudflare.com/ajax/libs/jstree/3.2.1/jstree.min.js
// @resource minstyle https://raw.githubusercontent.com/pecheur/comment/master/style.min.css
// @resource item https://github.com/pecheur/comment/blob/master/page_white.png?raw=true
// @resource folder_add https://github.com/pecheur/comment/raw/usability/folder_add.png
// @resource folder https://github.com/pecheur/comment/blob/master/folder.png?raw=true
// @resource collection https://github.com/pecheur/comment/blob/master/page_white_stack.png?raw=true
// @resource pencil https://github.com/pecheur/comment/blob/master/pencil.png?raw=true
// @resource dice https://github.com/pecheur/comment/blob/master/dice.png?raw=true
// @resource help https://github.com/pecheur/comment/blob/master/help.png?raw=true
// @resource add https://github.com/pecheur/comment/blob/master/add.png?raw=true
// @resource delete https://github.com/pecheur/comment/blob/master/delete.png?raw=true
// ==/UserScript==




// ============================================================================
//	Support
// ============================================================================
// Only run in iframe.
if (window.top == window.self)  //don't run on the top window
    return;


// Check for the various File API support.
if (window.File && window.FileReader && window.FileList && window.Blob) {
  // Great success! All the File APIs are supported.
} else {
  alert('The File APIs are not fully supported in this browser.');
}


// ============================================================================
//	CSS/Style
// ============================================================================

// tree style
var cssTree  = GM_getResourceText ("minstyle");
GM_addStyle (cssTree);

// li, lu style overwrite
var cssInformation = `
#information ul, #information ol{
  margin:0em 0 0em 0em;
  line-height:0.5em;
  padding-left:1.4em;
}

#information ul{
  list-style:none;
}

#information li{
  background:none ;
  padding-left:0px;
  margin:0em 0;
}
`;
GM_addStyle( cssInformation);

var cssContextMenu = `
.vakata-context, .vakata-context ul {
	font-size: 13px;
}
`;
GM_addStyle( cssContextMenu);

		


// ============================================================================
//  HTML
// ============================================================================


// add html code
var content = document.createElement('div');
content.innerHTML = `
<!--bar-->
<div style="min-height:i22px;">
	<button id="hkt_add" type="button" style="float:left; height:22px; margin-right:5px;" class="btn btn-success btn-sm">Add Folder</button>
	<button id="hkt_save" style="float:left; height:22px;margin-right:5px;">Save</button>
	<input id='hkt_open' type='file' accept='application/json' style='float:left;height: 22px;'>
	
	<div style="float:right;">
		<input id="hkt_search" placeholder="Search"  value="" class="input" style="margin:0em auto 1em auto; display:block; padding:4px; border:1px solid silver; height:12px;float:right;" type="text"/>
	</div>
</div>

<!--tree-->
<div style="overflow:auto; width:100%; height:60vh; border:1px solid #ccc; backgroundColor: #f5f5f5; margin: 0em 0 0em 0; margin-bottom:10px;">
	<div id="hkt_tree"></div>
</div>
`;

var collection = document.getElementsByName("KorrektorKommentar0")[0];
collection.parentNode.insertBefore(content, collection.previousSibling);

// ============================================================================
//  JS
// ============================================================================


// open file
document.getElementById('hkt_open').addEventListener('change', hkt_open, false); 
function hkt_open(evt) {
    var files = evt.target.files;
    var file = files[0];           
    var reader = new FileReader();

    reader.onload = function() {	
		var inst = $("#hkt_tree").jstree(true);
		var root = inst.get_node("#");
		var i,j;
		
		// delete all root children
		inst.delete_node(root.children);

		// add new nodes to root
		var nodes = JSON.parse(this.result);
		for(i = 0, j = nodes.length; i < j; i++) {
			inst.create_node(root, nodes[i],"last", function(node) {
				// dice all collections
				var n,m;
				for(n = 0, m = node.children.length; n < m; n++) {
					update_collection(node.children[n]);
				}
			});
		}

		// backup
		GM_setValue("hkt_store", get_reduced_json());
	}
    reader.readAsText(file);
};


// save file
document.getElementById('hkt_save').onclick = hkt_save;
function hkt_save() {
	var blob = new Blob([get_reduced_json()], {type : 'application/json'}); // the blo
	window.open(URL.createObjectURL(blob));
};


function get_reduced_json() {	
	var obj = $('#hkt_tree').jstree(true).get_json();

	var tmp = [],i,j;
	// obj.length -1 because the last node is add-button
	for(i = 0, j = obj.length-1; i < j; i++) {
		tmp.push({
			'text' : obj[i].text,
			'state' : obj[i].state,
			'children' : reduce_json(obj[i].children),
			'type' : obj[i].type
		});
	}

	return JSON.stringify(tmp);
}


// Workaround for get_json(null, {no_id}), which doesn't work...
function reduce_json(obj) {
	var tmp = [],i,j;
	for(i = 0, j = obj.length; i < j; i++) {
		tmp.push({
			'text' : obj[i].text,
			'state' : obj[i].state,
			'children' : reduce_json(obj[i].children),
			'type' : obj[i].type
		});
	}
	return tmp;
};

// create add-folder button
$('#hkt_add').click(function(){
	var inst = $("#hkt_tree").jstree(true),
	obj = inst.get_node("#");
	inst.create_node(obj, {'text':'new Group', 'type':'folder', 'state':{"opened": true}}, "last", function (new_node) {
		setTimeout(function () { inst.edit(new_node); },0);
	});
	
});


// search 
var to = false;
$('#hkt_search').keyup(function () {
    if(to) { clearTimeout(to); }
    to = setTimeout(function () {
      var v = $('#hkt_search').val();
      $('#hkt_tree').jstree(true).search(v);
    }, 250);
});


// select_node
$('#hkt_tree').on("select_node.jstree", function (e, data) {
	if(data.node.type === 'add') {
		var inst = $("#hkt_tree").jstree(true),
		obj = inst.get_node("#");

		inst.create_node(obj, {'text':'new Group', 'type':'folder', 'state':{"opened": true}}, obj.children.length-1, function (new_node) {
			setTimeout(function () { inst.edit(new_node); },0);
		});

	} else {


		if(data.event.ctrlKey) {
			var tm = (unsafeWindow.tinyMCE) ? unsafeWindow.tinyMCE : null;  
			if(tm!= null){
				var i, j, r = [];
				for(i = 0, j = data.selected.length; i < j; i++) {
					r.push(data.instance.get_node(data.selected[i]).text);
				}	
				// using spans comes with a alot of draw backs...
				//tm.activeEditor.execCommand('mceInsertContent', false,'<span id="hagen">'+ r.join(' ') + '</span>');
				tm.activeEditor.execCommand('mceInsertContent', false, r.join(' '));
	
			}
		}
	}
	$('#hkt_tree').jstree(true).deselect_node(data.node);

});

/*
 * move to span branch later on...
$('#hkt_tree').on("deselect_node.jstree", function (e, data) {
	
	if(data.event.ctrlKey) {

		var tm = (unsafeWindow.tinyMCE) ? unsafeWindow.tinyMCE : null;  
		if(tm!= null){
			var id = $("#
			tm.activeEditor.execCommand('mceRemoveNode', false,'<span id="hagen">'+ r.join(' ') + '</span>');
		}
	}
});
*/

// backup after changes
$('#hkt_tree').on('create_node.jstree', function (e, data) {
	if (data.node.type === "item") {
		update_collection( data.parent);
	}

	GM_setValue("hkt_store", get_reduced_json());
})

$('#hkt_tree').on('rename_node.jstree', function (e, data) {
	if (data.node.type === "item") {
		update_collection( data.node.parent);
	}

	GM_setValue("hkt_store", get_reduced_json());
})

$('#hkt_tree').on('delete_node.jstree', function (e, data) {
	if (data.node.type === "item") {
		update_collection( data.parent);
	}

	GM_setValue("hkt_store", get_reduced_json());
})

$('#hkt_tree').on('move_node.jstree', function (e, data) {
	if (data.node.type === "item") {
		update_collection( data.parent);
		update_collection( data.old_parent);
	}

	GM_setValue("hkt_store", get_reduced_json());

})


function update_collection(parent_id) {
	var inst = $('#hkt_tree').jstree(true);
	var parent = inst.get_node(parent_id);

	if (parent.type === "collection") {
		if (parent.children.length > 0) {
			var n = Math.floor((Math.random() * parent.children.length));
			inst.rename_node(parent, inst.get_node(parent.children[n]).text);
		} else {
			inst.rename_node(parent, "");
		}
	}
}



// tree
$('#hkt_tree').jstree({
		"core": { 
			'data' : false,	
			"animation" : false,
			'check_callback': true,
			"multiple" : false,
			"themes" : {	
				"stripes" : true,
				'variant' : 'small',
				"dots": true,
				"icons": true
			}
		},
		"conditionalselect" : function (node, event) {
			return (node.type === 'item') || (node.type === 'collection') || (node.type === 'add');
		},
		"contextmenu": { 
			"show_at_node":false,
			"select_node":false,
			"items": hkt_contextmenu
		},
		"dnd": {
                check_while_dragging: true,
				"copy" : false,
				"use_html5":true
        },
		"types": {
			"#" : {
				"valid_children" : ["folder", "add"]
		    },
			"item" : {
				"icon" : GM_getResourceURL("item"),
				"valid_children" : [ ]

		    },
		    "folder" : {
		        "icon" : GM_getResourceURL("folder"),
				"valid_children" : [ "item", "collection" ]
		    },
			"collection" : {
		        "icon" : GM_getResourceURL("collection"),
				"valid_children" : [ "item" ]
		    },
			"add" : {
				"icon" : GM_getResourceURL("folder_add"),
				"valid_children" : [ ]
			}
		},
		"plugins" : [ "contextmenu", "dnd", "conditionalselect", "types", "search" , "wholerow" ]

});


// load backup
var inst = $("#hkt_tree").jstree(true);
var obj = inst.get_node("#");
var nodes = JSON.parse(GM_getValue("hkt_store","[]"));
var i,j;	
for(i = 0, j = nodes.length; i < j; i++) {
	// add folder
	inst.create_node(obj, nodes[i], "last", function(node) {
		// dice all collections
		var n,m;
		for(n = 0, m = node.children.length; n < m; n++) {
			update_collection(node.children[n]);
		}
	});
}

// add add-folder
inst.create_node(obj, {'text':'Ordner hinzufügen', 'type':'add'}, "last");



// ============================================================================
//	Context-Menu
// ============================================================================


function hkt_contextmenu(node)
{
    var items = {}

	// Items and collections are possible in folders & collections
	if(node.type === "collection") {
		$.extend(items, {
			"add" : {
				"separator_before"	: false,	
				"separator_after"	: true,
				"label"				: "Add",
				"action"			: false,
				"icon"				: GM_getResourceURL("add"),
				"submenu" : {
					'item' : {
    	    		    'label' : 'Item',
						'icon'	:	GM_getResourceURL("item"),
    	    		    'action' : function (data) {
						
							var inst = $.jstree.reference(data.reference),
							obj = inst.get_node(data.reference);
							inst.create_node(obj, {'text':'new Item', 'type':'item'}, "last", function (new_node) {
								setTimeout(function () { inst.edit(new_node); },0);
							});
						}
					}
				}
			},
			"dice" : {
				"separator_before"	: false,
				"icon"				: GM_getResourceURL("dice"),
				"separator_after"	: true,
				"label"				: "Dice",
				"action"			: function (data) {
					update_collection(data.reference);					
				}
			}
		});
    }	

	if(node.type === "folder") {
		$.extend(items, {
			"add" : {
				"separator_before"	: false,
				"icon"				: GM_getResourceURL("add"),
				"separator_after"	: true,
				"label"				: "Add",
				"action"			: false,
				"submenu" : {
					'item' : {
    	    		    'label' : 'Item',
						'icon'	: GM_getResourceURL("item"),
    	    		    'action' : function (data) {
							var inst = $.jstree.reference(data.reference),
							obj = inst.get_node(data.reference);
							inst.create_node(obj, {'text':'new Item', 'type':'item',}, "last", function (new_node) {
								setTimeout(function () { inst.edit(new_node); },0);
							});

						}
					},
					'collection' : {
    	    		    'label' : 'Collection',
						'icon'	: GM_getResourceURL("collection"),
    	    		    'action' : function (data) {
							var inst = $.jstree.reference(data.reference),
							obj = inst.get_node(data.reference);
							inst.create_node(obj, {'text':'', 'type':'collection'});
						}
					}
				}
			}
		});
    }	

	if((node.type === "item") || (node.type === "folder")) {
		$.extend(items, {
			"rename" : {
				"separator_before"	: false,
				"separator_after"	: false,
				"_disabled"			: false,
				"icon"				: GM_getResourceURL("pencil"), 
				"label"				: "Edit",
				"action"			: function (data) {
					var inst = $.jstree.reference(data.reference),
						obj = inst.get_node(data.reference);
					inst.edit(obj);
				}
			}
		});
	}


	// every node can be renamed and removed.
	if(node.type !== "add") {

		$.extend(items, {
			"remove" : {
				"separator_before"	: true,
				"icon"				: GM_getResourceURL("delete"),
				"separator_after"	: false,
				"_disabled"			: false, 
				"label"				: "Delete",
				"action"			: function (data) {
					var inst = $.jstree.reference(data.reference),
						obj = inst.get_node(data.reference);
					if(inst.is_selected(obj)) {
						inst.delete_node(inst.get_selected());
					}
					else {
						inst.delete_node(obj);
					}
				}
			}
		});
	}	
    return items;
}
