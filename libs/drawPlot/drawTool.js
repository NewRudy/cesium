var DrawTool = function (obj) {
	if (!obj.viewer || !obj) {
		console.warn("缺少必要参数！--viewer");
		return;
	}
	this.viewer = obj.viewer;
	this.hasEdit = obj.hasEdit;
	this.toolArr = [];
	this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
	this.show = obj.drawEndShow;
}
DrawTool.prototype = {
	startDraw: function (opt) {
		var that = this;
		// if (this.hasEdit) {
		// 	 this.bindEdit();
		// }
		if (opt.type == "polyline") {
			var polyline = new CreatePolyline(this.viewer, opt.style);
			polyline.start(function (evt) {
				if (that.hasEdit) {
					that.unbindEdit();
					polyline.startModify(opt.modifySuccess);
					that.lastSelectEntity = polyline;
				}
				if (opt.success) opt.success(evt);
				if (that.show == false) polyline.setVisible(false);
			});
			this.toolArr.push(polyline);
		}
		if (opt.type == "polygon") {
			var polygon = new CreatePolygon(this.viewer, opt.style);
			polygon.start(function () {
				if (that.hasEdit) {
					that.unbindEdit();
					polygon.startModify();
					that.lastSelectEntity = polygon;
				}
				if (opt.success) opt.success(polygon);
				if (that.show == false) polygon.setVisible(false);
			});
			this.toolArr.push(polygon);
		}
		if (opt.type == "billboard") {
			var billboard = new CreateBillboard(this.viewer, opt.style);
			billboard.start(function () {
				if (that.hasEdit) {
					that.unbindEdit();
					billboard.startModify();
					that.lastSelectEntity = billboard;
				}
				if (opt.success) opt.success(billboard);
				if (that.show == false) billboard.setVisible(false);
			});
			this.toolArr.push(billboard);
		}
		if (opt.type == "circle") {
			var circle = new CreateCircle(this.viewer, opt.style);
			circle.start(function () {
				if (that.hasEdit) {
					that.unbindEdit();
					circle.startModify();
					that.lastSelectEntity = circle;
				}
				if (opt.success) opt.success(circle);
				if (that.show == false) circle.setVisible(false);
			});
			this.toolArr.push(circle);
		}
		if (opt.type == "rectangle") {
			var rectangle = new CreateRectangle(this.viewer, opt.style);
			rectangle.start(function () {
				if (that.hasEdit) {
					that.unbindEdit();
					rectangle.startModify();
					that.lastSelectEntity = rectangle;
				}
				if (opt.success) opt.success(rectangle);
				if (that.show == false) rectangle.setVisible(false);
			});
			this.toolArr.push(rectangle);
		}
		//重写材质
		if (opt.type == "flowPolyline") {
			var polyline = new CreatePolyline(this.viewer, opt.style);
			polyline.start(function () {
				if (that.hasEdit) {
					that.unbindEdit();
					polyline.startModify();
				}
				if (opt.success) opt.success(polyline);
			});
			this.toolArr.push(polyline);
		}

	},
	createByPositions: function (opt) {
		if (this.hasEdit) {
			this.bindEdit();
		}
		if (!opt) opt = {};
		if (opt.type == "polyline") {
			var polyline = new CreatePolyline(this.viewer, opt.style);
			polyline.createByPositions(opt.positions, opt.success);
			this.toolArr.push(polyline);
		}
		if (opt.type == "polygon") {
			var polygon = new CreatePolygon(this.viewer, opt.style);
			polygon.createByPositions(opt.positions, opt.success);
			this.toolArr.push(polygon);
		}
		if (opt.type == "billboard") {
			var billboard = new CreateBillboard(this.viewer, opt.style);
			billboard.createByPositions(opt.positions, function(){
				if(opt.success) opt.success(billboard)
			});
			this.toolArr.push(billboard);
		}
	},
	destroy: function () {
		for (var i = 0; i < this.toolArr.length; i++) {
			var obj = this.toolArr[i];
			obj.destroy();
		}
	},
	lastSelectEntity: null,
	bindEdit: function () {
		var that = this;
		this.handler.setInputAction(function (evt) { //单机开始绘制
			var pick = that.viewer.scene.pick(evt.position);
			if (Cesium.defined(pick) && pick.id) {
				for (var i = 0; i < that.toolArr.length; i++) {
					if (pick.id.objId == that.toolArr[i].objId && (that.toolArr[i].state == 1||that.toolArr[i].state == 2)) {
						if (that.lastSelectEntity) {
							that.lastSelectEntity.endModify();
						}
						that.toolArr[i].startModify();
						that.lastSelectEntity = that.toolArr[i];
						break;
					}
				}
			}
		}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
	},
	unbindEdit: function () {
		for (var i = 0; i < this.toolArr.length; i++) {
			this.toolArr[i].endModify();
		}
	}
}