/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    FlowBezierSpline = require("ui/flow-bezier-spline").FlowBezierSpline;

var Flow = exports.Flow = Montage.create(Component, {

    _splinePaths: {
        enumerable: false,
        value: null
    },

    splinePaths: {
        enumerable: false,
        get: function () {
            if (!this._splinePaths) {
                this._splinePaths = [];
            }
            return this._splinePaths;
        },
        set: function (value) {
            this._splinePaths = value;
        }
    },

    appendPath: {
        value: function (path) {
            var splinePath = Object.create(FlowBezierSpline),
                pathKnots = path.knots,
                length = path.knots.length,
                knots = [],
                nextHandlers = [],
                previousHandlers = [],
                densities = [],
                i;

            for (i = 0; i < length; i++) {
                knots[i] = pathKnots[i].knotPosition;
                previousHandlers[i] = pathKnots[i].previousHandlerPosition;
                nextHandlers[i] = pathKnots[i].nextHandlerPosition;
                densities[i] = pathKnots[i].previousDensity; // TODO: implement previous/next density
                // TODO: add rotations, arbitrary CSS and units
            }
            splinePath.knots = knots;
            splinePath.previousHandlers = previousHandlers;
            splinePath.nextHandlers = nextHandlers;
            splinePath.densities = densities;
            splinePath._computeDensitySummation();
            this.splinePaths.push(splinePath);
            this._paths.push(path);
        }
    },

    _paths: {
        enumerable: false,
        value: null
    },

    paths: { // TODO: listen for changes?
        get: function () {
            return this._paths;
        },
        set: function (value) {
            var length = value.length,
                i;

            if (length) {
                this._paths = [];
                for (i = 0; i < length; i++) {
                    this.appendPath(value[i]);
                }
            }
        }
    },

    _cameraPosition: {
        enumerable: false,
        value: [0, 0, 800]
    },

    _cameraTargetPoint: {
        enumerable: false,
        value: [0, 0, 0]
    },

    _cameraFov: {
        enumerable: false,
        value: 50
    },

    // TODO: Implement camera roll

    _cameraRoll: {
        enumerable: false,
        value: 0
    },

    cameraPosition: {
        get: function () {
            return this._cameraPosition;
        },
        set: function (value) {
            this._cameraPosition = value;
            this._isCameraUpdated = true;
            this.needsDraw = true;
        }
    },

    cameraTargetPoint: {
        get: function () {
            return this._cameraTargetPoint;
        },
        set: function (value) {
            this._cameraTargetPoint = value;
            this._isCameraUpdated = true;
            this.needsDraw = true;
        }
    },

    cameraFov: {
        get: function () {
            return this._cameraFov;
        },
        set: function (value) {
            this._cameraFov = value;
            this._isCameraUpdated = true;
            this.needsDraw = true;
        }
    },

    cameraRoll: {
        get: function () {
            return this._cameraRoll;
        },
        set: function (value) {
            this._cameraRoll = value;
            this._isCameraUpdated = true;
            this.needsDraw = true;
        }
    },

    _scrollingTransitionDurationMiliseconds: {
        enumerable: false,
        value: 500
    },

    _scrollingTransitionDuration: {
        enumerable: false,
        value: "500ms"
    },

    scrollingTransitionDuration: { // TODO: think about using the Date Converter
        get: function () {
            return this._scrollingTransitionDuration;
        },
        set: function (duration) {
            var durationString = duration + "",
                length = durationString.length,
                value;

            if ((length >= 2) && (durationString[length - 1] === "s")) {
                if ((length >= 3) && (durationString[length - 2] === "m")) {
                    value = durationString.substr(0, length - 2) - 0;
                } else {
                    value = durationString.substr(0, length - 1) * 1000;
                }
            } else {
                value = durationString - 0;
                durationString += "ms";
            }
            if (!isNaN(value) && (this._scrollingTransitionDurationMiliseconds !== value)) {
                this._scrollingTransitionDurationMiliseconds = value;
                this._scrollingTransitionDuration = durationString;
            }
        }
    },

    _scrollingTransitionTimingFunctionBezier: {
        enumerable: false,
        value: [.25, .1, .25, 1]
    },

    _scrollingTransitionTimingFunction: {
        enumerable: false,
        value: "ease"
    },

    hasSelectedIndexScrolling: {
        enumerable: false,
        value: false
    },

    selectedIndexScrollingOffset: {
        enumerable: false,
        value: 0
    },

    _handleSelectedIndexesChange: {
        enumerable: false,
        value: function (event) {
            if (this.hasSelectedIndexScrolling && event._plus) {
                this.startScrollingIndexToOffset(event._plus[0], this.selectedIndexScrollingOffset);
            }
        }
    },

    _timingFunctions: {
        enumerable: false,
        value: {
            "ease": [.25, .1, .25, 1],
            "linear": [0, 0, 1, 1],
            "ease-in": [.42, 0, 1, 1],
            "ease-out": [0, 0, .58, 1],
            "ease-in-out": [.42, 0, .58, 1]
        }
    },

    scrollingTransitionTimingFunction: {
        get: function () {
            return this._scrollingTransitionTimingFunction;
        },
        set: function (timingFunction) {
            var string = timingFunction + "";

            if (this._timingFunctions.hasOwnProperty(string)) {
                this._scrollingTransitionTimingFunction = string;
                this._scrollingTransitionTimingFunctionBezier = this._timingFunctions[string];
            } else {
                if ((string.substr(0, 13) === "cubic-bezier(") && (string.substr(string.length - 1, 1) === ")")) {
                    var bezier = string.substr(13, string.length - 14).split(","),
                        i;

                    if (bezier.length === 4) {
                        for (i = 0; i < 4; i++) {
                            bezier[i] -= 0;
                            if (isNaN(bezier[i])) {
                                return;
                            }
                        }
                        if (bezier[0] < 0) {
                            bezier[0] = 0;
                        } else {
                            if (bezier[0] > 1) {
                                bezier[0] = 1;
                            }
                        }
                        if (bezier[2] < 0) {
                            bezier[2] = 0;
                        } else {
                            if (bezier[2] > 1) {
                                bezier[2] = 1;
                            }
                        }
                        // TODO: check it is not the same bezier
                        this._scrollingTransitionTimingFunction = "cubic-bezier(" + bezier + ")";
                        this._scrollingTransitionTimingFunctionBezier = bezier;
                    }
                }
            }
        }
    },

    _computeCssCubicBezierValue: {
        enumerable: false,
        value: function (x, bezier) {
            var t = .5,
                step = .25,
                t2,
                k,
                i;

            for (i = 0; i < 20; i++) { // TODO: optimize with Newton's method or similar
                t2 = t * t;
                k = 1 - t;
                if ((3 * (k * k * t * bezier[0] + k * t2 * bezier[2]) + t2 * t) > x) {
                    t -= step;
                } else {
                    t += step;
                }
                step *= .5;
            }
            t2 = t * t;
            k = 1 - t;
            return 3 * (k * k * t * bezier[1] + k * t2 * bezier[3]) + t2 * t;
        }
    },

    _isTransitioningScroll: {
        enumerable: false,
        value: false
    },

    stopScrolling: {
        value: function () {
            this._isTransitioningScroll = false;
            // TODO: Fire scrollingTransitionCancel event
        }
    },

    startScrollingIndexToOffset: { // TODO: Fire scrollingTransitionStart event
        value: function (index, offset) {
            this._scrollingOrigin = this.origin;
            this._scrollingDestination = index - offset;
            this._isScrolling = true;
            this._scrollingStartTime = Date.now();
            this._isTransitioningScroll = true;
            this.needsDraw = true;
        }
    },

    _isCameraUpdated: {
        enumerable: false,
        value: true
    },

    _width: {
        enumerable: false,
        value: null
    },

    _height: {
        enumerable: false,
        value: null
    },

    _repetitionComponents: {
        enumerable: false,
        value: null
    },

    _elementsBoundingSphereRadius: {
        enumerable: false,
        value: 150
    },

    elementsBoundingSphereRadius: {
        get: function () {
            return this._elementsBoundingSphereRadius;
        },
        set: function (value) {
            if (this._elementsBoundingSphereRadius !== value) {
                this._elementsBoundingSphereRadius = value;
                this.needsDraw = true;
            }
        }
    },

    _computeFrustumNormals: {
        value: function() {
            var angle = ((this.cameraFov * .5) * Math.PI * 2) / 360,
                y = Math.sin(angle),
                z = Math.cos(angle),
                x = (y * this._width) / this._height,
                vX = this.cameraTargetPoint[0] - this.cameraPosition[0],
                vY = this.cameraTargetPoint[1] - this.cameraPosition[1],
                vZ = this.cameraTargetPoint[2] - this.cameraPosition[2],
                yAngle = Math.PI / 2 - Math.atan2(vZ, vX),
                tmpZ = vX * Math.sin(yAngle) + vZ * Math.cos(yAngle),
                rX, rY, rZ,
                rX2, rY2, rZ2,
                xAngle = Math.PI / 2 - Math.atan2(tmpZ, vY),
                invLength,
                vectors = [[z, 0, x], [-z, 0, x], [0, z, y], [0, -z, y]],
                iVector,
                out = [],
                i;

            for (i = 0; i < 4; i++) {
                iVector = vectors[i];
                rX = iVector[0];
                rY = iVector[1] * Math.cos(-xAngle) - iVector[2] * Math.sin(-xAngle);
                rZ = iVector[1] * Math.sin(-xAngle) + iVector[2] * Math.cos(-xAngle);
                rX2 = rX * Math.cos(-yAngle) - rZ * Math.sin(-yAngle);
                rY2 = rY;
                rZ2 = rX * Math.sin(-yAngle) + rZ * Math.cos(-yAngle);
                invLength = 1 / Math.sqrt(rX2 * rX2 + rY2 * rY2 + rZ2 * rZ2);
                out.push([rX2 * invLength, rY2 * invLength, rZ2 * invLength]);
            }
            return out;
        }
    },

    _segmentsIntersection: {
        enumerable: false,
        value: function (segment1, segment2) {
            var n = 0,
                m = 0,
                start,
                end,
                result = [];

            while ((n < segment1.length) && (m < segment2.length)) {
                if (segment1[n][0] >= segment2[m][1]) {
                    m++;
                } else {
                    if (segment1[n][1] <= segment2[m][0]) {
                        n++;
                    } else {
                        if (segment1[n][0] >= segment2[m][0]) {
                            start = segment1[n][0];
                        } else {
                            start = segment2[m][0];
                        }
                        if (segment1[n][1] <= segment2[m][1]) {
                            end = segment1[n][1];
                        } else {
                            end = segment2[m][1];
                        }
                        result.push([start, end]);
                        if (segment1[n][1] < segment2[m][1]) {
                            n++;
                        } else {
                            if (segment1[n][1] > segment2[m][1]) {
                                m++;
                            } else {
                                n++;
                                m++;
                            }
                        }
                    }
                }
            }
            return result;
        }
    },

    _computeVisibleRange: { // TODO: make it a loop, optimize
        enumerable: false,
        value: function (spline) {
            var splineLength = spline.knotsLength - 1,
                planeOrigin = this._cameraPosition,
                normals = this._computeFrustumNormals(),
                mod,
                r, r2, r3 = [], out = [], tmp,
                i, j;

            for (i = 0; i < splineLength; i++) {
                mod = normals[0];
                r = spline.directedPlaneBezierIntersection(
                    [
                        planeOrigin[0] - mod[0] * this._elementsBoundingSphereRadius,
                        planeOrigin[1] - mod[1] * this._elementsBoundingSphereRadius,
                        planeOrigin[2] - mod[2] * this._elementsBoundingSphereRadius
                    ],
                    normals[0],
                    spline._knots[i],
                    spline._nextHandlers[i],
                    spline._previousHandlers[i + 1],
                    spline._knots[i + 1]
                );
                if (r.length) {
                    mod = normals[1];
                    r2 = spline.directedPlaneBezierIntersection(
                        [
                            planeOrigin[0] - mod[0] * this._elementsBoundingSphereRadius,
                            planeOrigin[1] - mod[1] * this._elementsBoundingSphereRadius,
                            planeOrigin[2] - mod[2] * this._elementsBoundingSphereRadius
                        ],
                        normals[1],
                        spline._knots[i],
                        spline._nextHandlers[i],
                        spline._previousHandlers[i + 1],
                        spline._knots[i + 1]
                    );
                    if (r2.length) {
                        tmp = this._segmentsIntersection(r, r2);
                        if (tmp.length) {
                            mod = normals[2];
                            r = spline.directedPlaneBezierIntersection(
                                [
                                    planeOrigin[0] - mod[0] * this._elementsBoundingSphereRadius,
                                    planeOrigin[1] - mod[1] * this._elementsBoundingSphereRadius,
                                    planeOrigin[2] - mod[2] * this._elementsBoundingSphereRadius
                                ],
                                normals[2],
                                spline._knots[i],
                                spline._nextHandlers[i],
                                spline._previousHandlers[i + 1],
                                spline._knots[i + 1]
                            );
                            tmp = this._segmentsIntersection(r, tmp);
                            if (tmp.length) {
                                mod = normals[3];
                                r = spline.directedPlaneBezierIntersection(
                                    [
                                        planeOrigin[0] - mod[0] * this._elementsBoundingSphereRadius,
                                        planeOrigin[1] - mod[1] * this._elementsBoundingSphereRadius,
                                        planeOrigin[2] - mod[2] * this._elementsBoundingSphereRadius
                                    ],
                                    normals[3],
                                    spline._knots[i],
                                    spline._nextHandlers[i],
                                    spline._previousHandlers[i + 1],
                                    spline._knots[i + 1]
                                );
                                tmp = this._segmentsIntersection(r, tmp);
                                for (j = 0; j < tmp.length; j++) {
                                    r3.push([i, tmp[j][0], tmp[j][1]]);
                                }
                            }
                        }
                    }
                }
            }
            var densities = spline._densities, d1, d2, dS, p1, p2, t1, t2;
            for (i = 0; i < r3.length; i++) {
                d1 = densities[r3[i][0]];
                d2 = densities[r3[i][0] + 1];
                dS = r3[i][0] ? spline._densitySummation[r3[i][0]-1] : 0;
                p1 = r3[i][1];
                p2 = r3[i][2];
                t1 = (d2 - d1) * p1 * p1 * .5 + p1 * d1 + dS;
                t2 = (d2 - d1) * p2 * p2 * .5 + p2 * d1 + dS;
                out.push([t1, t2]);
            }
            return out;
        }
    },

    prepareForDraw: {
        enumerable: false,
        value: function () {
            var self = this;

            this._repetitionComponents = this._repetition._childComponents;
            window.addEventListener("resize", function () {
                self._isCameraUpdated = true;
                self.needsDraw = true;
            }, false);
        }
    },

    _updateIndexMap: {
        enumerable: false,
        value: function (currentIndexMap, newIndexes) {
            var indexMap = currentIndexMap.slice(0, newIndexes.length),
                newIndexesHash = {},
                emptySpaces = [],
                j,
                i;

            for (i = 0; i < newIndexes.length; i++) {
                newIndexesHash[newIndexes[i]] = i;
            }
            for (i = 0; i < indexMap.length; i++) {
                if (newIndexesHash.hasOwnProperty(indexMap[i])) {
                    newIndexes[newIndexesHash[indexMap[i]]] = null;
                } else {
                    emptySpaces.push(i);
                }
            }
            for (i = j = 0; j < emptySpaces.length; i++) {
                if (newIndexes[i] !== null) {
                    indexMap[emptySpaces[j]] = newIndexes[i];
                    j++;
                }
            }
            for (j = indexMap.length; i < newIndexes.length; i++) {
                if (newIndexes[i] !== null) {
                    indexMap[j] = newIndexes[i];
                    j++;
                }
            }
            return indexMap;
        }
    },

    _updateIndexMap2: {
        enumerable: false,
        value: function (currentIndexMap, newIndexes) {
            var newIndexesHash = {},
                emptySpaces = [],
                j,
                i,
                currentIndexCount = currentIndexMap && !isNaN(currentIndexMap.length) ? currentIndexMap.length : 0;

            for (i = 0; i < newIndexes.length; i++) {
                newIndexesHash[newIndexes[i]] = i;
            }
            for (i = 0; i < currentIndexCount; i++) {
                if (newIndexesHash.hasOwnProperty(currentIndexMap[i])) {
                    newIndexes[newIndexesHash[currentIndexMap[i]]] = null;
                } else {
                    emptySpaces.push(i);
                }
            }
            for (i = j = 0; (j < emptySpaces.length) && (i < newIndexes.length); i++) {
                if (newIndexes[i] !== null) {
                    this._repetition.mapIndexToIndex(emptySpaces[j], newIndexes[i], false);
                    j++;
                }
            }
            for (j = currentIndexCount; i < newIndexes.length; i++) {
                if (newIndexes[i] !== null) {
                    this._repetition.mapIndexToIndex(j,newIndexes[i], false);
                    j++;
                }
            }

            this._repetition.refreshIndexMap();
        }
    },

    willDraw: {
        enumerable: false,
        value: function () {
            var intersections,
                i,
                j,
                newIndexMap = [];

            if (this._isTransitioningScroll) {
                var time = (Date.now() - this._scrollingStartTime) / this._scrollingTransitionDurationMiliseconds, // TODO: division by zero
                    interpolant = this._computeCssCubicBezierValue(time, this._scrollingTransitionTimingFunctionBezier);

                if (time < 1) {
                    this.origin = this._scrollingOrigin + (this._scrollingDestination - this._scrollingOrigin) * interpolant;
                } else {
                    this.origin = this._scrollingDestination;
                    this._isTransitioningScroll = false;
                }
            }
            this._width = this._element.offsetWidth;
            this._height = this._element.offsetHeight;

            if (this.splinePaths.length) {
                intersections = this._computeVisibleRange(this.splinePaths[0]);
                for (i = 0; i < intersections.length; i++) {
                    for (j = Math.ceil(intersections[i][0] + this._origin); j < intersections[i][1] + this._origin; j++) {
                        newIndexMap.push(j);
                    }
                }

                this._updateIndexMap2(this._repetition.indexMap, newIndexMap);
            }
        }
    },

    draw: {
        enumerable: false,
        value: function () {
            var i,
                length = this._repetitionComponents.length,
                slide = {},
                transform,
                origin,
                j,
                iOffset,
                iStyle,
                pos = [],
                pos3,
                positionKeys,
                positionKeyCount,
                jPositionKey;

            if (this._isTransitioningScroll) {
                this.needsDraw = true;
            }
            if (this.isAnimating) { // move it to willDraw
                this._animationInterval();
            }
            if (this._isCameraUpdated) {
                var perspective = Math.tan(((90 - this.cameraFov * .5) * Math.PI * 2) / 360) * this._height * .5,
                    vX = this.cameraTargetPoint[0] - this.cameraPosition[0],
                    vY = this.cameraTargetPoint[1] - this.cameraPosition[1],
                    vZ = this.cameraTargetPoint[2] - this.cameraPosition[2],
                    yAngle = Math.atan2(-vX, -vZ),  // TODO: Review this
                    tmpZ,
                    xAngle;

                tmpZ = vX * -Math.sin(-yAngle) + vZ * Math.cos(-yAngle);
                xAngle = Math.atan2(-vY, -tmpZ);
                this._element.style.webkitPerspective = perspective + "px";
                this._repetition._element.style.webkitTransform =
                    "translate3d(" + 0 + "px, " + 0 + "px, " + perspective + "px) rotateX(" + xAngle + "rad) rotateY(" + (-yAngle) + "rad) " +
                    "translate3d(" + (-this.cameraPosition[0]) + "px, " + (-this.cameraPosition[1]) + "px, " + (-this.cameraPosition[2]) + "px)";
                this._isCameraUpdated = false;
            }
            if (this.splinePaths.length) { // TODO: implement multiple paths
                for (i = 0; i < length; i++) {
                    iOffset = this._offset.value(this._repetition.indexMap[i]);
                    slide.index = this._repetition.indexMap[i];
                    slide.time = iOffset.time;
                    slide.speed = iOffset.speed;
                    pos = this._splinePaths[0].getPositionAtTime(slide.time, pos);
                    if (pos.length > 0) {
                        iStyle = this._repetitionComponents[i].element.parentNode.style;
                        if (iStyle.opacity == 0) {
                            iStyle.opacity = 1;
                        }

                        pos3 = pos[3];

                        transform = "translate3d(" + pos[0] + "px," + pos[1] + "px," + pos[2] + "px) ";
                        transform += (typeof pos3.rotateZ !== "undefined") ? "rotateZ(" + pos3.rotateZ + ") " : "";
                        transform += (typeof pos3.rotateY !== "undefined") ? "rotateY(" + pos3.rotateY + ") " : "";
                        transform += (typeof pos3.rotateX !== "undefined") ? "rotateX(" + pos3.rotateX + ") " : "";
                        iStyle.webkitTransform = transform;
                        iStyle = this._repetitionComponents[i].element.style;

                        positionKeys = Object.keys(pos3);
                        positionKeyCount = positionKeys.length;

                        for (j = 0; j < positionKeyCount; j++) {
                            jPositionKey = positionKeys[j];
                            if (!(jPositionKey === "rotateX" || jPositionKey === "rotateY" || jPositionKey === "rotateZ") && iStyle[jPositionKey] !== pos3[jPositionKey]) {
                                iStyle[jPositionKey] = pos3[jPositionKey];
                            }
                        }

                    } else {
                        iStyle = this._repetitionComponents[i].element.parentNode.style;
                        if (iStyle.opacity != 0) {
                            iStyle.opacity = 0;
                            iStyle.webkitTransform = "scale3d(0, 0, 0)";
                        }
                    }
                }
            }
        }
    },

    /////////////////////////////// Repetition ///////////////////////////

    _orphanedChildren: {
        enumerable: false,
        value: null
    },

    _selectedIndexesForRepetition: {
        enumerable: false,
        value: null
    },

    selectedIndexes: {
        get: function () {
            if (this._repetition) {
                return this._repetition.selectedIndexes;
            } else {
                return this._selectedIndexesForRepetition;
            }
        },
        set: function (value) {
            if (this._repetition) {
                this._repetition.selectedIndexes = value;
            } else {
                this._selectedIndexesForRepetition = value;
            }
        }
    },

    _activeIndexesForRepetition: {
        enumerable: false,
        value: null
    },

    activeIndexes: {
        get: function () {
            if (this._repetition) {
                return this._repetition.activeIndexes;
            } else {
                return this._activeIndexesForRepetition;
            }
        },
        set: function (value) {
            if (this._repetition) {
                this._repetition.activeIndexes = value;
            } else {
                this._activeIndexesForRepetition = value;
            }
        }
    },

    _objectsForRepetition: {
        enumerable: false,
        value: null
    },

    objects: {
        get: function() {
            if (this._repetition) {
                return this._repetition.objects;
            } else {
                return this._objectsForRepetition;
            }
        },
        set: function(value) {
            if (this._repetition) {
                this._repetition.objects = value;
            } else {
                this._objectsForRepetition = value;
            }
        }
    },

    _contentControllerForRepetition: {
        enumerable: false,
        value: null
    },

    contentController: {
        get: function() {
            if (this._repetition) {
                return this._repetition.contentController;
            } else {
                return this._contentControllerForRepetition;
            }
        },
        set: function(value) {
            if (this._repetition) {
                this._repetition.contentController = value;
            } else {
                this._contentControllerForRepetition = value;
            }
        }
    },

    _isSelectionEnabledForRepetition: {
        enumerable: false,
        value: null
    },

    isSelectionEnabled: {
        get: function() {
            if (this._repetition) {
                return this._repetition.isSelectionEnabled;
            } else {
                return this._isSelectionEnabledForRepetition;
            }
        },
        set: function(value) {
            if (this._repetition) {
                this._repetition.isSelectionEnabled = value;
            } else {
                this._isSelectionEnabledForRepetition = value;
            }
        }
    },

    propertyChangeBindingListener: {
        value: function(type, listener, useCapture, atSignIndex, bindingOrigin, bindingPropertyPath, bindingDescriptor) {
            if (bindingDescriptor.boundObjectPropertyPath.match(/objectAtCurrentIteration/)) {
                if (this._repetition) {
                    bindingDescriptor.boundObject = this._repetition;
                    return this._repetition.propertyChangeBindingListener.apply(this._repetition, arguments);
                } else {
                    return null;
                }
            } else {
                return Object.prototype.propertyChangeBindingListener.apply(this, arguments);
            }
        }
    },

    deserializedFromTemplate: {
        value: function() {
            this._orphanedChildren = this.childComponents;
            this.childComponents = null;
            this.offset = true;
        }
    },

    _repetitionDraw: {
        enumerable: false,
        value: function () {
           // this.needsDraw = true;  // TODO: Review this causing continous redraw
        }
    },

    templateDidLoad: {
        value: function() {
            var orphanedFragment,
                currentContentRange = this.element.ownerDocument.createRange(),
                oldRepetitionDraw = this._repetition.draw,
                wrapper,
                self = this;

            this._repetition.draw = function () {
                oldRepetitionDraw.call(self._repetition);
                self._repetitionDraw();
            };
            currentContentRange.selectNodeContents(this.element);
            orphanedFragment = currentContentRange.extractContents();
            wrapper = this._repetition.element.appendChild(document.createElement("div"));
            wrapper.appendChild(orphanedFragment);
            this._repetition.indexMapEnabled = true;
            this._repetition.childComponents = this._orphanedChildren;
            this._repetition.needsDraw = true;
            if (this._objectsForRepetition !== null) {
                this._repetition.objects = this._objectsForRepetition;
                this._objectsForRepetition = null;
            }
            if (this._contentControllerForRepetition !== null) {
                this._repetition.contentController = this._contentControllerForRepetition;
                this._contentControllerForRepetition = null;
            }
            if (this._isSelectionEnabledForRepetition !== null) {
                this._repetition.isSelectionEnabled = this._isSelectionEnabledForRepetition;
                this._isSelectionEnabledForRepetition = null;
            }
            if (this._selectedIndexesForRepetition !== null) {
                this._repetition.selectedIndexes = this._selectedIndexesForRepetition;
                this._selectedIndexesForRepetition = null;
            }
            if (this._activeIndexesForRepetition !== null) {
                this._repetition.activeIndexes = this._activeIndexesForRepetition;
                this._activeIndexesForRepetition = null;
            }
            this._repetition.addEventListener("change@selectedIndexes", function (event) {
                self._handleSelectedIndexesChange.call(self, event);
            }, false);
        }
    },

    ////////////////////// offset /////////////////////////

    // TODO: rename isAnimating and animationInterval to elasticAnimation

    isAnimating: {
        enumerable: false,
        value: false
    },

    _hasElasticScrolling: {
        enumerable: false,
        value: true
    },

    hasElasticScrolling: {
        get: function () {
            return this._hasElasticScrolling;
        },
        set: function (value) {
            this._hasElasticScrolling = (value === true) ? true : false;
        }
    },

    _elasticScrollingSpeed: {
        enumerable: false,
        value: 1
    },

    elasticScrollingSpeed: {
        get: function () {
            return this._elasticScrollingSpeed;
        },
        set: function (value) {
            this._elasticScrollingSpeed = value;
            if (!value) {
                this.hasElasticScrolling = false;
            }
        }
    },

    _selectedSlideIndex: {
        enumerable: false,
        value: null
    },

    selectedSlideIndex: {
        get: function () {
            return this._selectedSlideIndex;
        },
        set: function (value) {
            this._selectedSlideIndex=value;
            if (typeof this.animatingHash[this._selectedSlideIndex] !== "undefined") {
                var tmp = this.slide[this._selectedSlideIndex].x;

                this.origin += this._selectedSlideIndex - tmp;
            }
        }
    },

    _animating: {
        enumerable: false,
        value: null
    },

    animating: {
        enumerable: false,
        get: function () {
            if (!this._animating) {
                this._animating = [];
            }
            return this._animating;
        },
        set: function () {
        }
    },

    _animatingHash: {
        enumerable: false,
        value: null
    },

    animatingHash: {
        enumerable: false,
        get: function () {
            if (!this._animatingHash) {
                this._animatingHash = {};
            }
            return this._animatingHash;
        },
        set: function () {
        }
    },

    _slide: {
        enumerable: false,
        value: null
    },

    slide: {
        enumerable: false,
        get: function () {
            if (!this._slide) {
                this._slide = {};
            }
            return this._slide;
        },
        set: function () {
        }
    },

    startAnimating: {
        enumerable: false,
        value: function (index, pos) {
            if (typeof this.animatingHash[index] === "undefined") {
                var length = this.animating.length;

                this.animating[length] = index;
                this.animatingHash[index] = length;
                this.slide[index] = {
                    speed: 0,
                    x: pos
                };
            } else {
                this.slide[index].x = pos;
            }
        }
    },

    stopAnimating: {
        enumerable: false,
        value: function (index) {
            if (typeof this.animatingHash[index] !== "undefined") {
                this.animating[this.animatingHash[index]] = this.animating[this.animating.length - 1];
                this.animatingHash[this.animating[this.animating.length - 1]] = this.animatingHash[index];
                this.animating.pop();
                delete this.animatingHash[index];
                delete this.slide[index];
            }
        }
    },

    _range: {
        value: 15
    },

    lastDrawTime: {
        value: null
    },

    _origin: {
        enumerable: false,
        value: 0
    },

    origin: {
        get: function () {
            return this._origin;
        },
        set: function (value) {
            if ((this._hasElasticScrolling)&&(this._selectedSlideIndex !== null)) {
                var i,
                    n,
                    min = this._selectedSlideIndex - this._range,
                    max = this._selectedSlideIndex + this._range + 1,
                    tmp,
                    j,
                    x,
                    self = this;

                tmp = value - this._origin;
                if (min < 0) {
                    min = 0;
                }

                if (!this.isAnimating) {
                    this.lastDrawTime = Date.now();
                }
                for (i = min; i < max; i++) {
                    if (i != this._selectedSlideIndex) {
                        if (typeof this.animatingHash[i] === "undefined") {
                            x = i;
                        } else {
                            x = this.slide[i].x;
                        }
                        x += tmp;
                        if (i < this._selectedSlideIndex) {
                            if (x < i) {
                                this.startAnimating(i, x);
                            }
                        } else {
                            if (x > i) {
                                this.startAnimating(i, x);
                            }
                        }
                    }
                }
                this.stopAnimating(this._selectedSlideIndex);
                if (!this.isAnimating) {
                    this._animationInterval = function () {
                        var animatingLength = self.animating.length,
                            n, j, i, _iterations = 8,
                            time = Date.now(),
                            interval1 = self.lastDrawTime ? (time - self.lastDrawTime) * 0.015 * this._elasticScrollingSpeed : 0,
                            interval = interval1 / _iterations,
                            x,
                            epsilon = .5;

                        for (n = 0; n < _iterations; n++) {
                            for (j = 0; j < animatingLength; j++) {
                                i = self.animating[j];
                                if (i < self._selectedSlideIndex) {
                                    if (typeof self.animatingHash[i + 1] === "undefined") {
                                        x = i + 1;
                                    } else {
                                        x = self.slide[i + 1].x;
                                    }
                                    self.slide[i].speed = x - self.slide[i].x - 1;
                                } else {
                                    if (typeof self.animatingHash[i - 1] === "undefined") {
                                        x = i - 1;
                                    } else {
                                        x = self.slide[i - 1].x;
                                    }
                                    self.slide[i].speed = x - self.slide[i].x + 1;
                                }
                                self.slide[i].x += (self.slide[i].speed) * interval;
                            }
                        }
                        j = 0;
                        while (j < animatingLength) {
                            i = self.animating[j];
                            if (i < self._selectedSlideIndex) {
                                if (self.slide[i].x > i - epsilon) {
                                    self.stopAnimating(i);
                                    animatingLength--;
                                } else {
                                    j++;
                                }
                            } else {
                                if (self.slide[i].x < i + epsilon) {
                                    self.stopAnimating(i);
                                    animatingLength--;
                                } else {
                                    j++;
                                }
                            }
                        }
                        self.lastDrawTime = time;
                        if (!animatingLength) {
                            self.isAnimating = false;
                        } else {
                            self.needsDraw = true;
                            if (!self.isAnimating) {
                                self.isAnimating = true;
                            }
                        }
                    }
                }
                if (!this.isAnimating) {
                    this._animationInterval();
                }
            }
            this._origin = value;
            this._translateComposer.translateX = value * 300; // TODO Remove magic/spartan numbers
            this.needsDraw = true;
        }
    },

    _length: {
        enumerable: false,
        value: 0
    },

    length: {
        get: function () {
            return this._length;
        },
        set: function (value) {
            if (value < 0) {
                this._length = 0;
            } else {
                this._length = value;
            }
        }
    },

    _offset: {
        enumerable: false,
        value: {
            value: function (nodeNumber) {
                return 0;
            }
        }
    },

    offset: {
        get: function () {
            return this._offset;
        },
        set: function () {
            var self = this;

            this._offset = {
                value: function (nodeNumber) {
                    if (typeof self.animatingHash[nodeNumber] === "undefined") {
                        return {
                            time: nodeNumber - self._origin,
                            speed: 0
                        }
                    } else {
                        return {
                            time: self.slide[nodeNumber].x - self.origin,
                            speed: self.slide[nodeNumber].speed
                        }
                    }
                    this.needsDraw = true;
                }
            };
        }
    },

    _translateX: {
        enumerable: false,
        value: 0
    },

    translateX: {
        get: function () {
            return this._translateX;
        },
        set: function (value) {
            this._translateX = value;
            this.origin = this._translateX / 300;
        }
    }
});
