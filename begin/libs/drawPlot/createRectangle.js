//绘制矩形
var CreateRectangle = function (viewer, style) {
    this.objId = Number((new Date()).getTime() + "" + Number(Math.random() * 1000).toFixed(0));
    this.viewer = viewer;
    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    this.modifyHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    this.rectangle = null;
    this.screenSpaceCameraController = [];
    this.style = style;
    this.rightdownPoint = null;
    this.leftupPoint = null;
    this.leftup = null;
    this.rightdown = null;
    this.radius = 0;
    this.modifyPoint = null;
    this.state = 0;
    this.pointArr = [];
    //初始化鼠标提示框
    this.prompt = new MovePrompt(viewer);
}
CreateRectangle.prototype = {
    start: function (callBack) {
        var that = this;
        this.handler.setInputAction(function (evt) { //单机开始绘制
            var cartesian = that.getCatesian3FromPX(evt.position, that.viewer, []);
            if (!that.leftupPoint) {
                that.leftup = cartesian;
                that.leftupPoint = that.createPoint(cartesian);
                that.leftupPoint.typeAttr = "leftup";
                that.rightdownPoint = that.createPoint(cartesian.clone());
                that.rightdown = cartesian.clone();
                that.rightdownPoint.typeAttr = "rightdown";
                that.rectangle = that.createRectangle(that.leftup, that.radius);
            } else {
                return;
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        this.handler.setInputAction(function (evt) { //移动时绘制线
            if (!that.leftupPoint) {
                that.prompt.updatePrompt(evt.endPosition, "单击开始绘制");
                return;
            }
            that.prompt.updatePrompt(evt.endPosition, "右键结束");
            var cartesian = that.getCatesian3FromPX(evt.endPosition, that.viewer, []);
            if (that.rightdownPoint) {
                that.rightdownPoint.position.setValue(cartesian);
                that.rightdown = cartesian.clone();
            }
            that.radius = Cesium.Cartesian3.distance(cartesian, that.leftup);
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        this.handler.setInputAction(function () { //单机开始绘制
            if (!that.rectangle) {
                return;
            }
            that.state = 1;
            that.handler.destroy();
            if (that.rightdownPoint) that.rightdownPoint.show = false;
            if (that.leftupPoint) that.leftupPoint.show = false;
            if (that.prompt) {
                that.prompt.destroy();
                that.prompt = null;
            }
            if (callBack) callBack(that.rectangle);
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    },
    startModify: function (callback) {
        if (this.state != 2 && this.state != 1) return; //表示还没绘制完成
        if (!this.modifyHandler) this.modifyHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        var that = this;
        if (that.rightdownPoint) that.rightdownPoint.show = true;
        if (that.leftupPoint) that.leftupPoint.show = true;
        this.modifyHandler.setInputAction(function (evt) {
            if (!that.rectangle) return;
            var pick = that.viewer.scene.pick(evt.position);
            if (Cesium.defined(pick) && pick.id) {
                if (!pick.id.objId)
                    that.modifyPoint = pick.id;
                that.forbidDrawWorld(true);
            } else {
                if (that.rightdownPoint) that.rightdownPoint.show = false;
                if (that.leftupPoint) that.leftupPoint.show = false;
                if (that.modifyHandler) {
                    that.modifyHandler.destroy();
                    that.modifyHandler = null;
                    if (callback) callback(that.rectangle);
                }
                that.state = 2;
            }
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
        this.modifyHandler.setInputAction(function (evt) {
            if (!that.modifyPoint) return;
            var cartesian = that.getCatesian3FromPX(evt.endPosition, that.viewer, [that.rectangle, that.modifyPoint]);
            if (!cartesian) {
                return;
            }
            if (that.modifyPoint.typeAttr == "leftup") {
                that.leftup = cartesian
                that.leftupPoint.position.setValue(that.leftup);
                that.rectangle.position.setValue(that.leftup);
            } else {
                that.rightdown = cartesian
                that.rightdownPoint.position.setValue(that.rightdown);
            }
            that.radius = Cesium.Cartesian3.distance(that.rightdown, that.leftup);
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        this.modifyHandler.setInputAction(function (evt) {
            if (!that.modifyPoint) return;
            that.modifyPoint = null;
            that.forbidDrawWorld(false);
        }, Cesium.ScreenSpaceEventType.LEFT_UP);
    },
    endModify:function(callback){
        if (this.rightdownPoint) this.rightdownPoint.show = false;
        if (this.leftupPoint) this.leftupPoint.show = false;
        if (this.modifyHandler) {
            this.modifyHandler.destroy();
            this.modifyHandler = null;
            if (callback) callback(this.rectangle);
        }
        this.state = 2;
	},
    createPoint: function (position) {
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
    createRectangle: function () {
        var that = this;
        var rectangle = this.viewer.entities.add({
            rectangle: {
                coordinates: new Cesium.CallbackProperty(function () {
                    return Cesium.Rectangle.fromCartesianArray([that.leftup, that.rightdown])
                }, false),
                material: this.style.material || Cesium.Color.YELLOW,
                width: this.style.width || 3,
                heightReference: this.style.heightReference == undefined ? Cesium.HeightReference.CLAMP_TO_GROUND : this.style.heightReference
            }
        });
        rectangle.objId = this.objId;
        return rectangle;
    },
    getPositions: function () {
        return [this.leftup, this.rightdown]
    },
    //获取相关属性
    getAttr: function () {
        return obj;
    },
    setStyle: function (obj) {},
    remove: function () {
        if (this.rectangle) {
            this.state = 0;
            this.viewer.entities.remove(this.rectangle);
            this.rectangle = null;
        }
    },
    setVisible: function (vis) {
        this.rectangle.show = vis;
    },
    forbidDrawWorld: function (isForbid) {
        this.viewer.scene.screenSpaceCameraController.enableRotate = !isForbid;
        this.viewer.scene.screenSpaceCameraController.enableTilt = !isForbid;
        this.viewer.scene.screenSpaceCameraController.enableTranslate = !isForbid;
        this.viewer.scene.screenSpaceCameraController.enableInputs = !isForbid;
    },
    destroy: function () {
        if (this.handler) {
            this.handler.destroy();
            this.handler = null;
        }
        if (this.modifyHandler) {
            this.modifyHandler.destroy();
            this.modifyHandler = null;
        }
        if (this.rectangle) {
            this.viewer.entities.remove(this.rectangle);
            this.rectangle = null;
        }
        if (this.rightdownPoint) {
            this.viewer.entities.remove(this.rightdownPoint);
            this.rightdownPoint = null;
        }
        if (this.leftupPoint) {
            this.viewer.entities.remove(this.leftupPoint);
            this.leftupPoint = null;
        }

        this.style = null;
        this.modifyPoint = null;
        if (this.prompt) this.prompt.destroy();
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