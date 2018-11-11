  // TO DO LIST
  // 3. Create Chat window in lobby
  // 4. Make display name resitrictions and checks
  // 5. Make Win, Lose, and Tie screens better
  // 6. Make Vitory or Defeat screens
  // 7. Make mobile
  // 8. Add Sound
  // 9. 
var config = {
apiKey: "AIzaSyC57IjpWiDzhAPtF_RDyU61ssXIzQU8Qi4",
authDomain: "rps-multiplayer-2dcb5.firebaseapp.com",
databaseURL: "https://rps-multiplayer-2dcb5.firebaseio.com",
projectId: "rps-multiplayer-2dcb5",
storageBucket: "rps-multiplayer-2dcb5.appspot.com",
messagingSenderId: "185022119661"
};
firebase.initializeApp(config);
var database = firebase.database();
var connectionsRef = database.ref("/connections");
var connectedRef = database.ref(".info/connected");

var game = {
    alpha: "abcdefghijklmnopqrstuvwxyz",
    alphachat: "abcdefghijklmnopqrstuvwxyz,.?!$&_-+=:;' ",
    myID: null,
    myDisplayName: null,
    opponentID: null,
    opDisplayName: null,
    oppChoice: "",
    oppReady: false,
    wins: 0,
    losses: 0,
    myConnect: [],
    players: {},
    playerIDs: [],
    phase: 0,
    round: 1,
    roundwins: 0,
    roundlosses: 0,
    intervalTime: null,
    waitInterval: null,
    waiting: false,
    oppIMG: null,
    disconnect: false,
    assignPlayer: function() {
        var newplayer = {};
        newplayer = {
            displayName: game.myDisplayName,
            wins: game.wins,
            losses: game.losses,
            challenge: false,
            opponent: null,
            status: "Available",
            choice: null
        }     
        var playerid = database.ref("/players").push(newplayer);
        game.myID = playerid.path.pieces_[1];
        return playerid;
    },
    populateLobby: function(){
        $("#game-lobby").empty();
        var initialRow = $("<tr>");
        var name1  = $("<th>").text("Display Name");
        var win1  = $("<th>").text("Wins");
        var lose1  = $("<th>").text("Lossses");
        var status1  = $("<th>").text("Status");
        initialRow.append(name1, win1, lose1, status1);
        $("#game-lobby").append(initialRow);

        for (var i = 0; i < game.playerIDs.length; i++) {
            var newRow = $("<tr>");
            var name  = $("<td>").text(game.players[game.playerIDs[i]].displayName);
            var win  = $("<td>").text(game.players[game.playerIDs[i]].wins);
            var lose  = $("<td>").text(game.players[game.playerIDs[i]].losses);
            var status  = $("<td>").text(game.players[game.playerIDs[i]].status);
            newRow.append(name, win, lose, status);
            newRow.attr("id", game.playerIDs[i]);
            newRow.on("click", function() {
                
                if (this.id != game.myID) {
                game.opponentID = this.id
                console.log(this.id)
                    
                $("#challengename").text(game.players[game.opponentID].displayName);
                $("#challengewins").text(game.players[game.opponentID].wins);
                $("#challengelosses").text(game.players[game.opponentID].losses);
                
                }
            } )
            $("#game-lobby").append(newRow);
        }
    },
    checkChallenge: function() {
        if (game.players[game.myID].status == "Busy" && game.players[game.myID].opponent != null) {
            game.challengeResponse();   
        }
    },
    challengeResponse: function() {
        game.opponentID = game.players[game.myID].opponent
        var oppname = game.players[game.opponentID].displayName;
        $("#challenger").text(oppname);
        $("#challenged").attr("style", "display: block;")
        $("#myModal").attr("style", "display: block;")
        var waittime = 10;
        waitInterval = setInterval(function(){
            waittime--
            $("#waittime").text(waittime);
            if (waittime <= 0) {
                clearInterval(waitInterval);
                game.decline();
            }
        }, 1000);
    },
    waitResponse: function(){     
        $("#waiting").attr("style", "display: block;");
        $("#myModal").attr("style", "display: block;");
        var waittime = 10;
        waitInterval = setInterval(function(){
            waittime--
            $("#waittime").text(waittime);
            if (waittime <= 0) {
                clearInterval(waitInterval);
                game.cancelWait();
            }
        }, 1000);
    },
    playGame: function() {
        if (game.roundwins >= 2) {
            game.wins++;
            var update = {};
            update["/"+game.myID + "/wins"] = game.wins;
            database.ref("/players").update(update);
            game.matchReset();
        } else if (game.roundlosses >= 2) {
            game.losses++;
            var update = {};
            update["/"+game.myID + "/losses"] = game.losses;
            database.ref("/players").update(update);
            game.matchReset();
        } else {
            game.playRound();
        }
    },
    playRound: function() {
        game.phase = 1;
        game.setTimer();
    },
    setTimer: function(){
        game.timer = 10;
        game.chooseChoice();
        game.intervalTime = setInterval(game.chooseChoice, 1000);
    },
    chooseChoice: function() {
        game.timer--;
        $("#timer").attr("style", "display: block;");
        $("#remaining").text(game.timer);
        if (game.ready && game.oppReady) {
            clearInterval(game.intervalTime)
            game.checkWinner();
        }
        if (game.timer <= 0) {
            clearInterval(game.intervalTime);
            game.outOfTime();
        }
        if (game.disconnect == true) {
            game.disCheck();
        }
    },
    checkWinner: function() {
        game.phase = 3;
        $("#opptitle").attr("style", "display: none;");
        oppIMG = $("<img>").attr("src", "assets/images/"+game.oppChoice+".png")
        $("#opparea").append(oppIMG);
        if (game.disconnect == true) {
            game.disCheck();
        } else {
            if (game.players[game.myID].choice == "rock") {
                if (game.oppChoice == "rock") {
                    game.tie();
                } else if (game.oppChoice == "scissors") {
                    game.win("rock");
                } else {
                    game.lose("rock")
                }
            } else if (game.players[game.myID].choice == "paper"){
                if (game.oppChoice == "paper") {
                    game.tie();
                } else if (game.oppChoice == "rock") {
                    game.win("paper");
                } else {
                    game.lose("paper")
                }
            } else {
                if (game.oppChoice == "scissors") {
                    game.tie();
                } else if (game.oppChoice == "paper") {
                    game.win("scissors");
                } else {
                    game.lose("scissors")
                }
            }
        }
    },
    outOfTime: function() {
        game.disCheck();
        if (game.ready == false && game.oppReady == false) {
            game.tie()
        } else if (game.ready) {
            game.win("time")
        } 
        else {
            game.lose("time")
        }
        game.round++;
    },
    win: function(value){
        game.disCheck();
        game.roundwins++;
        $("#timer").attr("style", "display: none;")
        $("#winner").attr("style", "display: block;")
        if (game.disconnect == true) {
            game.disCheck();
        } else {
            setTimeout(game.resetRound, 3000);
        }
    },
    lose: function(value){
        game.disCheck();
        game.roundlosses++;
        $("#timer").attr("style", "display: none;")
        $("#loser").attr("style", "display: block;")
        if (game.disconnect == true) {
            game.disCheck();
        } else {
            setTimeout(game.resetRound, 3000);
        }
    },
    tie: function(){
        $("#timer").attr("style", "display: none;");
        $("#tied").attr("style", "display: block;");
        if (game.disconnect == true) {
            game.disCheck();
        } else {
            setTimeout(game.resetRound, 3000);
        }
    },
    resetRound: function() {
        game.disCheck();
        game.ready = false;
        game.round++;
        $("#myarea").empty();
        if (typeof(oppIMG) != "undefined") {
            oppIMG.remove();
        }
        $("#opptitle").attr("style", "display: block;");
        $("#opptitle").text("Waiting on Opponent");
        $("#loser").attr("style", "display: none;");
        $("#winner").attr("style", "display: none;");
        $("#tied").attr("style", "display: none;");
        $("#timer").attr("style", "display: block;");
        var update = {}
        update["/"+game.myID + "/choice"] = null;
        database.ref("/players").update(update);
        game.oppChoice = null;
        game.oppReady = false;
        if (game.disconnect == true) {
            game.disCheck();
        } else {
            game.playGame();
        }
    },
    matchReset: function(){
        game.ready = false;
        game.phase = 1;
        game.round = 1;
        game.roundwins = 0;
        game.roundlosses = 0;
        game.opponentID = null;
        game.opDisplayName = null;
        game.oppChoice = null;
        game.oppReady = false;
        game.disconnect = false;
        var update1 = {};
        update1["/"+game.myID + "/challenge"] = false;
        update1["/"+game.myID + "/opponent"] = null;
        update1["/"+game.myID + "/status"] = "Available";
        update1["/"+game.myID + "/choice"] = null;
        database.ref("/players").update(update1);
        $("#gamezone").attr("style", "display: none;");
        $("#myModal").attr("style", "display: none;");
        $("#challengename").text("");
        $("#challengewins").text("");
        $("#challengelosses").text("");
    },
    cancelWait: function() {
        $("#waiting").attr("style", "display: none;");
        $("#myModal").attr("style", "display: none;");
        var update = {};
        update["/"+game.opponentID + "/status"] = "Available";
        update["/"+game.myID + "/status"] = "Available";
        update["/"+game.opponentID + "/challenge"] = false;
        update["/"+game.opponentID + "/opponent"] = null;
        database.ref("/players").update(update);
        game.opponentID = null;
        game.waiting = false;
        $("#challengename").text("");
        $("#challengewins").text("");
        $("#challengelosses").text("");
    },
    decline: function() {
        var update = {};
        update["/"+game.opponentID + "/status"] = "Available";
        update["/"+game.myID + "/status"] = "Available";
        update["/"+game.myID + "/challenge"] = false;
        update["/"+game.myID + "/opponent"] = null;
        database.ref("/players").update(update);
        $("#challenger").text("");
        $("#challenged").attr("style", "display: none;")
        $("#myModal").attr("style", "display: none;")
    },
    disCheck: function() {
        if (game.disconnect == true) {
            clearInterval(game.intervalTime);
            game.matchReset();
        }
    } 
};

