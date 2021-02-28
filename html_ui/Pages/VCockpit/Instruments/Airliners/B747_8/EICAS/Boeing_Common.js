var Boeing;
(function (Boeing) {
    class ThrustModeDisplay {
        constructor(_rootElement) {
            this.rootElement = null;
            this.currentText = "";
            this.rootElement = _rootElement;
            this.refresh("", true);
        }
        getText(phase, mode) {
            let text = "-";
            if (phase <= FlightPhase.FLIGHT_PHASE_TAKEOFF) {
                text = "TO";
                if (mode === 1) {
                    text += " - 1";
                }
                if (mode === 2) {
                    text += " - 2";
                }
            }
            else if (phase <= FlightPhase.FLIGHT_PHASE_CLIMB) {
                text = "CLB";
                if (mode === 1) {
                    text += " - 1";
                }
                if (mode === 2) {
                    text += " - 2";
                }
            }
            else if (phase <= FlightPhase.FLIGHT_PHASE_CRUISE) {
                text = "CRZ";
            }
            return text;
        }
        update() {
            let phase = Simplane.getCurrentFlightPhase();
            let mode = 0;
            if (phase <= FlightPhase.FLIGHT_PHASE_TAKEOFF) {
                mode = Simplane.getEngineThrustTakeOffMode(0);
            }
            else {
                mode = Simplane.getEngineThrustClimbMode(0);
            }
            let tmaText = this.getText(phase, mode);
            this.refresh(tmaText);
        }
        refresh(_text, _force = false) {
            if ((_text != this.currentText) || _force) {
                this.currentText = _text;
                if (this.rootElement != null) {
                    this.rootElement.innerHTML = this.currentText;
                }
            }
        }
    }
    Boeing.ThrustModeDisplay = ThrustModeDisplay;
    class GearDisplay {
        constructor(_rootElement) {
            this.rootElement = null;
            this.currentValue = 0;
            this.timeout = 0;
            this.rootElement = _rootElement;
            this.refreshValue(0, true);
        }
        update(_deltaTime) {
            this.refreshValue(Simplane.getGearPosition());
            if ((this.currentValue <= 0) && (this.timeout > 0)) {
                this.timeout -= _deltaTime;
                if (this.timeout <= 0) {
                    if (this.rootElement != null) {
                        this.rootElement.setAttribute("class", "inactive");
                    }
                }
            }
        }
        refreshValue(_value, _force = false) {
            if ((_value != this.currentValue) || _force) {
                this.currentValue = _value;
                if (this.rootElement != null) {
                    if (this.currentValue <= 0) {
                        this.rootElement.setAttribute("class", "up");
                    }
                    else if (this.currentValue >= 100) {
                        this.rootElement.setAttribute("class", "down");
                    }
                    else {
                        this.rootElement.setAttribute("class", "transit");
                    }
                }
                if (this.currentValue <= 0) {
                    this.timeout = Boeing.GearDisplay.TIMEOUT_LENGTH;
                }
            }
        }
    }
    GearDisplay.TIMEOUT_LENGTH = 10000;
    Boeing.GearDisplay = GearDisplay;
    class FlapsDisplay {
        constructor(_rootElement, _marker, _valueText, _bar, _gauge) {
            this.rootElement = _rootElement;
            this.marker = _marker;
            this.valueText = _valueText;
            this.bar = _bar;
            this.gauge = _gauge;
            this.cockpitSettings = SimVar.GetGameVarValue("", "GlassCockpitSettings");
            this.refreshValue(0, 0, 0, true);
        }
        update(_deltaTime) {
            var leverPos = Simplane.getFlapsHandleIndex();
            var flapsPercent = ((SimVar.GetSimVarValue("TRAILING EDGE FLAPS LEFT PERCENT", "percent") + SimVar.GetSimVarValue("TRAILING EDGE FLAPS RIGHT PERCENT", "percent")) * 0.5) * 0.01;
            var flapsAngle = (SimVar.GetSimVarValue("TRAILING EDGE FLAPS LEFT ANGLE", "degrees") + SimVar.GetSimVarValue("TRAILING EDGE FLAPS RIGHT ANGLE", "degrees")) * 0.5;
            this.refreshValue(leverPos, flapsPercent, flapsAngle);
            if ((this.currentAngle <= 0) && (this.timeout > 0)) {
                this.timeout -= _deltaTime;
                if (this.timeout <= 0) {
                    if (this.rootElement != null) {
                        this.rootElement.setAttribute("class", "inactive");
                    }
                }
            }
        }
        refreshValue(_leverPos, _realFlapsPercent, _realFlapsAngle, _force = false) {
            if ((_leverPos != this.currentLeverPosition) || (_realFlapsPercent != this.currentPercent) || (_realFlapsAngle != this.currentAngle) || _force) {
                this.currentLeverPosition = _leverPos;
                this.currentPercent = _realFlapsPercent;
                this.currentAngle = _realFlapsAngle;
                var targetAngle = this.flapsLeverPositionToAngle(this.currentLeverPosition);
                SimVar.SetSimVarValue("L:TEST_TE_FLAPS_PERCENT", "number", this.currentPercent);
                SimVar.SetSimVarValue("L:TEST_TE_FLAPS_ANGLE", "number", this.currentAngle);
                var barTop = 0;
                var barBottom = 0;
                var barHeight = 0;
                if (this.bar != null) {
                    barTop = this.bar.y.baseVal.value;
                    barBottom = barTop + this.bar.height.baseVal.value;
                    barHeight = (barBottom - barTop);
                }
                var markerY = barTop + (barHeight * this.flapsAngleToPercentage(targetAngle));
                var markerYStr = markerY.toString();
                if (this.marker != null) {
                    this.marker.setAttribute("y1", markerYStr);
                    this.marker.setAttribute("y2", markerYStr);
                }
                if (this.valueText != null) {
                    this.valueText.textContent = (targetAngle <= 0) ? "UP" : targetAngle.toFixed(0);
                    this.valueText.setAttribute("y", markerYStr);
                }
                if (this.gauge != null) {
                    var height = barHeight * this.currentPercent;
                    this.gauge.setAttribute("height", height.toString());
                }
                if (this.rootElement != null) {
                    this.rootElement.setAttribute("class", (Math.round(this.currentAngle) == Math.round(targetAngle)) ? "static" : "transit");
                }
                if (this.currentAngle <= 0) {
                    this.timeout = Boeing.FlapsDisplay.TIMEOUT_LENGTH;
                }
            }
        }
        flapsLeverPositionToAngle(_leverPos) {
            if (this.cockpitSettings && this.cockpitSettings.FlapsLevels.initialised) {
                return this.cockpitSettings.FlapsLevels.flapsAngle[_leverPos];
            }
            return Simplane.getFlapsHandleAngle(_leverPos);
        }
        flapsAngleToPercentage(_angle) {
            if (_angle == 0) {
                return 0;
            }
            if (_angle == 1) {
                return 0.033;
            }
            if (_angle == 5) {
                return 0.167;
            }
            if (_angle == 10) {
                return 0.333;
            }
            if (_angle == 20) {
                return 0.667;
            }
            if (_angle == 25) {
                return 0.833;
            }
            if (_angle == 30) {
                return 1;
            }
            return;
        }
    }
    FlapsDisplay.TIMEOUT_LENGTH = 3000;
    Boeing.FlapsDisplay = FlapsDisplay;
    class StabDisplay {
        constructor(_root, _maxValue = 20, _valueDecimals = 2) {
            this.currentValue = 0;
            this.maxValue = 0;
            this.valueDecimals = 0;
            this.valueToArrowY = 0;
            this.takeoffText = null;
            this.valueText = null;
            this.arrow = null;
            this.trimBand = null;
            this.maxValue = _maxValue;
            this.valueDecimals = _valueDecimals;
            if (_root != null) {
                this.takeoffText = _root.querySelector(".takeoff");
                this.valueText = _root.querySelector(".value");
                this.arrow = _root.querySelector(".arrow");
                this.trimBand = _root.querySelector(".trimBand");
                var bar = _root.querySelector(".bar");
                if (bar != null) {
                    var barHeight = bar.y2.baseVal.value - bar.y1.baseVal.value;
                    this.valueToArrowY = (barHeight * 0.5) / this.maxValue;
                }
                if (this.takeoffText != null) {
                    this.takeoffText.style.display = "none";
                }
            }
            this.refreshValue(0, true);
        }
        update(_deltaTime) {
            this.refreshValue(SimVar.GetSimVarValue("ELEVATOR TRIM POSITION", "degree"));
        }
        refreshValue(_value, _force = false) {
            if ((_value != this.currentValue) || _force) {
                this.currentValue = Utils.Clamp(_value, 0, this.maxValue);
                var displayValue = (this.currentValue + this.maxValue) * 0.5;
                if (this.valueText != null) {
                    this.valueText.textContent = displayValue.toFixed(this.valueDecimals);
                }
                if (this.arrow != null) {
                    let clampedVal = Utils.Clamp(this.currentValue, -this.maxValue, this.maxValue);
                    var arrowY = clampedVal * this.valueToArrowY;
                    this.arrow.setAttribute("transform", "translate(0," + arrowY + ")");
                }
            }
        }
    }
    Boeing.StabDisplay = StabDisplay;
    class RudderDisplay {
        constructor(_root, _maxValue = 10) {
            this.currentValue = 0;
            this.maxValue = 0;
            this.valueToArrowX = 0;
            this.valueText = null;
            this.leftText = null;
            this.rightText = null;
            this.arrow = null;
            this.maxValue = _maxValue;
            if (_root != null) {
                this.valueText = _root.querySelector(".value");
                this.leftText = _root.querySelector(".left");
                this.rightText = _root.querySelector(".right");
                this.arrow = _root.querySelector(".arrow");
                var bar = _root.querySelector(".bar");
                if (bar != null) {
                    var barLength = bar.x2.baseVal.value - bar.x1.baseVal.value;
                    this.valueToArrowX = (barLength * 0.5) / this.maxValue;
                }
            }
            this.refreshValue(0, true);
        }
        update(_deltaTime) {
            this.refreshValue(SimVar.GetSimVarValue("RUDDER TRIM", "degrees"));
        }
        refreshValue(_value, _force = false) {
            if ((_value != this.currentValue) || _force) {
                this.currentValue = Utils.Clamp(_value, -this.maxValue, this.maxValue);
                var bShowLeft = false;
                var bShowRight = false;
                var displayValue = Math.abs(this.currentValue);
                if (displayValue <= 0.05) {
                    displayValue = 0;
                }
                else {
                    bShowLeft = (this.currentValue < 0);
                    bShowRight = !bShowLeft;
                }
                if (this.valueText != null) {
                    this.valueText.textContent = displayValue.toFixed(1);
                }
                if (this.leftText != null) {
                    this.leftText.style.display = bShowLeft ? "block" : "none";
                }
                if (this.rightText != null) {
                    this.rightText.style.display = bShowRight ? "block" : "none";
                }
                if (this.arrow != null) {
                    var arrowX = this.currentValue * this.valueToArrowX;
                    this.arrow.setAttribute("transform", "translate(" + arrowX + ",0)");
                }
            }
        }
    }
    Boeing.RudderDisplay = RudderDisplay;
    class FuelBaseComponent {
        constructor(_element, _index) {
            this.element = null;
            this.index = 0;
            this.element = _element;
            this.index = _index;
        }
    }
    Boeing.FuelBaseComponent = FuelBaseComponent;
    class FuelEngineState extends FuelBaseComponent {
        constructor() {
            super(...arguments);
            this.isActive = false;
        }
        init() {
            this.refresh(false, true);
        }
        update(_deltaTime) {
            this.refresh(SimVar.GetSimVarValue("ENG FUEL FLOW GPH:" + this.index, "gallons per hour") > 0.05);
        }
        refresh(_isActive, _force = false) {
            if (_force || (this.isActive != _isActive)) {
                this.isActive = _isActive;
                if (this.element != null) {
                    var className = this.isActive ? "active" : "inactive";
                    this.element.setAttribute("class", "fuelengine-" + className);
                }
            }
        }
    }
    Boeing.FuelEngineState = FuelEngineState;
    class FuelPump extends FuelBaseComponent {
        constructor() {
            super(...arguments);
            this.isSwitched = false;
            this.isActive = false;
        }
        init() {
            this.refresh(false, false, true);
        }
        update(_deltaTime) {
            this.refresh(SimVar.GetSimVarValue("FUELSYSTEM PUMP SWITCH:" + this.index, "Bool"), SimVar.GetSimVarValue("FUELSYSTEM PUMP ACTIVE:" + this.index, "Bool"));
        }
        refresh(_isSwitched, _isActive, _force = false) {
            if (_force || (this.isSwitched != _isSwitched) || (this.isActive != _isActive)) {
                this.isSwitched = _isSwitched;
                this.isActive = _isActive;
                if (this.element != null) {
                    var className = this.isSwitched ? "switched" : "notswitched";
                    className += this.isActive ? "-active" : "-inactive";
                    this.element.setAttribute("class", "fuelpump-" + className);
                }
            }
        }
    }
    Boeing.FuelPump = FuelPump;
    class FuelValve extends FuelBaseComponent {
        constructor() {
            super(...arguments);
            this.isSwitched = false;
            this.isOpen = false;
            this.transformStringClosed = "";
            this.transformStringOpen = "";
        }
        init() {
            if (this.element != null) {
                var baseTransform = this.element.getAttribute("transform");
                var rotateIndex = baseTransform.search("rotate");
                if (rotateIndex < 0) {
                    this.transformStringClosed = baseTransform + " rotate(0)";
                    this.transformStringOpen = baseTransform + " rotate(90)";
                }
                else {
                    this.transformStringClosed = baseTransform;
                    var rotateStartIndex = baseTransform.indexOf("rotate(") + 7;
                    var rotateEndIndex = baseTransform.indexOf(")", rotateStartIndex);
                    var angle = parseFloat(baseTransform.slice(rotateStartIndex, rotateEndIndex));
                    this.transformStringOpen = baseTransform.replace("rotate(" + angle + ")", "rotate(" + (angle + 90) + ")");
                }
            }
            this.refresh(false, 0, true);
        }
        update(_deltaTime) {
            this.refresh(SimVar.GetSimVarValue("FUELSYSTEM VALVE SWITCH:" + this.index, "Bool"), SimVar.GetSimVarValue("FUELSYSTEM VALVE OPEN:" + this.index, "number"));
        }
        refresh(_isSwitched, _openLevel, _force = false) {
            var open = this.isOpen;
            if (_openLevel >= 1) {
                open = true;
            }
            else if (_openLevel <= 0) {
                open = false;
            }
            if (_force || (this.isSwitched != _isSwitched) || (this.isOpen != open)) {
                this.isSwitched = _isSwitched;
                this.isOpen = open;
                if (this.element != null) {
                    if (this.isSwitched || this.isOpen) {
                        this.element.setAttribute("class", this.isSwitched ? "fuelvalve-open" : "fuelvalve-closing");
                        this.element.setAttribute("transform", this.transformStringOpen);
                    }
                    else {
                        this.element.setAttribute("class", "fuelvalve-closed");
                        this.element.setAttribute("transform", this.transformStringClosed);
                    }
                }
            }
        }
    }
    Boeing.FuelValve = FuelValve;
    class FuelLine extends FuelBaseComponent {
        constructor() {
            super(...arguments);
            this.isActive = false;
        }
        init() {
            this.refresh(false, true);
        }
        update(_deltaTime) {
            this.refresh(SimVar.GetSimVarValue("FUELSYSTEM LINE FUEL FLOW:" + this.index, "number") > 0);
        }
        refresh(_isActive, _force = false) {
            if (_force || (this.isActive != _isActive)) {
                this.isActive = _isActive;
                if (this.element != null) {
                    var className = this.isActive ? "active" : "inactive";
                    this.element.setAttribute("class", "fuelline-" + className);
                }
            }
        }
    }
    Boeing.FuelLine = FuelLine;
    class InfoPanelsManager extends Airliners.EICASInfoPanelManager {
        init(_panel) {
            this.mainPanel = _panel;
            Coherent.on("AddUpperECAMMessage", this.onInfoPanelEvent.bind(this, Airliners.EICAS_INFO_PANEL_EVENT_TYPE.ADD_MESSAGE));
            Coherent.on("RemoveUpperECAMMessage", this.onInfoPanelEvent.bind(this, Airliners.EICAS_INFO_PANEL_EVENT_TYPE.REMOVE_MESSAGE));
            Coherent.on("ModifyUpperECAMMessage", this.onInfoPanelEvent.bind(this, Airliners.EICAS_INFO_PANEL_EVENT_TYPE.MODIFY_MESSAGE));
            Coherent.on("ClearUpperECAMScreen", this.onInfoPanelEvent.bind(this, Airliners.EICAS_INFO_PANEL_EVENT_TYPE.CLEAR_SCREEN));
        }
        addMessage(_id, _message, _style) {
            if (_message != "") {
                let infoPanel = this.getInfoPanel(_id);
                if (infoPanel) {
                    infoPanel.addMessage(_message, _style);
                }
            }
        }
        removeMessage(_id, _message) {
            if (_message != "") {
                let infoPanel = this.getInfoPanel(_id);
                if (infoPanel) {
                    infoPanel.removeMessage(_message);
                }
            }
        }
        modifyMessage(_id, _currentMessage, _newMessage, _newStyle) {
            let infoPanel = this.getInfoPanel(_id);
            if (infoPanel) {
                if (_newMessage == "")
                    _newMessage = _currentMessage;
                infoPanel.modifyMessage(_currentMessage, _newMessage, _newStyle);
            }
        }
        clearScreen(_id) {
            let infoPanel = this.getInfoPanel(_id);
            if (infoPanel) {
                infoPanel.clearScreen();
            }
        }
        getInfoPanel(_id) {
            switch (_id) {
                case Airliners.EICAS_INFO_PANEL_ID.PRIMARY:
                    return this.mainPanel;
                default:
                    return null;
            }
        }
        onInfoPanelEvent(_type, ..._args) {
            if ((_args != null) && (_args.length > 0)) {
                var strings = _args[0];
                if ((strings != null) && (strings.length > 0)) {
                    let panelId;
                    if (strings[0] == "primary") {
                        panelId = Airliners.EICAS_INFO_PANEL_ID.PRIMARY;
                    }
                    else if (strings[0] == "secondary") {
                        panelId = Airliners.EICAS_INFO_PANEL_ID.PRIMARY;
                    }
                    else {
                        return;
                    }
                    switch (_type) {
                        case Airliners.EICAS_INFO_PANEL_EVENT_TYPE.ADD_MESSAGE:
                            {
                                if (strings.length >= 3) {
                                    this.addMessage(panelId, strings[1], Airliners.EICAS_INFO_PANEL_MESSAGE_STYLE[strings[2]]);
                                }
                                break;
                            }
                        case Airliners.EICAS_INFO_PANEL_EVENT_TYPE.REMOVE_MESSAGE:
                            {
                                if (strings.length >= 2) {
                                    this.removeMessage(panelId, strings[1]);
                                }
                                break;
                            }
                        case Airliners.EICAS_INFO_PANEL_EVENT_TYPE.MODIFY_MESSAGE:
                            {
                                if (strings.length >= 4) {
                                    this.modifyMessage(panelId, strings[1], strings[2], Airliners.EICAS_INFO_PANEL_MESSAGE_STYLE[strings[3]]);
                                }
                                break;
                            }
                        case Airliners.EICAS_INFO_PANEL_EVENT_TYPE.CLEAR_SCREEN:
                            {
                                this.clearScreen(panelId);
                                break;
                            }
                    }
                }
            }
        }
    }
    Boeing.InfoPanelsManager = InfoPanelsManager;
    class InfoPanel {
        constructor(_parent, _divID) {
            this.allDivs = [];
            this.parent = _parent;
            this.divID = _divID;
        }
        init() {
            this.create();
        }
        update(_deltaTime) {
        }
        create() {
            if (this.parent != null) {
                this.divMain = this.createDiv(this.divID);
                this.parent.appendChild(this.divMain);
                for (var i = 0; i < 32; ++i) {
                    var newDiv = document.createElement("div");
                    this.allDivs.push(newDiv);
                    this.divMain.appendChild(newDiv);
                }
            }
        }
        createDiv(_id, _class = "", _text = "") {
            var div = document.createElement("div");
            if (_id.length > 0) {
                div.id = _id;
            }
            if (_class.length > 0) {
                div.className = _class;
            }
            if (_text.length > 0) {
                div.textContent = _text;
            }
            return div;
        }
        getNextAvailableDiv(_style) {
            if(_style == Airliners.EICAS_INFO_PANEL_MESSAGE_STYLE.INDICATION) {
                for (var i = 10; i > 0; --i) {
                    if (this.allDivs[i].textContent.length == 0) {
                        this.allDivs[i].style.visibility = "visible";
                        return this.allDivs[i];
                    }
                }
                for (var i = 21; i > 10; --i) {
                    if (this.allDivs[i].textContent.length == 0) {
                        this.allDivs[i].style.visibility = "hidden";
                        return this.allDivs[i];
                    }
                }
                for (var i = 32; i > 21; --i) {
                    if (this.allDivs[i].textContent.length == 0) {
                        this.allDivs[i].style.visibility = "hidden";
                        return this.allDivs[i];
                    }
                }           
            }
            else {
                for (var i = 0; i < this.allDivs.length; ++i) {
                    if (this.allDivs[i].textContent.length == 0) {
                        if (i > 10) {
                            this.allDivs[i].style.visibility = "hidden";
                        } 
                        else {
                            this.allDivs[i].style.visibility = "visible";
                        }
                        return this.allDivs[i];
                    }
                }
            }
            if (this.divMain != null) {
                var newDiv = document.createElement("div");
                this.allDivs.push(newDiv);
                this.divMain.appendChild(newDiv);
                return newDiv;
            }
            return null;
        }
        getDivFromMessage(_message) {
            for (var i = 0; i < this.allDivs.length; ++i) {
                if (this.allDivs[i].textContent == _message) {
                    return this.allDivs[i];
                }
            }
            return null;
        }
        getClassNameFromStyle(_style) {
            switch (_style) {
                case Airliners.EICAS_INFO_PANEL_MESSAGE_STYLE.INDICATION: return "InfoIndication";
                case Airliners.EICAS_INFO_PANEL_MESSAGE_STYLE.CAUTION: return "InfoCaution";
                case Airliners.EICAS_INFO_PANEL_MESSAGE_STYLE.WARNING: return "InfoWarning";
            }
            return "";
        }
        addMessage(_message, _style) {
            var div = this.getNextAvailableDiv(_style);
            if (div != null) {
                div.textContent = _message;
                div.className = this.getClassNameFromStyle(_style);
            }
        }
        removeMessage(_message) {
            var div = this.getDivFromMessage(_message);
            if (div != null) {
                div.textContent = "";
                for (var i = 0; i < (this.allDivs.length - 1); ++i) {
                    if (this.allDivs[i].textContent.length == 0) {
                        if (this.allDivs[i + 1].textContent.length > 0) {
                            this.allDivs[i].textContent = this.allDivs[i + 1].textContent;
                            this.allDivs[i].className = this.allDivs[i + 1].className;
                            this.allDivs[i + 1].textContent = "";
                        }
                    }
                }
            }
        }
        modifyMessage(_currentMessage, _newMessage, _newStyle) {
            var div = this.getDivFromMessage(_currentMessage);
            if (div != null) {
                div.textContent = _newMessage;
                div.className = this.getClassNameFromStyle(_newStyle);
            }
        }
        clearScreen() {
            for (var i = 0; i < this.allDivs.length; ++i) {
                this.allDivs[i].textContent = "";
            }
        }
    }
    Boeing.InfoPanel = InfoPanel;
})(Boeing || (Boeing = {}));
//# sourceMappingURL=Boeing_Common.js.map