$(function(){
    var explanations = {};
    $.getJSON("json/key.json", function(res){
        explanations = res;
    })

    Key = function(id_, left, width, height){
        this.id_ = id_;
        this.left = left;
        this.width = width;
        this.height = height || 9.8;
    };

    var generateKeys = (keys) => {
        var top = 1.8;
    
        for (row of keys) {
            for (key of row) {
                let key_elem = $("<div class='key' data-value='" + key.id_ + "'></div>");
                key_elem.css("left", (key.left - 24.56)*$(window).height()/100+ $("#keyboard .ui.image").offset().left);
                key_elem.css("width", key.width*$(window).height()/100);
                key_elem.css("height", key.height*$(window).height()/100);
                key_elem.css("top", top*$(window).height()/100);
                $("#keys").append(key_elem);
            }
            top += 11.1;
        }

        console.log("Regenerate keys.");
    }

    var keys = [ //[r, k, (left, width, height)]
        [new Key("1", 159.5, 27.5)],
        [new Key("I", 37, 65.5), new Key("J", 149, 9.8), new Key("K", 160.2, 9.8), new Key("L", 171.4, 15.8)],
        [
            new Key("8", 42.6, 9.8), new Key("9", 53.8, 9.8), new Key("A", 65, 9.8),
            new Key("B", 76.2, 9.8), new Key("C", 87.4, 9.8), new Key("D", 98.6, 9.8),
            new Key("E", 143.6, 9.8), new Key("F", 154.8, 9.8), new Key("G", 166, 9.8), new Key("H", 177.2, 9.8)
        ],
        [
            new Key("3", 44.8, 9.8), new Key("4", 56, 9.8), new Key("5", 67.2, 9.8),
            new Key("6", 134.6, 9.8), new Key("7", 157, 9.8), new Key("P", 168.2, 18.8)
        ],
        [
            new Key("Q", 25.6, 23.4), new Key("2", 50.4, 77.3), new Key("M", 129, 9.8), 
            new Key("N", 140.2, 9.8), new Key("O", 151.4, 9.8), new Key("Q", 162.6, 24.6)
        ],
        [
            new Key("R", 25.6, 12.2, 12), new Key("S", 50.4, 9.8, 12), new Key("S", 129, 9.8, 12), 
            new Key("R", 140.2, 9.8, 12), new Key("1", 151.6, 35.6, 12)
        ]
    ];

    generateKeys(keys);

    $(window).resize(function(){
        $(".key").remove();
        generateKeys(keys);
    });

    $(".key").hover(function(){
        $("#explanation").html("<div class='line'>" + explanations[$(this).attr("data-value")].split("<br>").join("</div><div class='line'>") + "</div>");
    }, function(){
        $("#explanation").html("<div class='line'>Point on a key or a key group to see the command of it.</div>");
    })
})