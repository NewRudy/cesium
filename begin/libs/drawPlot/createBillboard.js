var CreateBillboard = function(viewer, style) {
	this.objId = Number((new Date()).getTime() + "" + Number(Math.random() * 1000).toFixed(0));
	this.viewer = viewer;
	this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
	this.modifyHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
	this.state = 0; //1为新增 2为编辑 0为清除
	this.image = style.image || "content/images/map3d/mark1.png";
	this.style = style;
	this.billboardArg = {};
	this.billboard = null;
	if (style) {
		var haveImage = false;
		for (var i in style) {
			if (i == "image" && style[i]) {
				haveImage = true;
			}
			if (style[i]) this.billboardArg[i] = style[i];
		}
	} else {
		console.warn("未设置billboard的参数！");
		return;
	}
	this.prompt = new MovePrompt(viewer);
}
CreateBillboard.prototype = {
	start: function(callBack) {
		var that = this;
		this.handler.setInputAction(function(evt) { //单机开始绘制
			var cartesian = that.getCatesian3FromPX(evt.position, that.viewer,[]);
			that.billboard = that.createBillboard(cartesian);
			that.state = 1;
			that.handler.destroy();
			if (that.prompt) {
				that.prompt.destroy();
				that.prompt = null;
			}
			if (callBack) callBack(that.billboard);
		}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
		this.handler.setInputAction(function(evt) { //单机开始绘制
			that.prompt.updatePrompt(evt.endPosition, "单击新增");
		}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
	},
	createByPositions: function(lnglatArr, callBack) { 
		if (!lnglatArr) return;
		var position = Cesium.Cartesian3.fromDegrees(lnglatArr[0], lnglatArr[1],lnglatArr[2]);
		if (!position) return;
		this.billboard = this.createBillboard(position);
		callBack(this.billboard);
		this.state = 1;
	},
	openModify: false,
	startModify: function() {
		if (this.state != 2 && this.state != 1) return; //表示还没绘制完成
		if (!this.modifyHandler) this.modifyHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
		var that = this;
		this.modifyHandler.setInputAction(function(evt) {

			var pick = that.viewer.scene.pick(evt.position);
			if (Cesium.defined(pick) && pick.id) {
				if (!pick.id.objId)
					that.forbidDrawWorld(true);
				that.openModify = true;
				that.forbidDrawWorld(true);
				that.state = 2;
			} else {
				//if(that.modifyPrompt) that.modifyPrompt.destroy();
			}

		}, Cesium.ScreenSpaceEventType.LEFT_DOWN);
		this.modifyHandler.setInputAction(function(evt) { //移动时绘制线
			if (!that.billboard || !that.openModify) return;
			var cartesian = that.getCatesian3FromPX(evt.endPosition, that.viewer,[]);
			if (that.billboard) {
				//that.modifyPrompt.updatePrompt(evt.endPosition, "鼠标拖动修改");
				that.billboard.position.setValue(cartesian);
			}
		}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

		this.modifyHandler.setInputAction(function(evt) { //移动时绘制线
			if (!that.billboard || !that.openModify) return;
			that.openModify = false;
			that.forbidDrawWorld(false);
			if (that.modifyHandler) {
				that.modifyHandler.destroy();
				that.modifyHandler = null;
			}
		}, Cesium.ScreenSpaceEventType.LEFT_UP);
	},
	endModify:function(callback){
        if (this.modifyHandler) {
            this.modifyHandler.destroy();
            this.modifyHandler = null;
            if (callback) callback(this.billboard);
        }
        this.state = 2;
	},
	createBillboard: function(cartesian) {
		if (!cartesian) return;
		var billboard = viewer.entities.add({
			position: cartesian,
			billboard: {
				image: this.image || "../img/mark4.png",
				heightReference: this.style.heightReference || Cesium.HeightReference.NONE,
				disableDepthTestDistance:Number.MAX_VALUE
			}
		})
		billboard.objId = this.objId;
		return billboard;
	},
	getPositions: function() {
		return this.billboard.position;
	},
	setStyle: function(obj) {},
	remove: function() {
		if (this.billboard) {
			this.state = 0;
			this.viewer.entities.remove(this.billboard);
			this.billboard = null;
		}
	},
	setVisible: function(vis) {
		this.billboard.show = vis;
	},
	forbidDrawWorld: function(isForbid) {
		this.viewer.scene.screenSpaceCameraController.enableRotate = !isForbid;
		this.viewer.scene.screenSpaceCameraController.enableTilt = !isForbid;
		this.viewer.scene.screenSpaceCameraController.enableTranslate = !isForbid;
		this.viewer.scene.screenSpaceCameraController.enableInputs = !isForbid;
	},
	destroy: function() {
		this.openModify = false;
		if (this.handler) {
			this.handler.destroy();
			this.handler = null;
		}
		if (this.modifyHandler) {
			this.modifyHandler.destroy();
			this.modifyHandler = null;
		}
		if (this.billboard) {
			this.viewer.entities.remove(this.billboard);
			this.billboard = null;
		}
		this.style = null;
		if (this.prompt) {
			that.prompt.destroy();
			this.prompt = null;
		}
	},
	getCatesian3FromPX: function (px, viewer, entitys) {
        var picks = viewer.scene.drillPick(px); 
        this.viewer.scene.render();
        var cartesian;
        var isOn3dtiles = false;
		for (var i = 0; i < picks.length; i++) {
			var isContinue = false;
			for (var step = 0; step < entitys.length; step++) {
				if (entitys[step] && picks[i].id && entitys[step].objId == picks[i].id.objId) {
					isContinue = true;
					break;
				}
			}
			if (isContinue) continue;
			if ((picks[i] && picks[i].primitive) || picks[i] instanceof Cesium.Cesium3DTileFeature) { //模型上拾取
				isOn3dtiles = true;
			}
		}
        if (isOn3dtiles) {
            cartesian = viewer.scene.pickPosition(px);
        } else {
            var ray = viewer.camera.getPickRay(px);
            if (!ray) return null;
            cartesian = viewer.scene.globe.pick(ray, viewer.scene);
        }
        return cartesian;
    }
}
