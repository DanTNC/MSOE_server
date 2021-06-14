
var explanations = {};
var functionKeysConfig = "";
var keyboardLayout = "";
var keyContent = "";
var keyboardKeys = [];
var functionKeys = [];
const LAYOUT_TOP = 1.8;
const LAYOUT_ROW_OFFSET = 11.1;
var mutliKeyColorLoop = [
    "#31ffff",
    "#f0943a",
    "#4cec4c",
];
var mutliKeyColorMap = {};

class Key {
    constructor(left, top, width, height) {
        this.left = Number(left);
        this.top = Number(top);
        this.width = Number(width);
        this.height = Number(height) ?? 9.8;
    }
}

class Group {
    constructor(left, top, keys) {
        this.left = left;
        this.top = top;
        this.keys = keys;
    }

    toDom(parent) {
        this.keys.forEach((key) => {
            key.toDom(parent, this.top);
        });
    }
}

class KeyboardKey extends Key {
    constructor(content, left, top, width, height) {
        super(left, top, width, height);
        this.content = content;
    }

    toDom(parent) {
        let key_elem = $("<div class='key keyboardkey'></div>");
        key_elem.css("left", `calc(${this.left}vh + (100vw - 163.5vh) / 2)`);
        key_elem.css("width", `${this.width}vh`);
        key_elem.css("height", `${this.height}vh`);
        key_elem.css("line-height", `${this.height}vh`);
        key_elem.css("top", `${this.top}vh`);
        key_elem.html("<p>" + this.content + "</p>");
        parent.append(key_elem);
    }

}

var getKeys = (groupIdx, st, ed) => {
    if (ed == -1) {
        return [keyboardKeys[groupIdx].keys[st]];
    } else {
        let res = [];
        for (let i = st; i <= ed ; i++) {
            res.push(keyboardKeys[groupIdx].keys[i]);
        }
        return res;
    }
};

class FunctionKey extends Key {
    constructor(id_, left, top, width, height, multi) {
        super(left, top, width, height);
        this.id_ = id_;
        this.multi = multi ?? false;
    }

    static fromKeys(id_, keys) {
        let width, height;
        let left, left2, width2;
        let top, top2, height2;
        for (let key of keys) {
            if (left == undefined || key.left < left) left = key.left;
            if (left2 == undefined || key.left > left2) {
                left2 = key.left;
                width2 = key.width;
            }
            if (top == undefined || key.top < top) top = key.top;
            if (top2 == undefined || key.top > top2) {
                top2 = key.top;
                height2 = key.height;
            }
        }
        width = left2 + width2 - left;
        height = top2 + height2 - top;
        return new FunctionKey(id_, left, top, width, height, keys.length != 1);
    }

    toDom(parent) {
        let color = "white";
        if (this.multi) {
            if (mutliKeyColorMap[this.id_] == undefined) {
                color = mutliKeyColorLoop.pop();
                mutliKeyColorMap[this.id_] = color;
                mutliKeyColorLoop.unshift(color);
            } else {
                color = mutliKeyColorMap[this.id_];
            }
            let larger_border = $(`<div class='multikey' style='border: 0.5vh solid ${color}'></div>`);
            larger_border.css("left", `calc(${this.left-1}vh + (100vw - 163.5vh) / 2)`);
            larger_border.css("top", `${this.top-1}vh`);
            larger_border.css("width", `${this.width + 2}vh`);
            larger_border.css("height", `${this.height + 2}vh`);
            parent.append(larger_border);
        }
        let key_elem = $(`
            <div class='key functionkey' data-value='${this.id_}'>
                <div class='label' style='background-color:${color}'>
                    <p>${this.id_}</p>
                </div>
            </div>
        `);
        key_elem.css("left", `calc(${this.left}vh + (100vw - 163.5vh) / 2)`);
        key_elem.css("top", `${this.top}vh`);
        key_elem.css("width", `${this.width}vh`);
        key_elem.css("height", `${this.height}vh`);
        parent.append(key_elem);
    }
}

var generateKeys = () => {
    generateKeyboardKeys();
    generateFunctionKeys();

    $(".functionkey").hover(function(){
        $("#explanation").html("<div class='line'>" + explanations[$(this).attr("data-value")].split("<br>").join("</div><div class='line'>") + "</div>");
    }, function(){
        $("#explanation").html("<div class='line'>Point on a key or a key group to see the command of it.</div>");
    });
}