connectedRef.on("value", function(snap) {
    if (snap.val()) {
        var playerid = game.assignPlayer();
        playerid.onDisconnect().remove();
    }
});

//database.ref().on("child-added", function(snapshot) {});  only new records added
//database.ref().orderbyChild("dateadded").limitToLast(1).on("child-added", function(snapshot) {});
//onChildRemoved 
database.ref("/players").on("value", function(data){  
    if (game.waiting == false) {
        game.players = data.val();
        game.playerIDs = Object.keys(data.val())
        game.populateLobby();
        game.checkChallenge();
    } 
});

database.ref("/players").on("value", function(data){  
    if (game.waiting == true && game.players[game.opponentID].challenge !== undefined) {
        game.players = data.val();
        var myopp = game.players[game.myID].opponent;
        if (game.players[game.myID].challenge == true && game.players[myopp].opponent == game.myID && game.waiting == true ) {
            $("#waiting").attr("style", "display: none;");
            $("#gamezone").attr("style", "display: block;");
            game.waiting = false;
            clearInterval(waitInterval);
            game.playGame();
        } else if (game.waiting == true && game.players[game.opponentID].challenge == false) {
            game.opponent = null;
            game.waiting = false;
            clearInterval(waitInterval);
        }   
    }
})

database.ref("/players").on("value", function(data){
    if (typeof(game.players[game.opponentID])=="undefined" && (game.phase == 1 || game.phase == 2)) {
        console.log("That sucks!!")
        game.disconnect = true;
    }
    else if (game.opponentID != null) {
        if (data.val()[game.opponentID].choice != undefined && (game.phase == 1 || game.phase == 2) ) {
            game.oppChoice = data.val()[game.opponentID].choice;
            game.oppReady = true;
            $("#opptitle").attr("style", "display: block;");
            $("#opptitle").text("Ready");
        }
    }
})

