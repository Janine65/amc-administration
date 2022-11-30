//hotkeys - detach
//folders, getPath 
//callback - id, folder || getName, getPath


webix.i18n.selectDialog = {
	header:"Open File",
	open: "Open",
	cancel: "Cancel",
	name: "Name"
};

webix.protoUI({
	name:"select-dialog",
	$init:function(config){
		//we will store current state here
		this._folders = [];

		let locale = webix.i18n.selectDialog;

		//inner configuration
		let buttons = config.toolbar || [
			{},
			{ view:"button", value:locale.open, width:150,
				click:function(){ this.getTopParentView().select(); } },
			{ view:"button", value:locale.cancel, width:150,
				click:function(){ this.getTopParentView().exit(); } }
		];

		let cols = config.columns || [
			{ id:"type", header:"", template:"{common.dialog_icon()}", width:50 },
			{ id:"name", header:locale.name, fillspace:true }
		];

		config.body = config.body || {
			rows:[
				{	view:"template", id:"template", css:"webix_path",
					height:35, template:function(data){
						let html = "<span class='wbx_seldialog_icon webix_icon fa-level-up'></span>/";
						for(let i in data)
							html+="<span class='wbx_seldialog_folder' data-id='"+data[i].id+"'>"+data[i].name+"</span> / ";
						return html;
					}
				},
				{
					view:"datatable",
					id:"table",
					columns:cols,
					select:true,
					scrollX:false,
					navigation:true
				},
				{view:"toolbar", id:"toolbar", elements: buttons }
			]
		};

		config.head = config.head || locale.header;

		//attach event handlers to sub components
		this.$ready.push(this._after_init);

		this.attachEvent("onShow", this._on_show);
	},
	$onLoad:function(data, driver){
		data = driver.getRecords(data);
		this._on_data_load(data);
		return true;
	},
	_on_show:function(){
		webix.UIManager.setFocus(this.getDatatable());

		this._folders = [];
		this._showState();
	},
	_on_data_load:function(data){
		let dtable = this.getDatatable();

		dtable.$blockRender = true;
		dtable.parse(data);
		dtable.sort("#type#", "desc");
		dtable.$blockRender = false;

		this._showState();
	},
	show:function(){
		this._folders = [];
		webix.ui.window.prototype.show.apply(this, arguments);
	},
	_after_init:function(){
		let dtable = this.getDatatable();
		let tpl = this.getTemplate();
		
		tpl.define("onClick", {
			wbx_seldialog_icon : function(){
				this.getTopParentView()._levelUp();
			},
			wbx_seldialog_folder : function(a, b, el){
				this.getTopParentView()._levelUp(el.getAttribute("data-id"));
			}
		});
		tpl.refresh();

		dtable.type.dialog_icon = function(obj){
			if(obj.type=="folder")
				return "<div class='webix_tree_folder'></div>";
			else if(obj.type=="file")
				return "<div class='webix_tree_file'></div>";
		};

		//hot keys
		webix.UIManager.addHotKey("enter", function(view){
			if(view.getSelectedId()){
				view.getTopParentView().select(view);
				return false;
			}
		}, dtable);

		webix.UIManager.addHotKey("backspace", function(view){
			view.getTopParentView()._levelUp();
			return false;
		}, dtable);

		webix.UIManager.addHotKey("escape", function(view){
			let dialog = view.getTopParentView();
			if(dialog.isVisible())
				dialog.exit();
		}, dtable);

		dtable.attachEvent("onItemDblClick", function(id){
			this.getTopParentView().select(this);
		});

		dtable.attachEvent("onBeforeAdd",function(obj){
			obj.folder_id = this._folders.length ? this._folders[this._folders.length - 1]: 0;
		});

	},
	_showState:function(select_id){
		this.getTemplate().setValues(this._folders);
		let dtable = this.getDatatable();
		let pid = this._folders.length ? this._folders[this._folders.length - 1].id: 0;

		dtable.filter(function(obj){
			return obj.folder_id == pid;
		});
		if (select_id)
			dtable.select(select_id);
		else if (dtable.getFirstId())
			dtable.select(dtable.getFirstId());
	},
	_levelUp:function(to_folder){
		if (to_folder){
			for (let i = 0; i < this._folders.length; i++){
				if (this._folders[i].id == to_folder){
					this._folders.splice(i+1, this._folders.length - i - 1);
					this._showState();
					break;
				}
			}
		} else if (this._folders.length){
			let leaving = this._folders.pop();
			this._showState(leaving.id);
		}
	},
	exit:function(){
		this.config.onCancel.call(this); 
		this.hide();
	},
	select:function(){
		let view = this.getDatatable();
		let id = view.getSelectedId();
		if(id){
			if(view.getItem(id).type=="folder"){
				this._folders.push(view.getItem(id));
				this._showState();
			}
			else if(view.getItem(id).type=="file"){
				this._openFile(id);
			}
		}
	},
	_openFile:function(id){
		let item = this.getDatatable().getItem(id);

		let path = [];
		for (let key in this._folders)
			path.push(this._folders[key].name);
		path = "/"+path.join("/");
		
		this.callEvent("onItemOpen",[item.name, path, item, this._folders]);
		this.config.onOpen.call(this, item.name, path, item, this._folders);
		this.hide();
	},
	getDatatable:function(){
		return this.$$("table");
	},
	getTemplate:function(){
		return this.$$("template");
	}
}, webix.AtomDataLoader, webix.IdSpace, webix.ui.window);