var generateKeyboardKeys = () => {
    let parent = $("#keyboard-keys");

    for (let group of keyboardKeys) {
        group.toDom(parent);
    }
}

var generateFunctionKeys = () => {
    let top = LAYOUT_TOP;
    let parent = $("#function-keys");

    for (let row of functionKeys) {
        for (let key of row) {
            key.toDom(parent, top);
        }
        top += LAYOUT_ROW_OFFSET;
    }
};

var defaultOverrides = (defConfigs, line) => {
    let [param, val] = line.substring(1).split("=");
    defConfigs[param] = Number(val);
};

var layoutDefinitions = (defConfigs, line, contentGroups, top) => {
    if (line == "") return;
    let nextTopOffset = LAYOUT_ROW_OFFSET;
    if (line.includes("+")){
        [line, nextTopOffset] = line.split("+");
        nextTopOffset = Number(nextTopOffset);
    }
    for (let group of line.split(";")) {
        if (group == "") continue;
        let keyContents = contentGroups.pop().split(" ").reverse();
        let configs = {};
        let keys = [];
        Object.assign(configs, defConfigs);
        let [configOverrides, layout] = group.split("=");
        let [gap, left, height] = configOverrides.split(",");
        if (gap != "%") configs.gap = Number(gap);
        if (left != "%") configs.left = Number(left);
        if (height != "%") configs.height = Number(height);
        let left_ = configs.left;
        for (let keyCombo of layout.split(",")) {
            let [times, width] = keyCombo.split(":");
            width = Number(width);
            for (let i = 0; i < times; i++) {
                let keyContent = keyContents.pop().replace(/\//g, "<br/>");
                keys.push(new KeyboardKey(keyContent, configs.left, top, width, configs.height));
                configs.left += configs.gap + width;
            }
        }
        keyboardKeys.push(new Group(top, left_, keys));
    }
    return nextTopOffset;
};

var initializeKeyboardKeys = () => {
    const defConfigs = {gap: 1, left: 0, height: 1};
    var state = "defaultSession";
    var top = LAYOUT_TOP;

    var contentGroups = keyContent.split(/\r\n|\n/).reverse();

    for (let line of keyboardLayout.split(/\r\n|\n/)) {
        line = line.replace(/\s+/g, "");
        switch(state) {
            case "defaultSession": 
                if (line.startsWith("!")) {
                    defaultOverrides(defConfigs, line);
                    break;
                }
                state = "layoutSession";
            case "layoutSession":
                if (line.startsWith("!")) {
                    console.warn("Cannot modify default setting after starting defining layout.");
                    break;
                }
                top += layoutDefinitions(defConfigs, line, contentGroups, top);
                break;
        }
    }
};

var initializeFunctionKeys = () => {
    for (let line of functionKeysConfig.split(/\r\n|\n/)) {
        line = line.replace(/\s+/g, "");
        let row = [];
        let [y, poses] = line.split("~");
        for (let pos of poses.split(";")) {
            if (pos == "") continue;
            let [id_, xs] = pos.split("=");
            if (y == "M") {
                let keys = [];
                for (let subxs of xs.split("&")) {
                    if (subxs == "") continue;
                    let [yy, xxs] = subxs.split("@");
                    yy = Number(yy);
                    if (xxs.includes("-")) {
                        let [st, ed] = xxs.split("-");
                        keys = keys.concat(getKeys(yy, Number(st), Number(ed)));
                    } else {
                        keys = keys.concat(getKeys(yy, Number(xxs), -1));
                    }
                }
                row.push(FunctionKey.fromKeys(id_, keys));
            } else {
                y = Number(y);
                let keys;
                if (xs.includes("-")) {
                    let [st, ed] = xs.split("-");
                    keys = getKeys(y, Number(st), Number(ed));
                } else {
                    keys = getKeys(y, Number(xs), -1);
                }
                row.push(FunctionKey.fromKeys(id_, keys));
            }
        }
        if (row.length == 0) continue;
        functionKeys.push(row);
    }
};

var initialize = async () => {
    functionKeysConfig = await $.get("keyboard/functionkey.txt");
    keyboardLayout = await $.get("keyboard/keyboard.txt");
    keyContent = await $.get("keyboard/keycontent.txt");
    explanations = await $.getJSON("json/key.json");

    initializeKeyboardKeys();
    initializeFunctionKeys();

    generateKeys();
};

$(window).on("load", function(){
    initialize();
});