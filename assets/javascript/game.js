  // Initialize Firebase
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
    waiting: false,
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
    },
    waitResponse: function(){     
        //show waiting on player modal
    },
    playGame: function() {
        if (game.roundwins == 2) {
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
        } else if (game.roundlosses === 10) {
            //how to determine if opponent left?
            game.matchReset();
        }
        else {
            game.playRound();
        }
    },
    playRound: function() {
        game.phase = 1;
        game.setTimer();
        //Display timer on screen
    },
    setTimer: function(){
        game.timer = 150;
        game.chooseChoice();
        game.intervalTime = setInterval(game.chooseChoice, 1000);
    },
    chooseChoice: function() {
        game.timer--;
        console.log(game.timer)
        $("#timer").attr("style", "display: block;");
        $("#remaining").text(game.timer);
        if (game.ready && game.oppReady) {
            clearInterval(game.intervalTime)
            console.log("ready")
            game.checkWinner();
        }
        if (game.timer <= 0) {
            clearInterval(game.intervalTime);
            game.outOfTime();
        }
    },
    checkWinner: function() {
        game.phase = 3;
        $("#opparea").text("");
        var oppIMG = $("<img>").attr("src", "assets/images/"+game.oppChoice+".png")
        $("#opparea").append(oppIMG);
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
    },
    outOfTime: function() {
        if (game.ready) {
            game.win("time")
        } else {
            game.lose("time")
        }
        game.round++;
    },
    win: function(value){
        console.log("win")
        game.roundwins++;
        $("#timer").attr("style", "display: none;")
        $("#winner").attr("style", "display: block;")
        setTimeout(game.resetRound, 3000);
    },
    lose: function(value){
        console.log("lose")
        game.roundlosses++;
        $("#timer").attr("style", "display: none;")
        $("#loser").attr("style", "display: block;")
         setTimeout(game.resetRound, 3000);
    },
    tie: function(){
        console.log("tie")
        $("#timer").attr("style", "display: none;");
        $("#tied").attr("style", "display: block;");
        setTimeout(game.resetRound, 3000);
    },
    resetRound: function() {
        game.ready = false;
        game.round++;
        $("#myarea").empty();
        $("#opparea").empty();
        $("#opparea").text("Waiting on Opponent");
        $("#loser").attr("style", "display: none;");
        $("#winner").attr("style", "display: none;");
        $("#tied").attr("style", "display: none;");
        $("#timer").attr("style", "display: block;");
        var update = {}
        update["/"+game.myID + "/choice"] = null;
        database.ref("/players").update(update);
        game.oppChoice = null;
        game.oppReady = false;

        game.playGame();
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
        var update1 = {};
        update1["/"+game.myID + "/challenge"] = false;
        update1["/"+game.myID + "/opponent"] = null;
        update1["/"+game.myID + "/status"] = "Available";
        update1["/"+game.myID + "/choice"] = null;
        database.ref("/players").update(update1);
        $("#gamezone").attr("style", "display: none;");
        $("#myModal").attr("style", "display: none;");
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
        game.players = data.val()
        var myopp = game.players[game.myID].opponent;
        console.log(myopp)
        if (game.players[game.myID].challenge == true && game.players[myopp].opponent == game.myID && game.waiting == true ) {
            //hide waiting on player modal
            $("#gamezone").attr("style", "display: block;");
            $("#myModal").attr("style", "display: block;");
            game.waiting = false;
            game.playGame();
        } else if (game.waiting == true && game.players[game.opponentID].challenge == false) {
            game.opponent = null;
            game.waiting = false;
        }   
    }
    
})

database.ref("/players").on("value", function(data){
    if (game.opponentID != null) {
        if (data.val()[game.opponentID].choice != undefined && (game.phase == 1 || game.phase == 2) ) {
            game.oppChoice = data.val()[game.opponentID].choice;
            game.oppReady = true;
            $("#opparea").text("Ready")
        }
    }
    
})


$("#namechoice").on("click", function(){
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
        update["/"+game.myID + "/displayName"] = game.myDisplayName
        database.ref("/players").update(update)
        $("#myModal").attr("style", "display:none;")
        $("#titlescreen").attr("style", "display:none;")
    }
})

$("#challenge").on("click", function() {
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
            alert("Sorry that player is busy, please challenge another.")
        }
    }
})

$("#accept").on("click", function() {
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
    var update = {};
    update["/"+game.opponentID + "/status"] = "Available";
    update["/"+game.myID + "/status"] = "Available";
    update["/"+game.myID + "/challenge"] = false;
    update["/"+game.myID + "/opponent"] = null;
    database.ref("/players").update(update);
    $("#challenger").text("");
    $("#challenged").attr("style", "display: none;")
    $("#myModal").attr("style", "display: none;")
})

$(".choice").on("click", function(){
    if (game.phase == 1){
        $("#myarea").empty();
        var newImg = $("<img>").attr("src", "assets/images/" + this.id +".png")
        game.players[game.myID].choice = this.id;
        $("#myarea").append(newImg);
    }
})

$("#makechoice").on("click", function(){
    console.log(game.players[game.myID].choice)
    if (game.players[game.myID].choice == null){
        alert("Please make a choice")
    } else{
        game.phase = 2;
        var update = {};
        update["/"+game.myID + "/choice"] = game.players[game.myID].choice;
        database.ref("/players").update(update);
        game.ready = true;
    }
})