var CreatePolygon = function(viewer, style) {
	this.objId = Number((new Date()).getTime() + "" + Number(Math.random() * 1000).toFixed(0));
	this.viewer = viewer;
	this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
	this.modifyHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
	this.polygon = null;
	this.polyline = null;
	this.positions = [];
	this.style = style;
	this.state = 0; //1为新增 2为编辑 0为清除
	this.gonPointArr = [];
	this.modifyPoint = null;
	//初始化鼠标提示框
	this.prompt = new MovePrompt(viewer);
}
CreatePolygon.prototype = {
	start: function(callBack) {
		var that = this;
		this.handler.setInputAction(function(evt) { //单机开始绘制
			var cartesian = that.getCatesian3FromPX(evt.position, that.viewer, [that.polygon]);
			if (that.positions.length == 0) {
				that.positions.push(cartesian.clone());
			}
			that.positions.push(cartesian);
			var point = that.createPoint(cartesian);
			point.wz = that.gonPointArr.length;
			that.gonPointArr.push(point);
		}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
		this.handler.setInputAction(function(evt) { //移动时绘制面
			if (that.positions.length < 1) {
				that.prompt.updatePrompt(evt.endPosition, "单击开始绘制");
				return;
			}
			that.prompt.updatePrompt(evt.endPosition, "单击新增，右键结束");
			var cartesian = that.getCatesian3FromPX(evt.endPosition, that.viewer, [that.polygon]);
			if (that.positions.length == 2) {
				if (!Cesium.defined(that.polyline)) that.polyline = that.createPolyline();
			} else {
				if (!Cesium.defined(that.polygon)) {
					that.polygon = that.createPolygon(that.style);
					that.polygon.isFilter = true;
					that.polygon.objId = that.objId;
					if (that.polyline) that.viewer.entities.remove(that.polyline);
				}
			}
			that.positions.pop();
			that.positions.push(cartesian);

		}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
		this.handler.setInputAction(function(evt) {
			if (!that.polygon) return;
			var cartesian = that.getCatesian3FromPX(evt.position, that.viewer, [that.polygon]);
			that.state = 1;
			that.handler.destroy();
			if (that.floatPoint) {
				if (that.floatPoint) that.floatPoint.show = false;
				that.floatPoint = null;
			}
			that.positions.pop();
			that.positions.push(cartesian);
			var point = that.createPoint(cartesian);
			point.wz = that.gonPointArr.length;
			that.gonPointArr.push(point);
			if (that.prompt) {
				that.prompt.destroy();
				that.prompt = null;
			}
			callBack(that.polygon);
		}, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
	},
	createByPositions: function(lnglatArr, callBack) { //通过传入坐标数组创建面
		if (!lnglatArr) return;
		var positions = that.getCatesian3FromPX.lnglatArrToCartesianArr(lnglatArr);
		if (!positions) return;
		this.polygon = this.createPolygon();
		this.positions = positions;
		callBack(this.polygon);
		for (var i = 0; i < positions.length; i++) {
			var point = this.createPoint(positions[i]);
			point.isFilter = true;
			point.wz = this.gonPointArr.length;
			this.gonPointArr.push(point);
		}
		this.state = 1;
		this.polygon.objId = this.objId;
	},

	startModify: function() {
		if (this.state != 1 && this.state != 2) return; //表示还没绘制完成
		if (!this.modifyHandler) this.modifyHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
		var that = this;
		for (var i = 0; i < that.gonPointArr.length; i++) {
			var point = that.gonPointArr[i];
			if (point) point.show = true;
		}
		this.modifyHandler.setInputAction(function(evt) {
			var pick = that.viewer.scene.pick(evt.position);
			if (Cesium.defined(pick) && pick.id) {
				if (!pick.id.objId)
					that.modifyPoint = pick.id;
				that.forbidDrawWorld(true);
			} else {
				for (var i = 0; i < that.gonPointArr.length; i++) {
					var point = that.gonPointArr[i];
					if (point) point.show = false;
				}
				if (that.modifyHandler) {
					that.modifyHandler.destroy();
					that.modifyHandler = null;
				}
				that.state = 2;
			}
		}, Cesium.ScreenSpaceEventType.LEFT_DOWN);
		this.modifyHandler.setInputAction(function(evt) { //移动时绘制面
			if (that.positions.length < 1 || !that.modifyPoint) return;
			var cartesian = that.getCatesian3FromPX(evt.endPosition, that.viewer, [that.polygon, that.modifyPoint]);
			if (cartesian) {
				that.modifyPoint.position.setValue(cartesian);
				that.positions[that.modifyPoint.wz] = cartesian;
			}
		}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
		this.modifyHandler.setInputAction(function(evt) {
			that.forbidDrawWorld(false);
			if (!that.modifyPoint) return;
			var cartesian = that.getCatesian3FromPX(evt.position, that.viewer, [that.polygon, that.modifyPoint]);
			that.modifyPoint.position.setValue(cartesian);
			that.positions[that.modifyPoint.wz] = cartesian;
			that.modifyPoint = null;
			that.forbidDrawWorld(false);
		}, Cesium.ScreenSpaceEventType.LEFT_UP);
	},
	endModify:function(callback){
		for (var i = 0; i < this.gonPointArr.length; i++) {
			var point = this.gonPointArr[i];
			if (point) point.show = false;
		}
		if (this.modifyHandler) {
			this.modifyHandler.destroy();
			this.modifyHandler = null;
		}
		this.state = 2;
		if(callback) callback(this.polygon);
	},
	createPoint: function(position) {
		if (!position) return;
		return this.viewer.entities.add({
			position: position,
			point: {
				pixelSize: 5,
				color: Cesium.Color.YELLOW,
				outlineWidth: 2,
				outlineColor: Cesium.Color.DARKRED,
				disableDepthTestDistance: Number.POSITIVE_INFINITY
			},
			show: false
		});
	},
	createPolygon: function() {
		var that = this;
		return this.viewer.entities.add({
			polygon: {
				hierarchy: new Cesium.CallbackProperty(function() {
					return new Cesium.PolygonHierarchy(that.positions)
				}, false),
				clampToGround: this.style.clampToGround == undefined ? false : true,
				show: true,
				fill: this.style.fill || true,
				material: this.style.material || Cesium.Color.WHITE,
				width: this.style.width || 3,
				outlineColor: this.style.outlineColor || Cesium.Color.BLACK,
				outlineWidth: this.style.outlineWidth || 1,
				outline: this.style.outline

			}

		});
	},
	createPolyline: function() {
		var that = this;
		return this.viewer.entities.add({
			polyline: {
				positions: new Cesium.CallbackProperty(function() {
					return that.positions
				}, false),
				clampToGround: this.style.clampToGround == undefined ? false : true,
				material: Cesium.Color.RED,
				width: 3
			}
		});
	},
	getPositions: function() {
		return this.positions;
	},
	getLnglats: function() {
		return cCesium.caratesianArrToLnglatArr(this.positions);
	},
	getAttr: function() {
		if (!this.polygon) return;
		var obj = {};
		var polygon = this.polygon.polygon;
		obj.fill = polygon.fill._value;
		obj.outline = polygon.outline._value;
		obj.outlineWidth = polygon.outlineWidth._value;
		obj.outlineColor = polygon.outlineColor._value;
		obj.clampToGround = line.clampToGround._value;
		obj.color = line.material.color._value;
		return obj;
	},
	setStyle: function(obj) {},
	remove: function() {
		if (this.polygon) {
			this.state = 0;
			this.viewer.entities.remove(this.polygon);
			this.polygon = null;
		}
	},
	setVisible: function(vis) {
		this.polygon.show = vis;
	},
	forbidDrawWorld: function(isForbid) {
		this.viewer.scene.screenSpaceCameraController.enableRotate = !isForbid;
		this.viewer.scene.screenSpaceCameraController.enableTilt = !isForbid;
		this.viewer.scene.screenSpaceCameraController.enableTranslate = !isForbid;
		this.viewer.scene.screenSpaceCameraController.enableInputs = !isForbid;
	},
	destroy: function() {
		if (this.handler) {
			this.handler.destroy();
			this.handler = null;
		}
		if (this.modifyHandler) {
			this.modifyHandler.destroy();
			this.modifyHandler = null;
		}
		if (this.polygon) {
			this.viewer.entities.remove(this.polygon);
			this.polygon = null;
		}
		if (this.polyline) {
			this.viewer.entities.remove(this.polyline);
			this.polyline = null;
		}
		this.positions = [];
		this.style = null;
		if (this.modifyPoint) {
			this.viewer.entities.remove(this.modifyPoint);
			this.modifyPoint = null;
		}
		for (var i = 0; i < this.gonPointArr.length; i++) {
			var point = this.gonPointArr[i];
			this.viewer.entities.remove(point);
		}
		this.gonPointArr = [];
		this.state = 0;
		if (this.prompt) this.prompt.destroy();
		if (this.polyline) {
			this.polyline = null;
			this.viewer.entities.remove(this.polyline);
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