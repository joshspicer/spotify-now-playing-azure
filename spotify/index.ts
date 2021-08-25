import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { exit } from "process";
import FormData = require('form-data');
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { AuthPayload, NowPlaying } from "./contracts";
import { date } from "azure-storage";
var azure = require('azure-storage');



const refreshToken = async function (context: Context): Promise<string> {

    const tableName = process.env['TableName']
    const storageKey = process.env['StorageKey'];
    const storageAccountName = process.env['StorageAccountName'];

    if (!storageKey) {
        console.log("ERR: StorageKey not set!")
        context.res.status = 400;
    }

    var tableSvc = azure.createTableService(storageAccountName, storageKey);
    
    const refreshToken = process.env["RefreshToken"] ?? ""
    const clientIdSecret = process.env["ClientIdSecret"] ?? ""

    if (!refreshToken || !clientIdSecret) {
        console.error("Either refreshToken or clientIdSecret not set");
        exit(1);
    }

    // application/x-www-form-urlencoded parameters
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', refreshToken);

    const headers: Readonly<Record<string, string>> = {
        "Authorization": `Basic ${clientIdSecret}`,
    };

    try {
        const res = await axios.post('https://accounts.spotify.com/api/token', params, { headers })

        if (res.status > 299) {
            console.error("Error response during refreshToken api call to spotify", res.statusText)
            context.res.status = res.status;
        }
        
        const authPayload: AuthPayload = res.data

        // Store this away in our db
        var updatedTask = {
            PartitionKey: { '_': 'primary' },
            RowKey: { '_': 'auth' },
            Token: { '_': authPayload.access_token },
            // Right before this token will expire
            Expiry: {'_': date.minutesFromNow(55) }
        };

        tableSvc.insertOrReplaceEntity(tableName, updatedTask, function(error, result, response){
            if(error) {
              console.error(error)
              context.res.status = 400;
            }
            // Success
          });
    
        // Return the access token we just stored away.
        return authPayload.access_token

    } catch (err) {
        console.error(err)
        context.res.status = 400;
    }
}


const getNowPlaying = async function (accessToken: string, context: Context): Promise<NowPlaying> {

    let songName = ""
    let isPlaying = false
    let artistName = ""
    let response = ""

    const headers: Readonly<Record<string, string>> = {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
    };

    const res = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', { headers })

    if (res.status > 299) {
        console.error("Error with currently-playing API call.", res.statusText)
        context.res.status = res.status;
    }

    const responseJson = JSON.parse(res.data)

    isPlaying = responseJson.item.name

    return {

    }
    



    return {
        artistName,
        isPlaying,
        response,
        songName
    }
}


// Entrypoint
const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest, cachedAuth: any): Promise<void> {

    let accessToken = cachedAuth.Token;
    const expiry = new Date(cachedAuth.Expiry)

    const now = new Date()
    console.log(`Comparing ${expiry} <= ${now}`)
    if (expiry <= now) {
        console.log("refreshing....")
        accessToken = await refreshToken(context)
    }

    const nowPlaying: NowPlaying = await getNowPlaying(accessToken, context);

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: JSON.stringify(nowPlaying),
    };
};

export default httpTrigger;