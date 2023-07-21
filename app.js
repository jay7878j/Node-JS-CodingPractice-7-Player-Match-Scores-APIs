const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDataBaseAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite.Database,
    });

    app.listen(3000, () => {
      console.log("Server Starts Running");
    });
  } catch (error) {
    console.log(`db error: ${error.message}`);
  }
};

initializeDataBaseAndServer();

const convertToCamelCase = (data) => {
  return {
    playerId: data.player_id,
    playerName: data.player_name,
    matchId: data.match_id,
    match: data.match,
    year: data.year,
    playerMatchId: data.player_match_id,
    score: data.score,
    fours: data.fours,
    sixes: data.sixes,
  };
};

// API 1 Get All Players Data from Player_Details Table

app.get("/players/", async (request, response) => {
  const allPlayersQuery = `
    SELECT
        *
    FROM
        player_details
    `;
  const responseData = await db.all(allPlayersQuery);
  response.send(responseData.map((each) => convertToCamelCase(each)));
});

// API 2 Get Specific Player Data from Player_Details Table

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;

  const specificPlayerDataQuery = `
    SELECT 
        *
    FROM
        player_details
    WHERE
        player_id = ${playerId}
    `;
  const responseData = await db.get(specificPlayerDataQuery);
  response.send(convertToCamelCase(responseData));
});

// API 3 Update Player Details of a Specific Player

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const updatePlayerDetails = request.body;
  const { playerName } = updatePlayerDetails;

  const updatePlayerDataQuery = `
    UPDATE 
        player_details
    SET
        player_name = "${playerName}"
    WHERE
        player_id = ${playerId}
    `;
  await db.run(updatePlayerDataQuery);
  response.send("Player Details Updated");
});

// API 4 Get A Specific Match Details Data from match_details Table

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;

  const specificMatchDataQuery = `
    SELECT 
        *
    FROM
        match_details
    WHERE
        match_id = ${matchId}
    `;
  const responseData = await db.get(specificMatchDataQuery);
  response.send(convertToCamelCase(responseData));
});

// API 5 Get All Matches of a Player

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;

  const playerAllMatchesQuery = `
    SELECT 
        match_details.match_id as matchId,
        match_details.match as match,
        match_details.year as year
    FROM
        match_details INNER JOIN player_match_score ON player_match_score.match_id = match_details.match_id
    WHERE 
        player_match_score.player_id = ${playerId}
    `;
  const responseData = await db.all(playerAllMatchesQuery);
  response.send(responseData);
});

// API 6 Get All Players Based on Particular Match

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;

  const matchAllPlayersQuery = `
    SELECT 
        player_details.player_id as playerId,
        player_details.player_name as playerName
    FROM
        player_details INNER JOIN player_match_score ON player_match_score.player_id = player_details.player_id
    WHERE 
        player_match_score.match_id = ${matchId}
    `;
  const responseData = await db.all(matchAllPlayersQuery);
  response.send(responseData);
});

// API 7 Get Statistics of the total score, fours, sixes of a specific player

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;

  const playerStatisticsQuery = `
    SELECT 
        player_details.player_id as playerId,
        player_details.player_name as playerName,
        sum(player_match_score.score) as totalScore,
        sum(player_match_score.fours) as totalFours,
        sum(player_match_score.sixes) as totalSixes
    FROM
        player_details INNER JOIN player_match_score ON player_match_score.player_id = player_details.player_id
    WHERE
        player_match_score.player_id = ${playerId}
    `;
  const responseData = await db.get(playerStatisticsQuery);
  response.send(responseData);
});

module.exports = app;
