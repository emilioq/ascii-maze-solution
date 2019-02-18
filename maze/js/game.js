//  Emilio Quiambao [emilioquiambao@gmail.com]
//  Feb 2019
//
//  This program receives input from an ascii maze text file 
//  then produces a correspondingly laid out maze using tile sprites.
//  Pressing the button, a solution for the maze is generated and 
//  a character sprite will follow the solution path, if any.
//
//  All game assets used were freely provided by users on itch.io
//
//
// --- !! Change the maze text file here !! --- //

        var mzFile = 'data/maze4.txt'   

// --- !! Change the maze text file here !! --- //


var GameLayer = cc.Layer.extend({
    ctor:function() {
        this._super();
        this.init();
    },

    init:function() {
        this._super();
        var size = cc.director.getWinSize();
        var bg = cc.LayerColor.create(cc.color(50, 50, 50));
        this.addChild(bg);

        //calling file reader 
        this.readMazeFile(mzFile).then(strArray => {
            var strH = strArray.length;
            var strW = strArray[0].length;

            //generate maze tiles
            this.generateMaze(strArray, size.width, size.height, strW, strH);


            //solution button
            var button = ccui.Button.create("images/b1.png","images/b2.png","images/b2.png");
            button.setScale(0.25);
            button.setPosition(size.width * 0.90 , size.height - 15);
            
            button.addTouchEventListener(function(sender, type) {
                switch(type) {
                    case ccui.Widget.TOUCH_BEGAN:
                        break;
                    case ccui.Widget.TOUCH_ENDED:
                        if(sender.parent.findSolution(strArray, 0,1)) {
                            sender.setTitleText("SOLUTION FOUND");
                            sender.setTitleColor(cc.color(255,255,55));
                            cc.audioEngine.playEffect("sounds/start.mp3");
                        } else {
                            sender.setTitleText("NO SOLUTION");
                            sender.setTitleColor(cc.color(255));
                        }
                        sender.setBright(false);
                        sender.setEnabled(false);
                        break;
                    default:
                        break;
                }
            });
            
            button.setTitleText("FIND SOLUTION");
            button.setTitleFontName("CREBER");
            button.setTitleFontSize(16*4);
            button.setTitleColor(cc.color(0));
            
            this.addChild(button, 0);
        });


        //maze file label
        var label = cc.LabelTTF.create(mzFile.substr(5, mzFile.length).toUpperCase(), "CREBER", 12*4);
        label.setScale(0.25);
        label.setPosition(30, size.height - 12);
        label.setColor(cc.color(111,11,111));
        this.addChild(label, 1);

    },


    //function: reads text file, splits each line, returns data as string array
    readMazeFile: async function(file) {
        var str;

        await fetch(file)
        .then(response => response.text())
        .then(data => {
            str = data.split(/\r?\n/);
        })
        .catch(error => {                 
            console.log("Something went wrong.")
       });
       
        return str;
    },

    //function: generates tile sprites according to file data
    generateMaze: function(strArray, w, h, strW, strH) {
        for(let i = 0; i < strArray.length; i++) {
            for(let j = 0; j < strArray[i].length; j++) {
                
                //Grass Tile
                let tile = cc.Sprite.create("images/tileset.png", cc.rect(0,0,30,30))

                //Path Tile
                if(strArray[i].charAt(j) == ' ') {
                    tile = cc.Sprite.create("images/tileset.png", cc.rect(32,64,30,30))
                }

                //Edge Tile (Bottom)
                if(i === strArray.length - 1) {
                    tile = cc.Sprite.create("images/tileset.png", cc.rect(32,32*7,30,30));
                }

                //Edge Tile (Side)
                if(j === strArray[0].length - 1) {
                    tile = cc.Sprite.create("images/tileset.png", cc.rect(0,32*8,30,30));
                    if(i === strArray.length - 1) {
                        tile = cc.Sprite.create("images/tileset.png", cc.rect(32*5,32*6,30,30));
                    }
                }

                tile.setPosition(j*30,h-i*30) ;
                tile.setAnchorPoint(0,1);
                tile.setScale(1);
                this.addChild(tile, 0);
            }
        }

        //Start line
        var startLabel = cc.LabelTTF.create("START", "CREBER", 12*4);
        startLabel.setScale(0.25);
        startLabel.setPosition(30, h - 45);
        startLabel.setColor(cc.color(0));
        this.addChild(startLabel, 1);

        //Finish line
        var finLabel = cc.LabelTTF.create("FINISH", "CREBER", 12*4);
        finLabel.setScale(0.25);
        finLabel.setPosition(strW*30-60, h-strH*30+45);
        finLabel.setColor(cc.color(0));
        this.addChild(finLabel, 1); 

    },

    //function: calculates maze solution
    findSolution: function(sol, X, Y) {
        //is out of boundaries?
        if(X < 0 || X >=  sol[0].length || Y < 0 || Y >= sol.length) {
            return false;
        }

        //is current position goal?
        if(X === sol[0].length-1 && Y === sol.length-2) {
            //if goal, end recursion and render solution path
            this.generateSolution(sol);
            return true;
        }
        
        //is current position not open?
        if(sol[Y][X] !== ' ') {
            return false;
        }
        
        //mark solution path
        sol[Y] = this.markPath(sol[Y], X, 'O');

        //try north
        if(this.findSolution(sol, X, Y-1) === true) {
            return true;
        }

        //try east
        if(this.findSolution(sol, X+1, Y) === true) {
            return true;
        }

        //try south
        if(this.findSolution(sol, X, Y+1) === true) {
            return true;
        }

        //try west
        if(this.findSolution(sol, X-1, Y) === true) {
            return true;
        }

        //block from solution path
        sol[Y] = this.markPath(sol[Y], X, 'X');


        return false;
    },

    //function: generates tile sprites according to solution path
    generateSolution: function(sol) {
        var size = cc.director.getWinSize();
        for(let i = 0; i < sol.length; i++) {
            for(let j = 0; j < sol[i].length; j++) {

                //Solution Tile (Coins)
                if(sol[i].charAt(j) == 'O') {
                    let tile = cc.Sprite.create("images/c.png")
                    tile.setPosition(j*30 + 7,size.height-(i*30) - 6) ;
                    tile.setAnchorPoint(0,1);
                    tile.setScale(0.05);
                    this.addChild(tile, 0);
                }
            }
        }

        //animate character sprite
        this.animateHero(sol);
    },

    //function: returns a string with a specified index replaced
    markPath: function(str, index, char) {
        return  str.substr(0, index) + char + str.substr(index+1, str.length);
    },

    //function: animates character sprite to follow solution path
    animateHero: function(path){
        var x = 0;
        var y = 1;
        var solX = 0;
        var solY = 0;
        var w = cc.director.getWinSize().width;
        var h = cc.director.getWinSize().height;

        //create hero sprite
        var hero = cc.Sprite.create("images/p_walk.png", cc.rect(16,32,32,32));
        hero.setAnchorPoint(0,1);
        hero.setPosition(-3, h-(y*30)+12);
        this.addChild(hero, 1);

        //create walk animation loop
        var animation = new cc.Animation();
        for(let i = 0; i < 3; i++) {
            let frame = cc.SpriteFrame.create("images/p_walk.png", cc.rect(16 + (i*64),32,32,32));
            animation.addSpriteFrame(frame);
        }
        animation.setDelayPerUnit(1/12);
        animation.setRestoreOriginalFrame(true);
        var anim = new cc.RepeatForever(cc.animate(animation));
        hero.runAction(anim);

        //array for animated solution path
        var solPath = [
            cc.p(0, 0),
        ];

        //calculate path
        while(true) {
            console.log(path);
            if(path[y].charAt(x+1) == 'O') {       //try east
                solX+=30;
                solPath.push(cc.p(solX, solY));
                x++;
            } 
            
            else if(path[y+1].charAt(x) == 'O') {  //try south
                solY-=30;
                solPath.push(cc.p(solX, solY));
                y++;
            } 
            
            else if(path[y-1].charAt(x) == 'O') { //try north
                solY+=30;
                solPath.push(cc.p(solX, solY));
                y--;
            } 
            
            else if(path[y].charAt(x-1) == 'O') { //try west
                solX-=30;
                solPath.push(cc.p(solX, solY));
                x--;
            } 

            //break if no more options
            else {    
                break;
            }

            //mark visited paths
            path[y] = this.markPath(path[y], x, 'X');
        }


        //end jumping animation
        var end = function() {
            hero.stopAction(anim);
            cc.audioEngine.playEffect("sounds/end.mp3");

            var jump = new cc.Animation();
            for(let i = 0; i < 5; i++) {
                let frame = cc.SpriteFrame.create("images/p_jump.png", cc.rect(16 + (i*64),25,64,64));
                jump.addSpriteFrame(frame);
            }
            jump.setDelayPerUnit(1/10);
            jump.setRestoreOriginalFrame(true);
            var anim2 = new cc.RepeatForever(cc.animate(jump));
            hero.runAction(anim2);
        }

        //animate solution
        var move = cc.cardinalSplineBy(10, solPath, 1);
        hero.runAction(cc.sequence(move, cc.callFunc(end, this)));
        


    },

    onEnter:function() {
        this._super();
    }
});

GameLayer.scene = function() {
    var scene = new cc.Scene();
    var layer = new GameLayer();
    scene.addChild(layer);
    return scene;
}


window.onload = function(){
    var targetWidth = 960;
    var targetHeight = 640;

    cc.game.onStart = function(){
        //browser window maintains aspect ratio of game
        cc.view.adjustViewPort(false);
        cc.view.setDesignResolutionSize(targetWidth, targetHeight, cc.ResolutionPolicy.SHOW_ALL);
        cc.view.resizeWithBrowserSize(true);

        //load resources
        cc.LoaderScene.preload(["images/HelloWorld.png"], function () {
            cc.director.runScene(GameLayer.scene());
        }, this);
    };
    cc.game.run("gameCanvas");
};