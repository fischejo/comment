// ==UserScript==
// @name        comment
// @namespace   hagen-online-uebungssystem-comment
// @include     https://online-uebungssystem.fernuni-hagen.de/desel/KorrektorKorrekturAccessAufgabe/01613/*
// @description	Inserts a treeview of comments to Online Uebungssystem.
// @downloadURL	https://github.com/pecheur/jscomment/raw/master/comment.user.js
// @updateURL	https://github.com/pecheur/jscomment/raw/master/comment.user.js
// @version	1
// @grant	GM_addStyle
// @grant	GM_getResourceText
// @grant	GM_getResourceURL
// @grant	GM_setValue
// @grant	GM_getValue
// @grant	GM_setClipboard
// @grant	GM_openInTab
// @require https://cdnjs.cloudflare.com/ajax/libs/jquery/1.12.1/jquery.min.js
// @require https://cdnjs.cloudflare.com/ajax/libs/jstree/3.2.1/jstree.min.js
// @resource minstyle https://raw.githubusercontent.com/pecheur/jscomment/master/style.min.css
// @resource item https://github.com/pecheur/jscomment/blob/master/page_white.png?raw=true
// @resource folder https://github.com/pecheur/jscomment/blob/master/folder.png?raw=true
// @resource collection https://github.com/pecheur/jscomment/blob/master/page_white_stack.png?raw=true
// @resource pencil https://github.com/pecheur/jscomment/blob/master/pencil.png?raw=true
// @resource clipboard https://github.com/pecheur/jscomment/blob/master/paste_plain.png?raw=true 
// @resource dice https://github.com/pecheur/jscomment/blob/master/dice.png?raw=true
// @resource help https://github.com/pecheur/jscomment/blob/master/help.png?raw=true
// @resource richedit https://github.com/pecheur/jscomment/blob/master/richtext_editor.png?raw=true
// @resource add https://github.com/pecheur/jscomment/blob/master/add.png?raw=true
// @resource delete https://github.com/pecheur/jscomment/blob/master/delete.png?raw=true
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
	<button id="hkt_faq" style="float:right; height:22px;margin-right:5px;">FAQ</button>
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

// faq button
document.getElementById('hkt_faq').onclick = hkt_faq;
function hkt_faq() {
	GM_openInTab("https://github.com/pecheur/jscomment/blob/master/README.md");
};


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
	for(i = 0, j = obj.length; i < j; i++) {
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


// pasting logic
var pastein = [];
$('#hkt_tree').on("changed.jstree", function (e, data) {
	var i, j;
	pastein = [];

	// remove unselected
	for(var e in data.unselected) {
		var index = array.indexOf(e);
		if (index >= 0) {
			pastein.splice(index, 1);
        }
	}

    for(i = 0, j = data.selected.length; i < j; i++) {
		pastein.push(data.instance.get_node(data.selected[i]));
    }
});

function hkt_paste(obj) {
	var i,j,tmp = "";

	for(i = 0, j = obj.length; i < j; i++) {	
		tmp += obj[i].text + " ";
	}
	return tmp;
};


$('#hkt_tree').on('create_node.jstree', function (e, data) {
	if (data.node.type === "item") {
		update_collection( data.parent);
	}
	
	// backup
	GM_setValue("hkt_store", get_reduced_json());
})

$('#hkt_tree').on('rename_node.jstree', function (e, data) {
	if (data.node.type === "item") {
		update_collection( data.node.parent);
	}

	// backup
	GM_setValue("hkt_store", get_reduced_json());
})

$('#hkt_tree').on('delete_node.jstree', function (e, data) {
	if (data.node.type === "item") {
		update_collection( data.parent);
	}

	// backup
	GM_setValue("hkt_store", get_reduced_json());
})

$('#hkt_tree').on('move_node.jstree', function (e, data) {
	if (data.node.type === "item") {
		update_collection( data.parent);
		update_collection( data.old_parent);
	}

	// backup
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
			"themes" : {	
				"stripes" : true,
				'variant' : 'small',
				"dots": true,
				"icons": true

			}

		},
		"conditionalselect" : function (node, event) {
			return (node.type === 'item') || (node.type === 'collection');
		},
		"contextmenu": { 
			"show_at_node":false,
			"items": hkt_contextmenu
		},
		"dnd": {
                check_while_dragging: true
        },
		"types": {
			"#" : {
				"valid_children" : ["folder"]
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
		    }
		},
		"plugins" : [ "contextmenu", "dnd", "conditionalselect", "types", "search", "changed", "wholerow" ]

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
							inst.create_node(obj, {'text':'new Item', 'type':'item',}, "last", function (new_node) {
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

	

	if((node.type === "item") || (node.type === "collection")) {		
		$.extend(items, {
			"paste" : {
				"separator_before"	: false,
				"icon"				: GM_getResourceURL("richedit"),
				"separator_after"	: false,
				"label"				: "Paste",
				"action"			: function (data) {
					setTimeout(function () { 
						// sneaky hack
						var tm = (unsafeWindow.tinyMCE) ? unsafeWindow.tinyMCE : null;  
						if(tm!= null){
							tm.activeEditor.execCommand('mceInsertContent', false, hkt_paste(pastein));
						}
						
					});
				}
			},
			"clip" : {
				"separator_before"	: false,
				"icon"				: GM_getResourceURL("clipboard"),
				"separator_after"	: true,
				"label"				: "Copy to Clipboard",
				"_disabled"			: false,
				"action"			: function (data) {
					setTimeout(function () {
						GM_setClipboard( hkt_paste(pastein))
					});
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
	
    return items;
}
