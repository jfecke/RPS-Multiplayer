  // TO DO LIST
  // 
  // 3. Make Win, Lose, and Tie screens better
  // 4. Make Vitory or Defeat screens
  // 5. Make mobile
  // 6. Add Computer Opponent
  // 7. Add Sound
  //  
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
    alpha: "abcdefghijklmnopqrstuvwxyz0123456789-_",
    alphachat: "abcdefghijklmnopqrstuvwxyz,.?!$&_-+=:;' 0123456789",
    myID: null,
    myDisplayName: null,
    opponentID: null,
    oppDisplayName: null,
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
    choice: null,
    challengedStatus: false,
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
                game.oppDisplayName = game.players[game.opponentID].displayName;
                $("#challengename").text(game.players[game.opponentID].displayName);
                $("#challengewins").text(game.players[game.opponentID].wins);
                $("#challengelosses").text(game.players[game.opponentID].losses);
                }
            })
            $("#game-lobby").append(newRow);
        }
    },
    checkChallenge: function() {
        if (game.players[game.myID].status == "Busy" && game.players[game.myID].opponent != null) {
            game.challengedStatus = true;  
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
    challengeRevoked: function() {
        game.challengedStatus = false;
        game.opponentID = null;
        clearInterval(waitInterval);
        $("#challenged").attr("style", "display: none;")
        $("#myModal").attr("style", "display: none;")

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
        game.challengedStatus = false;
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
            setTimeout(game.checkWinner(), 2000) ;
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
        $("#oppIMG").attr("src", "assets/images/"+game.oppChoice+".png")
        $("#oppIMG").attr("style", "display: block;");
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
        game.phase = 3;
        if (game.ready == false && game.oppReady == false) {
            game.tie()
        } else if (game.ready) {
            game.win("time")
        } 
        else {
            game.lose("time")
        }
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
        console.log("resetRound");
        game.disCheck();
        game.ready = false;
        game.round++;
        $("#myarea").empty();
        $("#oppIMG").attr("style", "display: none;");
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
        game.choice = null;
        if (game.disconnect == true) {
            game.disCheck();
        } else {
            game.playGame();
        }
    },
    matchReset: function(){
        console.log("reset");
        game.ready = false;
        game.phase = 0;
        game.round = 1;
        game.roundwins = 0;
        game.roundlosses = 0;
        game.opponentID = null;
        game.oppDisplayName = null;
        game.oppChoice = null;
        game.choice = null;
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
        console.log("CancelWait");
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
        console.log("DECLINED");
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
        console.log("DISCONNECT");
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

database.ref("/players").on("value", function(data){  
    if (game.waiting == false) {
        game.players = data.val();
        game.playerIDs = Object.keys(data.val())
        game.populateLobby();
        game.checkChallenge();
    }
    if (game.waiting == true && game.players[game.opponentID].challenge !== undefined) {
        game.players = data.val();
        var myopp = game.players[game.myID].opponent;
        if (game.players[game.myID].challenge == true && game.players[myopp].opponent == game.myID && game.waiting == true ) {
            $("#waiting").attr("style", "display: none;");
            $("#gamezone").attr("style", "display: block;");
            game.waiting = false;
            game.challengedStatus = false;
            clearInterval(waitInterval);
            game.playGame();
        } else if (game.waiting == true && game.players[game.opponentID].challenge == false) {
            clearInterval(waitInterval);
            game.challengedStatus = false;
            game.cancelWait();
            console.log("Cancel Wait")
        }   
    }
    if (typeof(game.players[game.opponentID])=="undefined" && (game.phase == 1 || game.phase == 2)) {
        game.disconnect = true;
        console.log("Disconnet")
    }
    else if (game.opponentID != null) {
        if (data.val()[game.opponentID].choice != undefined && (game.phase == 1 || game.phase == 2) ) {
            game.oppChoice = data.val()[game.opponentID].choice;
            game.oppReady = true;
            $("#opptitle").attr("style", "display: block;");
            $("#opptitle").text("Ready");
        }
    }
    //if (game.challengedStatus == true && game.players[game.myID].status == "Available" ) {
    //    game.challengeRevoked();
    //    console.log("Revoked")
    }
});

database.ref("/messages").orderByChild("date").limitToLast(1).on("child_added", function(data) {
    var username = data.val().displayName;
    var message = data.val().message;
    var date = data.val().date;
    var messageid = data.val().messageid;
    if (Date.now()-date <=2000) {
        var newp = $("<p>").text("["+username+"]: " + message)
        if (username == game.myDisplayName) {
            newp.attr("style", "color: red");
        }
        $("#chat-window").append(newp);
    } else {
        update = {};
        update["/"+ messageid] = null;
        database.ref("/messages").update(update);
    }
})

$("#namechoice").on("click", function(){
    event.preventDefault();
    var chooseName = $("#name").val().trim();
    var unique = true;
    var isAlpha = true;
    for (var i = 0; i < chooseName.length; i++) {
        if (game.alpha.indexOf(chooseName[i].toLowerCase()) < 0 ) {
            isAlpha = false;
        }
    }
    for (var i = 0; i < game.playerIDs.length; i++) {
        if (game.players[game.playerIDs[i]]["displayName"] == chooseName) {
            unique = false;
        }
    }
    if (unique == false) {
        alert("Display Name is taken, please choose a different one.")
    } 
    else if (isAlpha == false) {
        alert("Please use only letters, numbers, '-', and '_' ")
    }
    else if (chooseName.length < 1) {
        $("#name").val("")
    }
    else if (chooseName.length > 11) {
        alert("Your name is too long, keep it under 112 characters.")
    }
    else {
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
    if (game.opponentID != null && game.oppDisplayName.length > 0) {
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
        game.choice = this.id;
    }
})

$("#makechoice").on("click", function(){
    event.preventDefault();
    if ( game.choice == null){
        
    } else if (game.phase == 1) {
        game.phase = 2;
        var newImg = $("<img>").attr("src", "assets/images/" + game.choice +".png")
        $("#myarea").append(newImg);

        var update = {};
        update["/"+game.myID + "/choice"] = game.choice;
        database.ref("/players").update(update);
        game.ready = true;
        $("#rock").attr("style", "border: none;");
        $("#paper").attr("style", "border: none;");
        $("#scissors").attr("style", "border: none;");
    }
})

$("#cancel").on("click", function(){
    event.preventDefault();
    game.cancelWait();
})

$("#chat").on("click", function() {
    var chatText = $("#talk").val().trim();
    var isAlpha = true;
    var userID = game.myDisplayName;
    var currentDate =  Date.now();
    for (var i = 0; i < chatText.length; i++) {
        if (game.alphachat.indexOf(chatText[i].toLowerCase()) < 0) {
            var isAlpha = false;
            console.log("Incorrect")
        }
    }
    if (chatText.length <= 100 & isAlpha == true) {
        var chatObj = {
            displayName: userID,
            message: chatText,
            date: currentDate
        }
        var pushid = database.ref("/messages").push(chatObj);
        update = {};
        update["/"+ pushid.path.pieces_[1]+ "/messageid"] = pushid.path.pieces_[1];
        database.ref("/messages").update(update);
        $("#talk").val("")
    }
})