database.ref("/messages").on("child_added", function(data){
    console.log(data.val());
    var username = data.val().displayName;
    var message = data.val().message;
    var newp = $("<p>").text("["+username+"]: " + message)
    console.log(username);
    $("#chat-window").append(newp);
})

$("#namechoice").on("click", function(){
    event.preventDefault();
    var chooseName = $("#name").val();
    var unique = true;
    
    for (var i = 0; i < game.playerIDs.length; i++) {
        if (game.players[game.playerIDs[i]]["displayName"] == chooseName) {
            unique = false;
        }
    }
    if (unique == false) {
        alert("Display Name is taken, please choose a different one.")
    } else {
        game.myDisplayName = chooseName;
        var update = {};
        update["/"+game.myID + "/displayName"] = game.myDisplayName;
        database.ref("/players").update(update);
        $("#myModal").attr("style", "display:none;");
        $("#titlescreen").attr("style", "display:none;");
    }
})

$("#challenge").on("click", function() {
    event.preventDefault();
    if (game.opponentID != null) {
        if (game.players[game.opponentID].status == "Available") {
        var update = {};
        game.waiting = true;
        update["/"+game.opponentID + "/status"] = "Busy";
        update["/"+game.myID + "/status"] = "Busy";
        update["/"+game.opponentID + "/challenge"] = true;
        update["/"+game.opponentID + "/opponent"] = game.myID;
        database.ref("/players").update(update);
        game.waitResponse();
        
        } else {
            alert("Sorry that player is busy, please challenge another.");
        }
    }
})

