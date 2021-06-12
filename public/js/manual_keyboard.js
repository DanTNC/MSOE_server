
var explanations = {};
var functionKeysConfig = "";
var keyboardLayout = "";
var keyContent = "";
var keyboardKeys = [];
var functionKeys = [];
const LAYOUT_TOP = 1.8;
const LAYOUT_ROW_OFFSET = 11.1;

class Key {
    constructor(left, width, height) {
        this.left = Number(left);
        this.width = Number(width);
        this.height = Number(height) || 9.8;
    }
}

class Group {
    constructor(top, keys) {
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
    constructor(content, left, width, height) {
        super(left, width, height);
        this.content = content;
    }

    toDom (parent, top) {
        let key_elem = $("<div class='key keyboardkey'></div>");
        key_elem.css("left", `calc(${this.left}vh + (100vw - 163.5vh) / 2)`);
        key_elem.css("width", `${this.width}vh`);
        key_elem.css("height", `${this.height}vh`);
        key_elem.css("line-height", `${this.height}vh`);
        key_elem.css("top", `${top}vh`);
        key_elem.html("<p>" + this.content + "</p>");
        parent.append(key_elem);
    }

}
class FunctionKey extends Key {
    constructor(id_, left, width, height) {
        super(left, width, height);
        this.id_ = id_;
    }

    toDom (parent, top) {
        let key_elem = $("<div class='key functionkey' data-value='" + this.id_ + "'></div>");
        key_elem.css("left", `calc(${this.left}vh + (100vw - 163.5vh) / 2)`);
        key_elem.css("width", `${this.width}vh`);
        key_elem.css("height", `${this.height}vh`);
        key_elem.css("top", `${top}vh`);
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

    for (group of keyboardKeys) {
        group.toDom(parent);
    }
}

var generateFunctionKeys = () => {
    let top = LAYOUT_TOP;
    let parent = $("#function-keys");

    for (row of functionKeys) {
        for (key of row) {
            key.toDom(parent, top);
        }
        top += LAYOUT_ROW_OFFSET;
    }
};

var initializeKeyboardKeys = () => {
    const defConfigs = {gap: 1, left: 0, height: 1};
    var defaultSession = true;
    var top = LAYOUT_TOP;

    var contentGroups = keyContent.split(/\r\n|\n/).reverse();

    for (let line of keyboardLayout.split(/\r\n|\n/)) {
        line = line.replace(/\s+/g, "");
        if (line.startsWith("!")) {
            if (!defaultSession) {
                console.warn("Cannot modify default setting after starting defining layout.");
                continue;
            }
            line = line.substring(1);
            let [param, val] = line.split("=");
            defConfigs[param] = Number(val);
        } else {
            if (line == "") continue;
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
                for (let keyCombo of layout.split(",")) {
                    let [times, width] = keyCombo.split(":");
                    width = Number(width);
                    for (let i = 0; i < times; i++) {
                        let keyContent = keyContents.pop().replace(/\//g, "<br/>");
                        keys.push(new KeyboardKey(keyContent, configs.left, width, configs.height));
                        configs.left += configs.gap + width;
                    }
                }
                keyboardKeys.push(new Group(top, keys));
            }
            top += nextTopOffset;
        }
    }
};

var initializeFunctionKeys = () => {
    for (let line of functionKeysConfig.split(/\r\n|\n/)) {
        let row = [];
        for (let key of line.split("; ")) {
            if (key == "") continue;
            let args = key.split(" ");
            row.push(new FunctionKey(...args));
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