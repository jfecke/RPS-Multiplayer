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
var newplayer = {};

var game = {
    myID: null,
    myDisplayName: null,
    opponentID: null,
    opDisplayName: null,
    wins: 0,
    loseses: 0,
    myConnect: [],
    players: {},
    playerIDs: [],
    assignPlayer: function() {
        newplayer = {
            displayName: game.myDisplayName,
            wins: game.wins,
            losses: game.loseses,
            challenge: false,
            opponent: null,
            status: "Available"
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
        alert("waiting for response!")
        database.ref("/players").on("value", function(data){
            game.players = data.val();
            game.playerIDs = Object.keys(data.val())
            var myopp = game.players[game.myID].opponent;
            if (game.players[game.myID].challenge == true && game.players[myopp].opponent == game.myID ) {
                $("#gamezone").attr("style", "display: block;");
                $("#myModal").attr("style", "display: block;");
            } else if (game.players[game.opponentID].opponent == null) {
                game.opponent = null;

            }         
            
        })
    }
};

connectedRef.on("value", function(snap) {
    // If they are connected..
    if (snap.val()) {
        
        // Add user to the connections list.
        var con = connectionsRef.push(true);
        playerid = game.assignPlayer();
        

        // Remove user from the connection list when they disconnect.
        con.onDisconnect().remove();
        playerid.onDisconnect().remove();
    }
});

connectionsRef.on("value", function(snap) {
    
    // Display the viewer count in the html.
    // The number of online users is the number of children in the connections list.

});

setTimeout(function() {})

database.ref("/players").on("value", function(data){
    game.players = data.val();
    game.playerIDs = Object.keys(data.val())
    game.populateLobby();
    game.checkChallenge();

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
    if (game.opponentID == null) {

    } else {
        if (game.players[game.opponentID].status == "Available") {
            var update = {};
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
    $("#gamezone").attr("style", "display: block;")
    $("#challenged").attr("style", "display: none;")
    $("#myModal").attr("style", "display: block;")
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