$("#accept").on("click", function() {
    event.preventDefault();
    clearInterval(waitInterval);
    var update = {};
    update["/"+game.opponentID + "/status"] = "In Game";
    update["/"+game.myID + "/status"] = "In Game";
    update["/"+game.opponentID + "/challenge"] = true;
    update["/"+game.opponentID + "/opponent"] = game.myID;
    database.ref("/players").update(update);
    $("#gamezone").attr("style", "display: block;");
    $("#challenged").attr("style", "display: none;");
    game.playGame();
})

$("#decline").on("click", function() {
    event.preventDefault();
    clearInterval(waitInterval);
    game.decline();
})

$(".choice").on("click", function(){
    event.preventDefault();
    if (game.phase == 1){
        $("#myarea").empty();
        $("#rock").attr("style", "border: none;");
        $("#paper").attr("style", "border: none;");
        $("#scissors").attr("style", "border: none;");
        $("#"+this.id).attr("style", "border: 7px solid #0086F1;");
        game.players[game.myID].choice = this.id;
        var update = {};
        update["/"+game.myID + "/choice"] = game.players[game.myID].choice;
        database.ref("/players").update(update);
    }
})

$("#makechoice").on("click", function(){
    event.preventDefault();
    if (game.players[game.myID].choice == null){
        alert("Please make a choice")
    } else{
        game.phase = 2;
        var newImg = $("<img>").attr("src", "assets/images/" + game.players[game.myID].choice +".png")
        $("#myarea").append(newImg);

        var update = {};
        update["/"+game.myID + "/choice"] = game.players[game.myID].choice;
        database.ref("/players").update(update);
        game.ready = true;
        $("#"+game.players[game.myID].choice).attr("style", "border: 7px solid #0086F1;");
    }
})

$("#cancel").on("click", function(){
    event.preventDefault();
    game.cancelWait();
})

$("#chat").on("click", function() {
    console.log("chat")
    var chatText = $("#talk").val().trim();
    var isAlpha = true;
    var userID = game.myDisplayName;
    var currentDate =  Date.now();
    for (var i = 0; i < chatText.length; i++) {
        if (game.alphachat.indexOf(chatText[i]) < 0) {
            var isAlpha = false;
            console.log("Incorrect")
        }
        
    }
    if (chatText.length <= 100 & isAlpha == true) {
        console.log("works")
        console.log(userID, chatText, currentDate)
        var chatObj = {
            displayName: userID,
            message: chatText,
            date: currentDate
        }
        console.log(chatObj)
        database.ref("/messages").push(chatObj);
        $("#talk").val("")
    }
    


})